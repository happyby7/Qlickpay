const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const getRestaurants = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name FROM restaurants`
        );

        res.json({ success: true, restaurants: result.rows });
    } catch (error) {
        console.error("❌ Error al obtener restaurantes:", error);
        res.status(500).json({ success: false, message: "Error al obtener los restaurantes." });
    }
};

module.exports = { getRestaurants };
