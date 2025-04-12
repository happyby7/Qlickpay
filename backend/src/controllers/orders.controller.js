const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { v4: uuidv4 } = require("uuid");

const placeOrder = async (req, res) => {
    const { table_id, user_id, order_type, items } = req.body;

    if (!table_id || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Datos de pedido incompletos." });
    }

    try {
        const tableCheck = await pool.query(`SELECT restaurant_id FROM tables WHERE id = $1`, [table_id]);

        if (tableCheck.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Mesa no encontrada." });
        }

        const restaurant_id = tableCheck.rows[0].restaurant_id;

        let totalPrice = 0;
        const orderId = uuidv4();
        const orderItemsValues = [];

        for (const item of items) {
            const menuItem = await pool.query(
                `SELECT price, restaurant_id FROM menu_items WHERE id = $1`,
                [item.menu_item_id]
            );

            if (menuItem.rowCount === 0) {
                console.warn(`❌ Item no encontrado: ${item.menu_item_id}`);
                continue;
            }

            const menuItemData = menuItem.rows[0];

            if (menuItemData.restaurant_id !== restaurant_id) {
                console.warn(`❌ Item ${item.menu_item_id} no pertenece al restaurante ${restaurant_id}`);
                continue;
            }

            const price = parseFloat(menuItemData.price);
            const subtotal = price * item.quantity;
            totalPrice += subtotal;
            orderItemsValues.push([orderId, item.menu_item_id, item.quantity, subtotal]);
        }

        if (orderItemsValues.length === 0) {
            return res.status(400).json({ success: false, message: "No se encontraron ítems válidos en el pedido." });
        }

        await pool.query("BEGIN");

        await pool.query(
            `INSERT INTO orders (id, table_id, user_id, order_type, status, total_price, is_paid) 
             VALUES ($1, $2, $3, $4, 'pending', $5, false);`,
            [orderId, table_id, user_id || null, order_type || 'qr_scan', totalPrice]
        );

        const insertOrderItemsQuery = `
            INSERT INTO order_items (order_id, menu_item_id, quantity, subtotal) 
            VALUES ${orderItemsValues
            .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
            .join(",")}`;

        const flattenedValues = orderItemsValues.flat();
        await pool.query(insertOrderItemsQuery, flattenedValues);    

        await pool.query("COMMIT"); 

        if (global.websocket){
            global.websocket.newOrderEvent('newOrder',JSON.stringify({ tableId: table_id }));
            global.websocket.updateStatusTable('updateTableStatus', JSON.stringify({ tableId: table_id, status: 'occupied' }));
        } 

        res.json({ success: true, message: "Pedido registrado exitosamente.", orderId });

    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("❌ ERROR DETECTADO:", error.stack || error);
        res.status(500).json({ success: false, message: "Error al procesar el pedido.", error: error.message });
    }
};

const getTableStatus = async (req, res) => {
    const { restaurantId, tableId } = req.params;
  
    if (!restaurantId || !tableId) {
      return res.status(400).json({ error: 'Faltan parámetros.' });
    }
  
    try {
      const result = await pool.query(
        `SELECT status FROM tables WHERE id = $1 AND restaurant_id = $2`,
        [tableId, restaurantId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Mesa no encontrada.' });
      }
  
      res.json({ status: result.rows[0].status });
    } catch (err) {
      console.error('❌ Error en getTableStatus:', err);
      res.status(500).json({ error: 'Error en el servidor.' });
    }
  };
  

module.exports = {placeOrder, getTableStatus};