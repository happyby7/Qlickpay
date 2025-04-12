const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bcrypt = require("bcryptjs");

const getTables = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Se requiere un restaurantId." });
        
        const tables = await pool.query(
            `SELECT t.id, t.table_number,
              CASE 
                WHEN t.status = 'paid' THEN 'paid'
                WHEN COUNT(o.id) > 0 THEN 'occupied'
                ELSE 'available'
              END AS status
            FROM tables t
            LEFT JOIN orders o ON t.id = o.table_id AND o.status IN ('pending', 'in preparation')
            WHERE t.restaurant_id = $1
            GROUP BY t.id`,
            [restaurantId]
        );

        res.json(tables.rows);
    } catch (error) {
        console.error("❌ Error obteniendo mesas:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};

const updateTableStatus = async (req, res) => {
  const { table_id } = req.params;
  const { status } = req.body;

  if (!['available', 'occupied', 'paid'].includes(status)) {
    return res.status(400).json({ message: "Estado inválido." });
  }

  try {
    await pool.query('BEGIN');

    if (status === 'available') {
      const activeOrders = await pool.query(
        `SELECT id FROM orders WHERE table_id = $1 AND status IN ('pending', 'in preparation', 'served')`,
        [table_id]
      );

      const orderIds = activeOrders.rows.map(r => r.id);

      if (orderIds.length > 0) {
        await pool.query(
          `DELETE FROM order_items WHERE order_id = ANY($1::uuid[])`,
          [orderIds]
        );

        await pool.query(
          `DELETE FROM orders WHERE id = ANY($1::uuid[])`,
          [orderIds]
        );
      }
    }

    await pool.query(
      `UPDATE tables SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, table_id]
    );

    await pool.query('COMMIT');

    if (global.websocket) {
      global.websocket.updateStatusTable('updateTableStatus', JSON.stringify({ tableId: Number(table_id), status }));
    }

    res.json({ message: "Estado de la mesa actualizado y pedidos limpiados." });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("❌ Error actualizando mesa:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const getWaiters = async (req, res) => {
    const { restaurantId } = req.query; 

    if (!restaurantId) {
        return res.status(400).json({ success: false, message: "Se requiere restaurantId" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE role = 'waiter' AND id IN (SELECT user_id FROM user_restaurant WHERE restaurant_id = $1)",
            [restaurantId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener meseros:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
};

const registerWaiter = async (req, res) => {
    const { restaurantId, fullName, email, phone, password } = req.body;

    if (!restaurantId || !fullName || !email || !phone || !password) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    try {
        const userExists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userExists.rowCount > 0) {
            return res.status(409).json({ success: false, message: "El correo ya está registrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role) 
             VALUES ($1, $2, $3, $4, 'waiter') RETURNING id`,
            [fullName, email, phone, hashedPassword]
        );

        const waiterId = newUser.rows[0].id;

        await pool.query(
            `INSERT INTO user_restaurant (user_id, restaurant_id, role) 
             VALUES ($1, $2, 'waiter')`,
            [waiterId, restaurantId]
        );

        res.json({ success: true, message: "Mesero registrado correctamente." });

    } catch (error) {
        console.error("❌ Error al registrar mesero:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
};


const deleteWaiter = async (req, res) => {
    try {
        const { id } = req.params;
        const waiterCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'waiter'", [id]);

        if (waiterCheck.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Mesero no encontrado." });
        }

        await pool.query("DELETE FROM user_restaurant WHERE user_id = $1", [id]);
        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        res.json({ success: true, message: "Mesero eliminado correctamente." });
    } catch (error) {
        console.error("❌ Error al eliminar mesero:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
};

const updateOrderItem = async (req, res) => {
    const { restaurantId, tableId, itemName, removalQuantity } = req.body;
    if (!restaurantId || !tableId || !itemName || removalQuantity === undefined) {
      return res.status(400).json({ success: false, message: "Faltan parámetros." });
    }
    let quantityToRemove = Number(removalQuantity);
    if (isNaN(quantityToRemove) || quantityToRemove < 1) {
      return res.status(400).json({ success: false, message: "Cantidad inválida." });
    }
  
    try {
      await pool.query("BEGIN");
  
      const ordersResult = await pool.query(
        "SELECT * FROM orders WHERE table_id = $1 AND status = 'pending' ORDER BY created_at ASC",
        [tableId]
      );
      if (ordersResult.rowCount === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "No hay pedidos pendientes para esta mesa." });
      }
  
      let quantityLeft = quantityToRemove;
      for (let order of ordersResult.rows) {
        const orderItemResult = await pool.query(
          `SELECT oi.id, oi.quantity, oi.subtotal, mi.price
           FROM order_items oi
           JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = $1 AND mi.name = $2
           LIMIT 1`,
          [order.id, itemName]
        );
        if (orderItemResult.rowCount === 0) continue;
  
        const orderItem = orderItemResult.rows[0];
        const itemQuantity = orderItem.quantity;
        const unitPrice = parseFloat(orderItem.price);
  
        if (quantityLeft < itemQuantity) {
          const newQuantity = itemQuantity - quantityLeft;
          const newSubtotal = unitPrice * newQuantity;
          await pool.query(
            "UPDATE order_items SET quantity = $1, subtotal = $2 WHERE id = $3",
            [newQuantity, newSubtotal, orderItem.id]
          );
          quantityLeft = 0;
        } else {
          await pool.query("DELETE FROM order_items WHERE id = $1", [orderItem.id]);
          quantityLeft -= itemQuantity;
        }
  
        const totalResult = await pool.query(
          "SELECT COALESCE(SUM(subtotal), 0) AS total FROM order_items WHERE order_id = $1",
          [order.id]
        );
        const newTotalPrice = totalResult.rows[0].total;
        if (newTotalPrice > 0) {
          await pool.query("UPDATE orders SET total_price = $1 WHERE id = $2", [newTotalPrice, order.id]);
        } else {
          await pool.query("DELETE FROM orders WHERE id = $1", [order.id]);
        }
        if (quantityLeft <= 0) break;
      }
      await pool.query("COMMIT");
  
      if (quantityLeft > 0) {
        return res.status(200).json({
          success: true,
          message: `Se eliminaron ${quantityToRemove - quantityLeft} de ${quantityToRemove} solicitados, pero no se encontró el resto.`
        });
      }

      const remainingOrders = await pool.query(
        `SELECT id FROM orders WHERE table_id = $1 AND status IN ('pending', 'in preparation')`,
        [tableId]
      );
      
      if (remainingOrders.rowCount === 0 && global.websocket) global.websocket.updateStatusTable('updateTableStatus', JSON.stringify({ tableId, status: 'available' }));

      return res.json({ success: true, message: "Pedido actualizado correctamente." });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error actualizando item del pedido:", error);
      return res.status(500).json({ success: false, message: "Error al actualizar el pedido." });
    }
  };

module.exports = {deleteWaiter, registerWaiter, getWaiters, updateTableStatus, getTables, updateOrderItem };