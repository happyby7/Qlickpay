const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");

// Ruta para obtener todos los pedidos
router.get("/", ordersController.getAllOrders); 

// Ruta para crear un nuevo pedido
router.post("/", ordersController.createOrder);

module.exports = router;
