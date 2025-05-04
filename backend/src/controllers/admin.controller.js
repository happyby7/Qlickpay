const bcrypt = require("bcryptjs");
const { findUserByEmail, findRestaurantByName, createUserId, createRestaurant, assignOwnerToRestaurant} = require("../models/admin.model");

const registerOwner = async (req, res) => {
    const { full_name, email, phone, password, restaurant_name, role } = req.body;

    if (role !== "owner") return res.status(403).json({ success: false, message: "No tienes permiso para crear este usuario." });
    
    try {
        if (await findUserByEmail(email)) return res.status(409).json({ success: false, message: "El correo ya está registrado." });
        if (await findRestaurantByName(restaurant_name)) return res.status(409).json({ success: false, message: "El restaurante ya está registrado." });
        
        const password_hash = await bcrypt.hash(password, 10);
        const { id: userId } = await createUserId({ full_name, email, phone, password_hash });
        const { id: restaurantId } = await createRestaurant({ restaurant_name, email, phone });

        await assignOwnerToRestaurant(userId, restaurantId);

        res.json({ success: true, message: `Dueño ${full_name} registrado con éxito. Restaurante ID: ${restaurantId}.`});
    } catch (error) {
        console.error("Error al registrar dueño:", error);
        res.status(500).json({ success: false, message: "Error en el registro." });
    }
};

module.exports = { registerOwner };