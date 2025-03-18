const express = require("express");
const router = express.Router();

const { registerOwner } = require("../controllers/admin.controller");
const { authenticate, checkRole } = require("../middlewares/auth.middleware");

router.post("/register-owner", authenticate, checkRole("admin"), registerOwner);

module.exports = router;
