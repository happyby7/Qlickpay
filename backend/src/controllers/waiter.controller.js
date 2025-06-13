const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const bcrypt = require("bcryptjs");
const crypto = require('crypto');

const { findUserByEmail} = require("../models/admin.model");
const {
    findTablesByRestaurant,
    deletePendingOrdersByTable,
    updateTableStatusInDb,
    findWaitersByRestaurant,
    findWaiterById,
    insertWaiter,
    deleteWaiterById,
    findPendingOrdersByTable,
    findOrderItemForRemoval,
    updateItem,
    removeOrderItemById,
    updateOrderItemsTotals,
    clearSessionTokenForTable,
    generateSessionTokenForTable,
    clearTableOrders
} = require('../models/waiter.model');

const getTables = async (req, res) => {
  const { restaurantId } = req.query;

  if (!restaurantId) return res.status(400).json({ message: "Faltan parámetros en la URL." });
  
  try {
    const tables = await findTablesByRestaurant(restaurantId);

    res.json(tables);
  } catch (error) {
    console.error("Error obteniendo mesas:", error);
    res.status(500).json({ message: "Error obteniendo mesas." });
  }
};

const updateTableStatus = async (req, res) => {
  const { table_id } = req.params;
  const { status } = req.body;

  if (!['available', 'occupied', 'paid'].includes(status)) return res.status(400).json({ message: "Estado inválido." });
  
  try {
    await pool.query('BEGIN');

    if (status === 'available') {
      const pending = await findPendingOrdersByTable(table_id);
      const orderIds = pending.map(o => o.id);

      if (orderIds.length > 0) await deletePendingOrdersByTable(orderIds);
    }

    await updateTableStatusInDb(table_id, status);
    await pool.query('COMMIT');

    if (global.websocket) global.websocket.updateStatusTable('updateTableStatus', JSON.stringify({ tableId: Number(table_id), status }));
  
    res.json({ message: "Estado de la mesa actualizado y pedidos limpiados." });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("❌ Error actualizando mesa:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const getWaiters = async (req, res) => {
  const { restaurantId } = req.query; 

  if (!restaurantId) return res.status(400).json({ success: false, message: "Faltan parámetros en la URL." });
  
  try {
    const waiters = await findWaitersByRestaurant(restaurantId);

    res.json(waiters);
  } catch (error) {
    console.error("Error al obtener meseros:", error);
    res.status(500).json({ success: false, message: "Error al obtener meseros." });
  }
};

const registerWaiter = async (req, res) => {
  const { restaurantId, fullName, email, phone, password } = req.body;

  if (!restaurantId || !fullName || !email || !phone || !password) return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (await findUserByEmail(email)) return res.status(409).json({ success: false, message: "El correo ya está registrado." });

    await insertWaiter({ fullName, email, phone, hashedPassword, restaurantId });

    res.json({ success: true, message: "Mesero registrado correctamente." });
  } catch (error) {
    console.error("Error al registrar mesero:", error);
    res.status(500).json({ success: false, message: "Error al registrar mesero." });
  }
};


const deleteWaiter = async (req, res) => {
  const { id } = req.params;

  try {
    const waiterCheck = await findWaiterById(id);

    if (!waiterCheck) return res.status(404).json({ success: false, message: "Mesero no encontrado." });
    
    await deleteWaiterById(id);

    res.json({ success: true, message: "Mesero eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar mesero:", error);
    res.status(500).json({ success: false, message: "Error al eliminar mesero." });
  }
};

const updateOrderItem = async (req, res) => {
    const { restaurantId, tableId, itemName, removalQuantity } = req.body;

    let quantityToRemove = Number(removalQuantity);

    if (!restaurantId || !tableId || !itemName || removalQuantity === undefined) return res.status(400).json({ success: false, message: "Faltan parámetros." });
    if (isNaN(quantityToRemove) || quantityToRemove < 1) return res.status(400).json({ success: false, message: "Cantidad inválida." });
    
    try {
      await pool.query("BEGIN");
  
      const pending = await findPendingOrdersByTable(tableId);

      if (pending.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "No hay pedidos pendientes para esta mesa." });
      }
  
      for (let order of pending) {
        const row = await findOrderItemForRemoval(order.id,itemName);
        if (!row) continue;

        const itemQuantity = row.quantity;
        const unitPrice = row.price;

        let quantityLeft = quantityToRemove;
  
        if (quantityLeft < itemQuantity) {
          const newQuantity = itemQuantity - quantityLeft;
          const newSubtotal = unitPrice * newQuantity;

          await updateItem(row.id, newQuantity, newSubtotal);
          quantityLeft = 0;

        } else {
          removeOrderItemById(row.id);
          quantityLeft -= itemQuantity;
        }
  
        await updateOrderItemsTotals(order.id);
        if (quantityLeft <= 0) break;
      }
      await pool.query("COMMIT");
  
      if (quantityLeft > 0) {
        return res.status(200).json({
          success: true,
          message: `Se eliminaron ${quantityToRemove - quantityLeft} de ${quantityToRemove} solicitados, pero no se encontró el resto.`
        });
      }

      const remainingOrders = await findPendingOrdersByTable(tableId);
      
      if (remainingOrders.length === 0) {
        await clearSessionTokenForTable(restaurantId, tableId);
        res.clearCookie('valid', { path: '/' });
        if (global.websocket) global.websocket.updateStatusTable('updateTableStatus',JSON.stringify({ tableId, status: 'available' }));
      }

      return res.json({ success: true, message: "Pedido actualizado correctamente." });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error actualizando item del pedido:", error);
      return res.status(500).json({ success: false, message: "Error al actualizar el pedido." });
    }
  };

const generateTableSessionToken = async (req, res) => {
    const { restaurantId, tableId } = req.body;
  
    if (!restaurantId || !tableId) return res.status(400).json({ error: 'Faltan parámetros en la URL.' });
    
    try {
      const token = generateSessionToken(restaurantId, tableId);
      const expiration = new Date(Date.now() + 200 * 60000); 
  
      await generateSessionTokenForTable(restaurantId, tableId, token, expiration);
  
      return res.status(200).json({ success: true, token });
    } catch (err) {
      console.error('Error generando token de sesión de mesa:', err);
      return res.status(500).json({ error: 'Error generando token de sesión de mesa' });
    }
};

function generateSessionToken(restaurantId, tableId) {
  const secret = process.env.SESSION_SECRET; 
  const data = `${restaurantId}-${tableId}-${Date.now()}`;
  const token = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return token;
}

const clearTable = async (req, res) => {
  const rawTableId = req.body.tableId, rawRestauranteId = req.body.restaurantId;
  const tableId = Number(rawTableId), restaurantId = Number(rawRestauranteId);

  if (!tableId || isNaN(tableId || !restaurantId || isNaN(restaurantId))) return res.status(400).json({ error: 'Parámetros inválidos' });
  
  try {
    await clearSessionTokenForTable(restaurantId, tableId);
    await clearTableOrders(restaurantId, tableId);

    res.clearCookie('valid', { path: '/' });

    return res.status(200).json({ success: true, message: 'Token de sesión o cookie y pedidos eliminados correctamente.' });
  } catch (err) {
    console.error('Error al limpiar la mesa:', err);
    return res.status(500).json({ error: 'Error al limpiar la mesa' });
  }
};

module.exports = {deleteWaiter, registerWaiter, getWaiters, updateTableStatus, getTables, updateOrderItem, generateTableSessionToken, clearTable };