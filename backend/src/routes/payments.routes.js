const express = require("express");
const router = express.Router();

const {StripeCheckoutSession, StripeConfirmSuccess}= require("../controllers/payments.controller.js");

router.post('/stripe-checkout-session', StripeCheckoutSession);
router.get('/confirm-success', StripeConfirmSuccess);

module.exports = router;