const express = require("express");
const router = express.Router();

const { getTables, updateTableStatus, getWaiters, registerWaiter, deleteWaiter } = require("../controllers/waiter.controller");

router.get("/all", getTables);
router.put("/:table_id/status", updateTableStatus);

router.get("/", getWaiters);
router.post("/register", registerWaiter);
router.delete("/:id", deleteWaiter);

module.exports = router;
