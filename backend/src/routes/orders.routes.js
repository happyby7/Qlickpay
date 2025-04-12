const express = require("express");
const router = express.Router();

const {placeOrder, getTableStatus}= require("../controllers/orders.controller");

router.post("/", placeOrder);
router.get("/status-table/:restaurantId/:tableId", getTableStatus);


module.exports = router;
