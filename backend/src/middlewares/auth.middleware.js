const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authenticate = (req, res, next) => {
  if (req.method === 'POST' && req.originalUrl.endsWith('/api/auth/logout')) {
    return next();
  }

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token && req.cookies && req.cookies.auth) {
    token = req.cookies.auth;
  }
  if (!token) {
    return res.status(401).json({ error: "Acceso no autorizado. Token no proporcionado." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      let errorMsg = "Token inválido";
      if (err.name === "TokenExpiredError") {
        errorMsg = "El token ha expirado. Por favor, inicia sesión nuevamente.";
      } else if (err.name === "JsonWebTokenError") {
        errorMsg = "El token es inválido.";
      }
      return res.status(401).json({ error: errorMsg });
    }
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({ error: "Token inválido: datos incompletos." });
    }
    req.user = decoded; 
    next();
  });
};

const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: "Acceso denegado." });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "No tienes permisos para esta acción." });
    }
    next();
  };
};

module.exports = { authenticate, checkRole };
