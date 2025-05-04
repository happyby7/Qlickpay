const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { v4: uuidv4 } = require("uuid");

async function findTableRestaurant(tableId) {
  const { rows } = await pool.query(
    `SELECT restaurant_id 
    FROM tables 
    WHERE id = $1`,
    [tableId]
  );
  return rows[0]?.restaurant_id || null;
}

async function fetchMenuItem(menu_item_id) {
    const { rows } = await pool.query(
      `SELECT price, restaurant_id 
      FROM menu_items 
      WHERE id = $1`,
      [menu_item_id]
    );
    return rows[0] || null;
  }
  

async function insertOrder({ orderId, table_id, user_id, order_type, totalPrice }) {
  await pool.query(
    `INSERT INTO orders (id, table_id, user_id, order_type, status, total_price, is_paid)
     VALUES ($1, $2, $3, $4, 'pending', $5, false)`,
    [orderId, table_id, user_id, order_type, totalPrice]
  );
}

async function insertOrderItems(orderItemsValues) {
  const placeholders = orderItemsValues
    .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
    .join(',');
  const values = orderItemsValues.flat();
  const query = `
    INSERT INTO order_items (order_id, menu_item_id, quantity, subtotal)
    VALUES ${placeholders}`;
    
  await pool.query(query, values);
}

async function getStatusByTable(restaurantId, tableId) {
  const { rows } = await pool.query(
    `SELECT status 
    FROM tables 
    WHERE id = $1 AND restaurant_id = $2`,
    [tableId, restaurantId]
  );
  return rows[0]?.status || null;
}

module.exports = { uuidv4, findTableRestaurant, insertOrder, insertOrderItems, fetchMenuItem, getStatusByTable };
