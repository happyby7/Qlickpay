const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const ordersRoutes = require("./routes/orders.routes");
const authRoutes = require("./routes/auth.routes");
const qrRoutes = require("./routes/qr.routes");
const adminRoutes = require("./routes/admin.routes");
const restaurantRoutes = require("./routes/restaurant.routes");
const menuRoutes = require("./routes/menu.routes");
const waiterRoutes = require("./routes/waiter.routes.js");

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.1.45:3000",
    "http://172.28.112.1:3000",
    "http://192.168.168.190:3000"
];

app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());
app.use(morgan("dev")); // Registra las solicitudes HTTP en la consola para depuración


// Manejo explícito de pre-flight OPTIONS requests
app.options("*", cors());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/order", ordersRoutes);
app.use("/api/waiter", waiterRoutes);
app.use("/api/menu", menuRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error("❌ Error en el backend:", err);
    res.status(500).json({ message: "Error interno en el servidor" });
});

module.exports = app;
