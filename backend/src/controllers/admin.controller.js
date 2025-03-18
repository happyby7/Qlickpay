const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const bcrypt = require("bcryptjs");

const registerOwner = async (req, res) => {
    const { full_name, email, phone, password, restaurant_name, role } = req.body;

    if (role !== "owner") {
        return res.status(403).json({ success: false, message: "No tienes permiso para crear este usuario." });
    }

    try {

        if ((await pool.query("SELECT id FROM users WHERE email = $1", [email])).rowCount > 0) {
            return res.status(409).json({ success: false, message: "El correo ya está registrado." });
        }

        if ((await pool.query("SELECT id FROM restaurants WHERE name = $1", [restaurant_name])).rowCount > 0) {
            return res.status(409).json({ success: false, message: "El restaurante ya está registrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role) 
             VALUES ($1, $2, $3, $4, 'owner');`,
            [full_name, email, phone, hashedPassword]
        );

        const userIdResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

        await pool.query(
            `INSERT INTO restaurants (name, email, phone) 
             VALUES ($1, $2, $3);`,
            [restaurant_name, email, phone]
        );

        const restaurantIdResult = await pool.query("SELECT id FROM restaurants WHERE name = $1", [restaurant_name]);

        await pool.query(
            `INSERT INTO user_restaurant (user_id, restaurant_id, role) 
             VALUES ($1, $2, 'owner');`,
            [userIdResult.rows[0].id, restaurantIdResult.rows[0].id]
        );

        res.json({ success: true, message: `Dueño ${full_name} registrado con éxito. Restaurante ID: ${restaurantIdResult.rows[0].id}.` });

    } catch (error) {
        console.error("❌ Error al registrar dueño:", error);
        res.status(500).json({ success: false, message: "Error en el registro." });
    }
};

module.exports = { registerOwner };