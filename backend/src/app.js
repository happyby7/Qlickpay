const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const ordersRoutes = require("./routes/orders.routes");
const authRoutes = require("./routes/auth.routes");

app.use(express.json());
app.use(morgan("dev")); // Registra las solicitudes HTTP en la consola para depuración


const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",");
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Manejo explícito de pre-flight OPTIONS requests
app.options("*", cors());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error("❌ Error en el backend:", err);
    res.status(500).json({ message: "Error interno en el servidor" });
});

module.exports = app;