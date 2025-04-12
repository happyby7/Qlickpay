const express = require('express');
const router = express.Router();

const { generateQR, getTableBill } = require('../controllers/qr.controller');
const { authenticate, checkRole } = require("../middlewares/auth.middleware");

router.post('/generate',authenticate, checkRole("owner"), generateQR);
router.get('/bill/:restaurantId/:tableId', getTableBill);

module.exports = router;
