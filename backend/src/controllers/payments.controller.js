const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCheckoutSession, releaseCheckoutLock, cancelCheckoutLock, handleSuccessfulPayment } = require('../models/payments.model');

const StripeCheckoutSession = async (req, res) => {
  const { amount, orderId, metadata } = req.body;
  const [, tableIdStr] = orderId.split("-");
  const tableId = parseInt(tableIdStr, 10);

  let session;

  if (createCheckoutSession.isActive(tableId)) return res.status(409).json({ error: 'Ya hay un pago en curso para esta mesa. Por favor, espere y recargue la página.' });
     
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
    
    createCheckoutSession.lock(tableId, session.id);
    
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error al crear sesión de pago:', err);
    res.status(500).json({error: 'No se pudo crear la sesión de pago.' });
   }
};

const StripeConfirmSuccess = async (req, res) => {
  const sessionId = req.query.session_id;
  let tableId;

  if (!sessionId) return res.redirect(302, `${process.env.FRONTEND_URL}/payment/cancel?error=Falta el session_id`);
  
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    tableId = parseInt(session.metadata.table_id, 10);
    const mode = session.metadata.mode; 
 
    await handleSuccessfulPayment(tableId, mode, session.metadata);

    res.json({ success: true });
  } catch (err) {
    console.error('Error confirmando pago:', err);
    return res.redirect(302, `${process.env.FRONTEND_URL}/payment/cancel?error=${err.message}`);
  } finally {
    if (typeof tableId === 'number') {
     releaseCheckoutLock(tableId);
    }
  }
};

const cancelCheckoutSession = (req, res) => {
  const { orderId, error } = req.query;
  const [, tableIdStr] = (orderId || "").split("-");
  const tableId = parseInt(tableIdStr, 10);

  let url = `${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`;

  cancelCheckoutLock(tableId);
  
  if (error) url += `&error=${encodeURIComponent(error)}`;
  return res.redirect(302, url);
};

module.exports = { StripeCheckoutSession, StripeConfirmSuccess, cancelCheckoutSession};
