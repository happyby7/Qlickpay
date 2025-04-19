const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const getMenuByRestaurant = async (req, res) => {
    const { restaurantId } = req.params;

    if (!restaurantId) {
        return res.status(400).json({ success: false, message: "ID de restaurante requerido." });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, description, price 
             FROM menu_items 
             WHERE restaurant_id = $1`,
            [restaurantId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "No hay menú disponible para este restaurante." });
        }

        res.json({ success: true, menuItems: result.rows });
    } catch (error) { 
        console.error("❌ Error al obtener el menú:", error);
        res.status(500).json({ success: false, message: "Error al obtener el menú." });
    }
};


const getMenuItems = async (req, res) => {
    const { restaurantId } = req.query;

    if (!restaurantId) {
        return res.status(400).json({ success: false, message: "Se requiere restaurantId." });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM menu_items WHERE restaurant_id = $1",
            [restaurantId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener el menú:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
};

const addMenuItem = async (req, res) => {
    const { restaurantId, name, description, price, category } = req.body;

    if (!restaurantId || !name || !description || !price || !category) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice)) {
        return res.status(400).json({ success: false, message: "El precio debe ser un número válido." });
    }

    try {
        await pool.query(
            `INSERT INTO menu_items (restaurant_id, name, description, price, category) 
             VALUES ($1, $2, $3, $4, $5)`,
            [restaurantId, name, description, parsedPrice, category]
        );

        res.json({ success: true, message: "Platillo agregado correctamente." });

    } catch (error) {
        console.error("❌ Error al agregar platillo:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
};

const deleteMenuItem = async (req, res) => {
    const { itemId } = req.params;

    try {
        await pool.query("DELETE FROM menu_items WHERE id = $1", [itemId]);
        res.json({ success: true, message: "Platillo eliminado correctamente." });
    } catch (error) {
        console.error("❌ Error al eliminar platillo:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
};

module.exports = { getMenuByRestaurant, deleteMenuItem, addMenuItem, getMenuItems };
