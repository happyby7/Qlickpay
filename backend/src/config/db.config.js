const { Pool } = require("pg");

require("dotenv").config(); 

const connectionString = process.env.DATABASE_URL || 
   `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
});

pool.connect()
    .then(() => console.log("🟢 Conectado a PostgreSQL"))
    .catch(err => console.error("🔴 Error conectando a PostgreSQL:", err));

module.exports = pool;
