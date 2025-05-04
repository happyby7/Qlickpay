const { findMenuByRestaurant, createMenuItem, removeMenuItem } = require("../models/menu.model");

const getMenuByRestaurant = async (req, res) => {
    const { restaurantId } = req.params;

    if (!restaurantId) return res.status(400).json({ success: false, message: "Faltan parametros en la URL." });
    
    try {
        const menuItems = await findMenuByRestaurant(restaurantId);

        if (menuItems.length === 0) return res.status(404).json({ success: false, message: "No hay menú disponible para este restaurante."});

        res.json({ success: true, menuItems });
    } catch (error) { 
        console.error("Error al obtener el menú:", error);
        res.status(500).json({ success: false, message: "Error al obtener el menú." });
    }
};

const addMenuItem = async (req, res) => {
    const { restaurantId, name, description, price, category } = req.body;

    if (!restaurantId || !name || !description || !price || !category) return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) return res.status(400).json({ success: false, message: "El precio debe ser un número válido." });

    try {
        await createMenuItem({ restaurantId, name, description, price: parsedPrice, category });

        res.json({ success: true, message: "Platillo agregado correctamente." });
    } catch (error) {
        console.error("Error al agregar platillo:", error);
        res.status(500).json({ success: false, message: "Error al agregar platillo." });
    }
};

const deleteMenuItem = async (req, res) => {
    const { itemId } = req.params;

    try {
        await removeMenuItem(itemId);
        res.json({ success: true, message: "Platillo eliminado correctamente." });
    } catch (error) {
        console.error("Error al eliminar platillo:", error);
        res.status(500).json({ success: false, message: "Error al eliminar platillo." });
    }
};

module.exports = { getMenuByRestaurant, deleteMenuItem, addMenuItem };
