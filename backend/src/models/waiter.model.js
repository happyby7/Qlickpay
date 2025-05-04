const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findTablesByRestaurant(restaurantId) {
  const { rows } = await pool.query(
    `SELECT t.id, t.table_number,
    CASE 
        WHEN t.status='paid' THEN 'paid'
        WHEN t.status='occupied' THEN 'occupied'
        WHEN COUNT(o.id)>0 THEN 'occupied'
        ELSE 'available'
      END AS status
    FROM tables t
    LEFT JOIN orders o
       ON t.id=o.table_id AND o.status='pending'
    WHERE t.restaurant_id=$1
    GROUP BY t.id,t.status,t.table_number`,
    [restaurantId]
  );
  return rows;
}

async function findPendingOrdersByTable(tableId) {
  const { rows } = await pool.query(
    `SELECT id 
    FROM orders 
    WHERE table_id= $1 AND status= 'pending' 
    ORDER BY created_at`,
    [tableId]
  );
  return rows;
}

async function deletePendingOrdersByTable(orderIds) {
  await pool.query(
    `DELETE FROM order_items 
    WHERE order_id = ANY($1::uuid[])`,
    [orderIds]
  );

  await pool.query(
    `DELETE FROM orders 
    WHERE id = ANY($1::uuid[])`,
    [orderIds]
  );
}

async function updateTableStatusInDb(tableId,status) {
  await pool.query(
    `UPDATE tables SET status= $1, updated_at = NOW() 
    WHERE id = $2`,
    [status,tableId]
  );
}

async function findWaitersByRestaurant(restaurantId) {
  const { rows } = await pool.query(
    `SELECT * FROM users
    WHERE role = 'waiter'
       AND id IN (
         SELECT user_id FROM user_restaurant WHERE restaurant_id = $1
    )`,
    [restaurantId]
  );
  return rows;
}

async function insertWaiter({ fullName, email, phone, hashedPassword, restaurantId }) {
  const { rows } = await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
    VALUES($1, $2, $3, $4,'waiter') RETURNING id`,
    [fullName, email, phone, hashedPassword]
  );

  await pool.query(
    `INSERT INTO user_restaurant(user_id, restaurant_id, role)
    VALUES($1, $2, 'waiter')`,
    [rows[0].id, restaurantId]
  );
}

async function findWaiterById(id) {
    const { rows } = await pool.query(
      `SELECT id 
      FROM users 
      WHERE id = $1 AND role = 'waiter'`,
      [id]
    );
    return rows[0] || null;
  }

async function deleteWaiterById(id) {
  await pool.query(
    `DELETE FROM user_restaurant 
    WHERE user_id = $1`,
    [id]
  );

  await pool.query(
    `DELETE FROM users 
    WHERE id = $1`,
    [id]
  );
}

async function findOrderItemForRemoval(orderId, itemName) {
  const { rows } = await pool.query(
    `SELECT oi.id, oi.quantity, oi.subtotal, mi.price
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1 AND mi.name = $2 
    LIMIT 1`,
    [orderId, itemName]
  );
  return rows[0] || null;
}

async function updateItem(id, newQuantity, newSubtotal) {
    await pool.query(
      `UPDATE order_items SET quantity = $1, subtotal = $2 
      WHERE id = $3`,
      [newQuantity, newSubtotal, id]
    );
}

async function removeOrderItemById(id) {
    await pool.query(
      `DELETE FROM order_items 
      WHERE id = $1`,
      [id]
    );
}

async function updateOrderItemsTotals(orderId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(subtotal), 0) AS total
    FROM order_items WHERE order_id = $1`,
    [orderId]
  );

  const total = rows[0].total;

  if (total > 0) {
    await pool.query(
        `UPDATE orders SET total_price = $1 
        WHERE id=$2`,
        [total, orderId]
    );
  } else {
    await pool.query(
        `DELETE FROM orders 
        WHERE id = $1`,
        [orderId]
    );
  }
}

async function clearSessionTokenForTable(restaurantId, tableId) {
  await pool.query(
    `UPDATE tables 
    SET status = 'available', 
        session_token = NULL, 
        session_expires_at = NULL 
    WHERE id = $1 AND restaurant_id = $2`,
    [tableId, restaurantId]
  );
}

async function generateSessionTokenForTable(restaurantId, tableId, token, expiration) {
  await pool.query(
    `UPDATE tables 
    SET session_token = $1, session_expires_at = $2
    WHERE restaurant_id = $3 AND id = $4`,
    [token, expiration, restaurantId, tableId]
  );
}

async function clearTableOrders(restaurantId, tableId) {
    await pool.query(
      `DELETE FROM orders o
        USING tables t
      WHERE o.table_id = t.id
      AND t.restaurant_id = $1
      AND t.id = $2`,
      [restaurantId, tableId]
    );
  }

module.exports = { 
  findTablesByRestaurant, 
  findPendingOrdersByTable, 
  deletePendingOrdersByTable, 
  updateTableStatusInDb,
  findWaitersByRestaurant, 
  findWaiterById,
  insertWaiter,
  deleteWaiterById,
  findOrderItemForRemoval,
  updateItem,
  removeOrderItemById,
  updateOrderItemsTotals,
  clearSessionTokenForTable,
  generateSessionTokenForTable,
  clearTableOrders
};
