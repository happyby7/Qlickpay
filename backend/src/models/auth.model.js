const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createUser({ full_name, email, password_hash, role }) {
    await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [full_name, email, password_hash, role]
    );
}

async function findRestaurantIdByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT restaurant_id 
      FROM user_restaurant 
      WHERE user_id = $1`,
      [userId]
    );
    return rows[0]?.restaurant_id ?? null;
}

async function getTokenTable({ restaurantId, tableId }) {
    const { rows } = await pool.query(
      `SELECT session_token, session_expires_at 
       FROM tables 
       WHERE restaurant_id = $1 AND id = $2`,
      [restaurantId, tableId]
    );
    return rows[0] || null;
}

module.exports = { createUser, findRestaurantIdByUserId, getTokenTable };
