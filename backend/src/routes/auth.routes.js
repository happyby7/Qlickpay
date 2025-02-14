const express = require('express');
const { register, login, verify2FA } = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
//router.post('/verify-2fa', authenticate, verify2FA);

module.exports = router;