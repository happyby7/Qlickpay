const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bcrypt = require("bcryptjs");

const getTables = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) {
            return res.status(400).json({ message: "Se requiere un restaurantId." });
        }

        const tables = await pool.query(
            `SELECT t.id, t.table_number, t.status,
                    COUNT(o.id) as orders_count
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
    try {
        const { table_id } = req.params;
        const { status } = req.body;

        if (!['available', 'occupied', 'paid'].includes(status)) {
            return res.status(400).json({ message: "Estado inválido." });
        }

        await pool.query("UPDATE tables SET status = $1 WHERE id = $2", [status, table_id]);

        if (global.websocket) global.websocket.broadcastUpdate(table_id);

        res.json({ message: "Estado de la mesa actualizado." });
    } catch (error) {
        console.error("Error actualizando mesa:", error);
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

module.exports = {deleteWaiter, registerWaiter, getWaiters, updateTableStatus, getTables };