const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findAllRestaurants() {
  const { rows } = await pool.query(
    `SELECT id, name FROM restaurants`
  );
  return rows;
}

module.exports = { findAllRestaurants };
