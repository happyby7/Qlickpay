const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureQRCode(restaurantId, code) {
  const { rows } = await pool.query(
    `SELECT id 
    FROM qr_codes 
    WHERE code = $1 AND restaurant_id = $2`,
    [code, restaurantId]
  );
  if (rows.length) return rows[0].id;

  const insert = await pool.query(
    `INSERT INTO qr_codes (code, restaurant_id, is_active, created_at, updated_at)
     VALUES ($1, $2, TRUE, NOW(), NOW())
     RETURNING id`,
    [code, restaurantId]
  );
  return insert.rows[0].id;
}

async function upsertTableQR(restaurantId, tableNumber, qrId) {
  await pool.query(
    `INSERT INTO tables (restaurant_id, table_number, qr_code_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'available', NOW(), NOW())
     ON CONFLICT (restaurant_id, table_number)
     DO UPDATE SET qr_code_id = EXCLUDED.qr_code_id, updated_at = NOW()`,
    [restaurantId, tableNumber, qrId]
  );
}

async function getTableId(restaurantId, tableNumber) {
  const { rows } = await pool.query(
    `SELECT id 
    FROM tables 
    WHERE restaurant_id = $1 AND table_number = $2`,
    [restaurantId, tableNumber]
  );
  return rows[0].id;
}

async function fetchTableBill(restaurantId, tableId, status) {
  const result = await pool.query(
    `SELECT
       o.id AS order_id,
       o.total_price,
       json_agg(
         json_build_object(
           'name', m.name,
           'quantity', oi.quantity,
           'subtotal', oi.subtotal
         )
       ) AS items
     FROM orders o
     JOIN tables t ON o.table_id = t.id
     JOIN order_items oi ON oi.order_id = o.id AND oi.status = $3
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE t.restaurant_id = $1
       AND o.table_id = $2
     GROUP BY o.id
     ORDER BY o.created_at ASC`,
    [restaurantId, tableId, status]
  );
  return result.rows;
}

async function markTableOccupiedIfNeeded(tableId, statusFilter, billCount) {
  if (statusFilter !== 'pending' || billCount === 0) return;
  const { rows } = await pool.query(
    `SELECT status 
    FROM tables 
    WHERE id = $1`,
    [tableId]
  );
  if (rows[0]?.status === 'available') {
    await pool.query(
      `UPDATE tables SET status = 'occupied', updated_at = NOW()
       WHERE id = $1`,
      [tableId]
    );
  }
}

module.exports = { ensureQRCode, upsertTableQR, getTableId, fetchTableBill, markTableOccupiedIfNeeded};
