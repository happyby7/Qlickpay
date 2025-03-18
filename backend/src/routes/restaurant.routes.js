const express = require("express");
const router = express.Router();

const { getRestaurants } = require("../controllers/restaurant.controller");

router.get("/all", getRestaurants);

module.exports = router;
