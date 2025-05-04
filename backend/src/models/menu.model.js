const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findMenuByRestaurant(restaurantId) {
  const { rows } = await pool.query(
    `SELECT id, name, description, price, category
     FROM menu_items 
     WHERE restaurant_id = $1`,
    [restaurantId]
  );
  return rows;
}

async function createMenuItem({ restaurantId, name, description, price, category }) {
  await pool.query(
    `INSERT INTO menu_items (restaurant_id, name, description, price, category) 
     VALUES ($1, $2, $3, $4, $5)`,
    [restaurantId, name, description, price, category]
  );
}

async function removeMenuItem(itemId) {
  await pool.query(
    `DELETE FROM menu_items 
    WHERE id = $1`,
    [itemId]
  );
}

module.exports = {findMenuByRestaurant, createMenuItem, removeMenuItem };
