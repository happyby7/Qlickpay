const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const StripeCheckoutSession = async (req, res) => {
  const { amount, orderId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Cuenta QlickPay',
            },
            unit_amount: Math.round(amount * 100), 
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: orderId,
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`, 
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Error al crear sesión de pago:', err);
    res.status(500).json({ error: 'No se pudo crear la sesión de pago.' });
  }
};

const StripeConfirmSuccess = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Falta el session_id en la query.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      return res.status(400).json({ error: 'Falta order_id en metadata de Stripe.' });
    }

    const [, tableId] = orderId.split('-');
    const tableIdNum = parseInt(tableId);

    if (isNaN(tableIdNum)) {
      return res.status(400).json({ error: 'tableId no válido.' });
    }

    await pool.query(
      `UPDATE tables SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [tableIdNum]
    );

    if (global.websocket) {
      global.websocket.updateStatusTable( 'updateTableStatus', JSON.stringify({ tableId: tableIdNum, status: 'paid' }));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error confirmando pago:', err);
    res.status(500).json({ error: 'Error al confirmar el pago' });
  }
};


module.exports = { StripeCheckoutSession, StripeConfirmSuccess};
