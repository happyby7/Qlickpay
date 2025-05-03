const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/email');

const register = async (req, res) => {
    const { full_name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [full_name, email, hashedPassword, role]
        );
        //await sendVerificationEmail(email); ARREGLAR LO DEL EMAIL
        res.status(201).json({ message: "Usuario registrado correctamente. Verifique su correo." });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar usuario" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.warn("⚠️ Solicitud de login sin email o password.");
        return res.status(400).json({ error: "Faltan credenciales." });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        const user = userResult.rows[0];
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        let restaurantId = null;
        if (user.role === "owner" || user.role === "waiter") {
            const restaurantResult = await pool.query(
                "SELECT restaurant_id FROM user_restaurant WHERE user_id = $1",
                [user.id]
            );
            if (restaurantResult.rowCount > 0) {
                restaurantId = restaurantResult.rows[0].restaurant_id;
            }
        }

        const token = jwt.sign({ id: user.id, role: user.role, name:user.full_name, restaurantId }, process.env.JWT_SECRET, { expiresIn: '20m' }); 

        const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "lax", path: '/', maxAge: 20 * 60 * 1000, };

        res.cookie("auth", token, cookieOptions);
        res.json({ success: true, token, role: user.role });
    } catch (error) {
        console.error("❌ Error en login:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
};

const cookies = (req, res) => {
    res.json({ cookies: req.cookies || "Cookies no recividas" });
};

const logout = (req, res) => {
    const cookieOptions = {httpOnly: true, secure: false, sameSite: "lax", path: '/',};
    
    res.clearCookie("auth", cookieOptions);
    res.json({ success: true });
};

const getSessionTokenTable = async (req, res) => {
    const { restaurantId, tableId } = req.query;
  
    if (!restaurantId || !tableId) {
      return res.status(400).json({ error: 'Faltan parámetros.' });
    }
  
    try {
      const result = await pool.query(
        `SELECT session_token, session_expires_at 
         FROM tables 
         WHERE restaurant_id = $1 AND id = $2`,
        [restaurantId, tableId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Mesa no encontrada.' });
      }
  
      const { session_token, session_expires_at } = result.rows[0];
  
      if (!session_token || new Date() > new Date(session_expires_at)) {
        return res.status(403).json({ error: 'Sesión expirada o no activa.' });
      }  
      return res.json({ token: session_token });
    } catch (error) {
      console.error("❌ Error obteniendo session_token:", error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  };

module.exports = { register, login, cookies, logout, getSessionTokenTable};