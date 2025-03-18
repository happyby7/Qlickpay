const express = require("express");
const router = express.Router();

const { getMenuByRestaurant, getMenuItems, addMenuItem, deleteMenuItem} = require("../controllers/menu.controller");

router.get("/:restaurantId", getMenuByRestaurant);
router.get("/", getMenuItems);  
router.post("/", addMenuItem);
router.delete("/:itemId", deleteMenuItem);

module.exports = router;
