const express = require("express");
const router = express.Router();

const {placeOrder}= require("../controllers/orders.controller");

router.post("/", placeOrder);

module.exports = router;
