const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const activeCheckouts = new Set();
const checkoutTimeouts = new Map();

const StripeCheckoutSession = async (req, res) => {
  const { amount, orderId, metadata } = req.body;
  const [, tableIdStr] = orderId.split("-");
  const tableId = parseInt(tableIdStr, 10);

  if (activeCheckouts.has(tableId)) return res.status(409).json({ error: 'Ya hay un pago en curso para esta mesa. Por favor, espere y recargue la página.' });
     
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Cuenta QlickPay' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
        metadata: { order_id: orderId, ...metadata },
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BACKEND_URL}/api/payment/cancel-checkout?orderId=${orderId}`,
    });
    
    activeCheckouts.add(tableId);
    const timeout = setTimeout(() => {
      releaseCheckoutLock(tableId);
      stripe.checkout.sessions.expire(session.id).catch(() => {});
    }, 5 * 60 * 1000);
    
    checkoutTimeouts.set(tableId, timeout);
    
    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Error al crear sesión de pago:', err);
    res.status(500).json({ error: 'No se pudo crear la sesión de pago.' });
   }
};

function releaseCheckoutLock(tableId) {
  const to = checkoutTimeouts.get(tableId);
  if (to) {
    clearTimeout(to);
    checkoutTimeouts.delete(tableId);
  }
  activeCheckouts.delete(tableId);
}

const cancelCheckoutSession = (req, res) => {
  const { orderId } = req.query;
  const [, tableIdStr] = (orderId || "").split("-");
  const tableId = parseInt(tableIdStr, 10);

  releaseCheckoutLock(tableId);

  return res.redirect(`${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`);
};

const StripeConfirmSuccess = async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: 'Falta el session_id en la query.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const [, tableIdStr, mode] = session.metadata.order_id.split("-");
    const tableId = parseInt(tableIdStr, 10);

    if (mode === "split") {
      const items = JSON.parse(session.metadata.items);
      for (const { name, quantity } of items) {
        await payItemsByName(tableId, name, Number(quantity));
      }
    } else if (mode === "custom") {
      const amount = Number(session.metadata.custom_amount);
      // await payCustomAmount(tableId, amount);
    } else {
      await payAll(tableId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error confirmando pago:', err);
    res.status(500).json({ error: 'Error al confirmar el pago' });
  } finally {
    const [, tableIdStr] = (req.query.orderId || "").split("-");
    const tableId = parseInt(tableIdStr, 10);

    releaseCheckoutLock(tableId);
  }
};

async function payItemsByName(tableId, itemName, quantityToPay) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Recojer los "order_id" pending
    const { rows: orders } = await client.query(
      `SELECT id
         FROM orders
        WHERE table_id = $1
          AND status   = 'pending'
        ORDER BY created_at`,
      [tableId]
    );

    let toPay = quantityToPay;
    for (const { id: orderId } of orders) {
      if (toPay <= 0) break;

      // Marcar tantos order_items pendientes de ese nombre como toPay
      const { rows } = await client.query(
        `SELECT oi.id
           FROM order_items oi
           JOIN menu_items m ON oi.menu_item_id = m.id
          WHERE oi.order_id = $1
            AND m.name     = $2
            AND oi.status  = 'pending'
          ORDER BY oi.created_at
          LIMIT $3`,
        [orderId, itemName, toPay]
      );
      if (!rows.length) continue;

      const ids = rows.map(r => r.id);
      await client.query(
        `UPDATE order_items
           SET status     = 'paid',
               updated_at = NOW()
         WHERE id = ANY($1)`,
        [ids]
      );

      toPay -= ids.length;

      // Si no quedan más ítems pending en ese pedido, se marca
      await client.query(
        `UPDATE orders
           SET status     = 'paid',
               is_paid    = TRUE,
               updated_at = NOW()
         WHERE id = $1
           AND NOT EXISTS (
             SELECT 1
               FROM order_items oi
              WHERE oi.order_id = $1
                AND oi.status   = 'pending'
           )`,
        [orderId]
      );
    }

    // Si ya no hay pedidos pending en la mesa, se marca la mesa
    const result = await client.query(
      `UPDATE tables
         SET status     = 'paid',
             updated_at = NOW()
       WHERE id = $1
         AND NOT EXISTS (
           SELECT 1
             FROM orders o
            WHERE o.table_id = $1
              AND o.status   = 'pending'
         )`,
      [tableId]
    );
    if (result.rowCount > 0 && global.websocket) global.websocket.updateStatusTable('updateTableStatus',JSON.stringify({ tableId, status: 'paid' }));
    
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function payAll(tableId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Todos los items pendientes de todos los pedidos de la mesa a paid
    await client.query(
      `UPDATE order_items
         SET status = 'paid', updated_at = NOW()
       WHERE order_id IN (
         SELECT id FROM orders WHERE table_id = $1
       ) AND status = 'pending'`,
      [tableId]
    );

    // Todos los pedidos de la mesa a paid + is_paid = true
    await client.query(
      `UPDATE orders
         SET status = 'paid', is_paid = TRUE, updated_at = NOW()
       WHERE table_id = $1 AND status != 'paid'`,
      [tableId]
    );

    // Marcamos la mesa como pagada
    const result = await client.query(
      `UPDATE tables
         SET status = 'paid', updated_at = NOW()
       WHERE id = $1`,
      [tableId]
    );
    await client.query("COMMIT");

    if (result.rowCount > 0 && global.websocket) global.websocket.updateStatusTable("updateTableStatus", JSON.stringify({ tableId, status: "paid" }));
    
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { StripeCheckoutSession, StripeConfirmSuccess, cancelCheckoutSession};
