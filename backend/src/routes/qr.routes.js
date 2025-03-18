const express = require('express');
const router = express.Router();

const { generateQR, getTableBill } = require('../controllers/qr.controller');

router.post('/generate', generateQR);
router.get('/bill/:restaurantId/:tableId', getTableBill);

module.exports = router;
