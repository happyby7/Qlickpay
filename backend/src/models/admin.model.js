const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findUserByEmail(email) {
    const { rows } = await pool.query(
        `SELECT id, full_name, email, password_hash, role
        FROM users
        WHERE email = $1`,
        [email]
    );
    return rows[0] || null;
}

async function findRestaurantByName(restaurant_name) {
    const { rows } = await pool.query(
        `SELECT id 
        FROM restaurants 
        WHERE name = $1`,
        [restaurant_name]
    );
    return rows[0] || null;
}

async function createUserId({ full_name, email, phone, password_hash }) {
    const { rows } = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
        VALUES ($1, $2, $3, $4, 'owner') RETURNING id`,
        [full_name, email, phone, password_hash]
      );
      return rows[0];
}

async function createRestaurant({ restaurant_name, email, phone }) {
    const { rows } = await pool.query(
      `INSERT INTO restaurants (name, email, phone)
       VALUES ($1, $2, $3) RETURNING id`,
      [restaurant_name, email, phone]
    );
    return rows[0];
}

async function assignOwnerToRestaurant(userId, restaurantId) {
    await pool.query(
      `INSERT INTO user_restaurant (user_id, restaurant_id, role)
       VALUES ($1,$2,'owner')`,
      [userId, restaurantId]
    );
}

module.exports = { findUserByEmail, findRestaurantByName, createUserId, createRestaurant, assignOwnerToRestaurant};