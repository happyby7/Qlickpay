const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const {uuidv4, findTableRestaurant, insertOrder, insertOrderItems, fetchMenuItem, getStatusByTable } = require('../models/orders.model');

const placeOrder = async (req, res) => {
    const { table_id, user_id, order_type, items } = req.body;
    const orderId = uuidv4();
    const orderItemsValues = [];

    let totalPrice = 0;

    if (!table_id || !items || items.length === 0) return res.status(400).json({ success: false, message: "Datos de pedido incompletos." });
    
    try {
        const restaurant_id = await findTableRestaurant(table_id);

        if (!restaurant_id) return res.status(404).json({ success: false, message: "Mesa no encontrada." });
        
        for (const item of items) {
            const menuItem = await fetchMenuItem(item.menu_item_id);

            if (!menuItem) {
                console.warn(`Item no encontrado: ${item.menu_item_id}`);
                continue;
            }

            if (menuItem.restaurant_id !== restaurant_id) {
                console.warn(`Item ${item.menu_item_id} no pertenece al restaurante ${restaurant_id}`);
                continue;
            }

            const subtotal = parseFloat(menuItem.price) * item.quantity;
            totalPrice += subtotal;
            orderItemsValues.push([orderId, item.menu_item_id, item.quantity, subtotal]);
        }

        if (!orderItemsValues.length) return res.status(400).json({ success: false, message: "No se encontraron ítems válidos en el pedido." });
        
        await pool.query("BEGIN");
        await insertOrder({ orderId, table_id, user_id: user_id || null, order_type: order_type || 'qr_scan', totalPrice });
        await insertOrderItems(orderItemsValues);    
        await pool.query("COMMIT"); 

        if (global.websocket){
            global.websocket.newOrderEvent('newOrder',JSON.stringify({ tableId: table_id }));
            global.websocket.updateStatusTable('updateTableStatus', JSON.stringify({ tableId: table_id, status: 'occupied' }));
        } 

        res.json({ success: true, message: "Pedido registrado exitosamente.", orderId });
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error al procesar el pedido:", error.stack || error);
        res.status(500).json({ success: false, message: "Error al procesar el pedido.", error: error.message });
    }
};

const getTableStatus = async (req, res) => {
    const { restaurantId, tableId } = req.params;
  
    if (!restaurantId || !tableId) return res.status(400).json({ error: 'Faltan parámetros en la URL.' });
    
    try {
        const status = await getStatusByTable(restaurantId, tableId);

        if (!status) return res.status(404).json({ error: 'Mesa no encontrada.' });
        
        res.json({ status });
    } catch (err) {
      console.error('Error al obtener estado de la mesa:', err);
      res.status(500).json({ error: 'Error al obtener estado de la mesa.' });
    }
  };
  
module.exports = {placeOrder, getTableStatus};