const express = require("express");
const router = express.Router();

const { getTables, updateTableStatus, getWaiters, registerWaiter, deleteWaiter, updateOrderItem, generateTableSessionToken, clearTable } = require("../controllers/waiter.controller");
const { authenticate, checkRole } = require("../middlewares/auth.middleware");

router.get("/all", authenticate, checkRole("waiter"), getTables);
router.put("/:table_id/status",authenticate, checkRole("waiter"), updateTableStatus);

router.get("/", authenticate, checkRole("owner"), getWaiters);
router.post("/register", authenticate, checkRole("owner"), registerWaiter);
router.delete("/:id", authenticate, checkRole("owner"), deleteWaiter);
router.post("/update-order-item", authenticate, checkRole("waiter"), updateOrderItem);
router.post("/generate-session-token-table", authenticate, checkRole("waiter"), generateTableSessionToken);
router.post("/clear-session-token-table", authenticate, checkRole("waiter"), clearTable);

module.exports = router;
