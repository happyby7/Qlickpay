const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const activeCheckouts = new Set();
const checkoutTimeouts = new Map();

function lock(tableId, sessionId) {
  activeCheckouts.add(tableId);
  const timeout = setTimeout(() => {
    release(tableId);
    stripe.checkout.sessions.expire(sessionId).catch(() => {});
  }, 3 * 60 * 1000);
  checkoutTimeouts.set(tableId, timeout);
}

function isActive(tableId) {
  return activeCheckouts.has(tableId);
}

function release(tableId) {
  const to = checkoutTimeouts.get(tableId);
  if (to) {
    clearTimeout(to);
    checkoutTimeouts.delete(tableId);
  }
  activeCheckouts.delete(tableId);
}

async function handleSuccessfulPayment(tableId, mode, metadata) {
  const client = await pool.connect();
  const items = JSON.parse(metadata.items);
  const amount = Number(metadata.custom_amount);

  try {
    await client.query('BEGIN');
    if (mode === 'split') {
      for (const { name, quantity } of items) {
        await payItemsByName(client, tableId, name, Number(quantity));
      }
    } else if (mode === 'custom') {
      await payCustomAmount(client, tableId, amount);
    } else {
      await payAll(client, tableId);
    }
    if (global.websocket) global.websocket.updateBill('updateBill', JSON.stringify({ tableId }));
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function payAll(client, tableId) {
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

async function payItemsByName(client, tableId, itemName, quantityToPay) {
    try {
        await client.query("BEGIN");
        // Lock para evitar race conditions
        await client.query(`SELECT pg_advisory_xact_lock($1)`, [tableId]);
    
        // Pedidos pendientes de esta mesa
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
    
          // Traer cada fila pendiente con quantity y subtotal ya como float
          const { rows } = await client.query(
            `SELECT
               oi.id,
               (oi.quantity  ::float) AS rowqty,
               (oi.subtotal  ::float) AS subtotal,
               oi.menu_item_id
             FROM order_items oi
             JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = $1
              AND m.name      = $2
              AND oi.status   = 'pending'
            ORDER BY oi.created_at`,
            [orderId, itemName]
          );
          if (!rows.length) continue;
    
          for (const { id: oiId, rowqty, subtotal, menu_item_id } of rows) {
            if (toPay <= 0) break;
    
            if (toPay >= rowqty) {
              // pago íntegro de toda la fila
              await client.query(
                `UPDATE order_items
                   SET status='paid', updated_at=NOW()
                 WHERE id=$1`,
                [oiId]
              );
              toPay -= rowqty;
            } else {
              // pago parcial -> creamos línea pagada y ajustamos la pendiente
              const paidQty      = toPay;
              const paidSubtotal = parseFloat((subtotal / rowqty * paidQty).toFixed(2));
              const leftoverQty  = parseFloat((rowqty - paidQty).toFixed(2));
              const leftoverSub  = parseFloat((subtotal - paidSubtotal).toFixed(2));
    
              // insertamos la parte pagada
              await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, quantity, subtotal, status)
                 VALUES ($1, $2, $3, $4, 'paid')`,
                [orderId, menu_item_id, paidQty, paidSubtotal]
              );
    
              // ajustamos la fila original
              await client.query(
                `UPDATE order_items
                   SET quantity   = $1,
                       subtotal   = $2,
                       updated_at = NOW()
                 WHERE id = $3`,
                [leftoverQty, leftoverSub, oiId]
              );
    
              toPay = 0;
            }
          }
    
          // si este pedido ya no tiene items 'pending', lo marcamos pagado
          await client.query(
            `UPDATE orders
               SET status   = 'paid',
                   is_paid  = TRUE,
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
    
        // si ya no quedan pedidos pendientes en la mesa, marcamos la mesa pagada
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
        if (result.rowCount > 0 && global.websocket) global.websocket.updateStatusTable( 'updateTableStatus', JSON.stringify({ tableId, status: 'paid' }));
        
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

async function payCustomAmount(client, tableId, amountToPay) {
    try {
        await client.query("BEGIN");
        // Lock
        await client.query(`SELECT pg_advisory_xact_lock($1)`, [tableId]);
    
        let remaining = amountToPay;
        // Traer ítems pendientes ordenados
        const { rows: items } = await client.query(`
          SELECT oi.id, oi.subtotal, oi.quantity
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.table_id = $1 AND oi.status = 'pending'
          ORDER BY oi.created_at
        `, [tableId]);
    
        for (const { id: oiId, subtotal, quantity: unitQty } of items) {
          if (remaining <= 0) break;
    
          if (remaining >= subtotal) {
            // pago total de este ítem
            await client.query(
              `UPDATE order_items SET status='paid', updated_at=NOW() WHERE id=$1`,
              [oiId]
            );
            remaining -= subtotal;
          } else {
            // pago parcial -> split
            const paidSubtotal = parseFloat(remaining.toFixed(2));
            const leftoverSubtotal = parseFloat((subtotal - remaining).toFixed(2));
            // cantidad proporcional pagada
            const paidQty = parseFloat(((paidSubtotal / subtotal) * unitQty).toFixed(2));
            const leftoverQty = parseFloat((unitQty - paidQty).toFixed(2));
    
            // insertar línea pagada con cantidad proporcional
            await client.query(`
              INSERT INTO order_items (order_id, menu_item_id, quantity, subtotal, status)
              SELECT order_id, menu_item_id, $1, $2, 'paid'
              FROM order_items WHERE id=$3
            `, [paidQty, paidSubtotal, oiId]);
    
            // actualizar la línea pendiente con lo que queda
            await client.query(`
              UPDATE order_items
                 SET quantity = $1,
                     subtotal = $2,
                     updated_at = NOW()
               WHERE id = $3
            `, [leftoverQty, leftoverSubtotal, oiId]);
    
            remaining = 0;
          }
        }
    
        // Marcar pedidos completos
        await client.query(`
          UPDATE orders
             SET status='paid', is_paid=TRUE, updated_at=NOW()
           WHERE id IN (
             SELECT o.id
               FROM orders o
              LEFT JOIN order_items oi
                ON oi.order_id = o.id AND oi.status='pending'
              WHERE o.table_id=$1
              GROUP BY o.id
              HAVING COUNT(oi.id)=0
           )`, [tableId]);
    
        // Marcar mesa pagada si no hay pedidos pending
        await client.query(`
          UPDATE tables
             SET status='paid', updated_at=NOW()
           WHERE id=$1
             AND NOT EXISTS (
               SELECT 1 FROM orders o
                WHERE o.table_id=$1 AND o.status='pending'
             )`, [tableId]);
    
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
}

module.exports = { createCheckoutSession: { lock, isActive }, releaseCheckoutLock: release, cancelCheckoutLock: release, handleSuccessfulPayment };
