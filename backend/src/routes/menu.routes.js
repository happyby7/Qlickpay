const express = require("express");
const router = express.Router();

const { getMenuByRestaurant, getMenuItems, addMenuItem, deleteMenuItem} = require("../controllers/menu.controller");
const { authenticate, checkRole } = require("../middlewares/auth.middleware");

router.get("/:restaurantId", getMenuByRestaurant);
router.get("/", getMenuItems);  
router.post("/", authenticate, checkRole("owner"), addMenuItem);
router.delete("/:itemId", authenticate, checkRole("owner"), deleteMenuItem);

module.exports = router;
