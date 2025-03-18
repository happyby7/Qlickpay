const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const QRCode = require('qrcode');

const generateQR = async (req, res) => {
    const { restaurantId, tableCount } = req.body;

    if (!restaurantId || !tableCount || tableCount < 1) {
        return res.status(400).json({ success: false, message: "Datos inválidos." });
    }

    try {
        const qrCodes = [];

        for (let i = 1; i <= tableCount; i++) {  //192.168.1.45
            const qrData = `${i}http://172.28.112.1:3000/scan?restaurantId=${restaurantId}&tableId=${tableCount}`; //CAMBIAR CUIDADO----------------
            const qrImage = await QRCode.toDataURL(qrData);
            const qrCode = `QR-${restaurantId}-${i}`;

            // Verificar si el QR ya existe
            const existingQR = await pool.query(
                "SELECT id FROM qr_codes WHERE code = $1",
                [qrCode]
            );

            let qrId;
            if (existingQR.rows.length > 0) {
                qrId = existingQR.rows[0].id;
            } else {
                const qrResult = await pool.query(
                    `INSERT INTO qr_codes (code, restaurant_id, is_active, created_at, updated_at)
                     VALUES ($1, $2, TRUE, NOW(), NOW())
                     RETURNING id;`,
                    [qrCode, restaurantId]
                );
                qrId = qrResult.rows[0].id;
            }

            await pool.query(
                `INSERT INTO tables (restaurant_id, table_number, qr_code_id, status, created_at, updated_at)
                 VALUES ($1, $2, $3, 'available', NOW(), NOW())
                 ON CONFLICT (restaurant_id, table_number) 
                 DO UPDATE SET qr_code_id = EXCLUDED.qr_code_id;`,
                [restaurantId, i, qrId]
            );

            qrCodes.push(qrImage);
        }

        res.json({ success: true, qrCodes });
    } catch (error) {
        console.error("❌ Error al generar QR:", error);
        res.status(500).json({ success: false, message: "Error generando QR." });
    }
};

async function getTableBill(req, res) {
    const { restaurantId, tableId } = req.params;

    try {
        console.log(`📡 API llamada con restaurantId: ${restaurantId}, tableId: ${tableId}`);

        const { rows } = await pool.query(
            `SELECT 
                o.id AS order_id, 
                o.status, 
                o.total_price, 
                json_agg(json_build_object(
                    'name', m.name, 
                    'quantity', oi.quantity, 
                    'subtotal', oi.subtotal
                )) AS items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN menu_items m ON oi.menu_item_id = m.id
            JOIN tables t ON o.table_id = t.id
            WHERE t.restaurant_id = $1 
            AND o.table_id = $2 
            AND o.status IN ('pending', 'in preparation', 'served') 
            GROUP BY o.id
            ORDER BY o.created_at ASC;`, 
            [restaurantId, tableId]
        );

        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        return res.json({ success: true, bills: rows });
    } catch (err) {
        console.error("❌ Error en getTableBill:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { generateQR, getTableBill };
