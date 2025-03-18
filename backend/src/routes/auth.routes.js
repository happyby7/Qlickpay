const express = require('express');
const router = express.Router();

const { register, login, verify2FA, cookies, logout } = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
//router.post('/verify-2fa', authenticate, verify2FA);
router.get("/get-cookies", cookies)
router.post("/logout", logout);

module.exports = router;