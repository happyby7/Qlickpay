require("dotenv").config();
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    let token = req.header("Authorization")?.split(" ")[1];
    if (!token && req.cookies) {
      token = req.cookies.auth;
    }
    if (!token) return res.status(401).json({ error: "Acceso no autorizado" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Token inválido" });
    }
};

const checkRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: "No tienes permisos para esta acción." });
        }
        next();
    };
};

module.exports = { authenticate, checkRole };
