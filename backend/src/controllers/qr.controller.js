const { ensureQRCode, upsertTableQR, getTableId, fetchTableBill, markTableOccupiedIfNeeded } = require('../models/qr.model');
const QRCode = require('qrcode');

const generateQR = async (req, res) => {
    const { restaurantId, tableCount } = req.body;

    if (!restaurantId || !tableCount || tableCount < 1)  return res.status(400).json({ success: false, message: "Datos inválidos." });

    try {
      const qrCodes = [];
      
      for (let i = 1; i <= tableCount; i++) {
          const qrCode = `QR-${restaurantId}-${i}`;
          const qrId = await ensureQRCode(restaurantId, qrCode);
          
          await upsertTableQR(restaurantId, i, qrId);
          
          const tableId = await getTableId(restaurantId, i);
          const qrData = `${process.env.FRONTEND_URL}/scan?restaurantId=${restaurantId}&tableId=${tableId}`;
          const qrImage = await QRCode.toDataURL(qrData);
          
          qrCodes.push(qrImage);
        }
      res.json({ success: true, qrCodes });
    } catch (error) {
      console.error("Error al generar QR:", error);
      res.status(500).json({ success: false, message: "Error generando QR." });
    }
};

async function getTableBill(req, res) {
    const { restaurantId, tableId } = req.params;
    const statusFilter = req.query.status === 'paid' ? 'paid' : 'pending';

    try {
      const bills = await fetchTableBill(restaurantId, tableId, statusFilter);

      await markTableOccupiedIfNeeded(tableId, statusFilter, bills.length);

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.json({ success: true, bills });
    } catch (err) {
      console.error("Error al obtener la cuenta de la mesa:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { generateQR, getTableBill };
