const express = require("express");
const router = express.Router();

const {StripeCheckoutSession, StripeConfirmSuccess, cancelCheckoutSession}= require("../controllers/payments.controller.js");

router.post('/stripe-checkout-session', StripeCheckoutSession);
router.get('/confirm-success', StripeConfirmSuccess);
router.get('/cancel-checkout', cancelCheckoutSession);

module.exports = router;