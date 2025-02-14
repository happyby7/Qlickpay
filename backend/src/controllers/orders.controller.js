const pool = require("../config/db.config");

// Obtener todos los pedidos
const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo pedido
const createOrder = async (req, res) => {
  const { user_id, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO orders (user_id, status) VALUES ($1, $2) RETURNING *",
      [user_id, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando pedido:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Exportar las funciones
module.exports = {
  getAllOrders,
  createOrder,
};
