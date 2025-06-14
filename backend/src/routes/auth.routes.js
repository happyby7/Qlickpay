const express = require('express');
const router = express.Router();

const { register, login, cookies, logout, getSessionTokenTable } = require('../controllers/auth.controller');
const { authenticate } = require("../middlewares/auth.middleware");

router.post('/register', register);
router.post('/login', login);
router.get("/get-cookies", cookies)
router.post("/logout", authenticate, logout);
router.get("/get-session-token-table", getSessionTokenTable)

module.exports = router;