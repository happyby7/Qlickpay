const { findAllRestaurants } = require('../models/restaurant.model');

const getRestaurants = async (req, res) => {
    try {
        const restaurants = await findAllRestaurants();

        res.json({ success: true, restaurants });
    } catch (error) {
        console.error("Error al obtener restaurantes:", error);
        res.status(500).json({ success: false, message: "Error al obtener los restaurantes." });
    }
};

module.exports = { getRestaurants };
