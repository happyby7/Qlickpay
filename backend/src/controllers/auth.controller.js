const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const { sendVerificationEmail } = require('../services/email');
const { createUser, findRestaurantIdByUserId, getTokenTable} = require("../models/auth.model");
const { findUserByEmail} = require("../models/admin.model");

const register = async (req, res) => {
    const { full_name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await createUser({ full_name, email, password_hash: hashedPassword, role });
        //await sendVerificationEmail(email);
        res.status(201).json({ message: "Usuario registrado correctamente. Verifique su correo." });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar usuario" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    let restaurantId = null;

    if (!email || !password) return res.status(400).json({ error: "Faltan credenciales." });

    try {
        const user = await findUserByEmail(email);
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Credenciales inválidas" });
        if (user.role === "owner" || user.role === "waiter") restaurantId = await findRestaurantIdByUserId(user.id);

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
  
    if (!restaurantId || !tableId) return res.status(400).json({ error: 'Faltan parámetros en la URL.'});
  
    try {
      const result = await getTokenTable({ restaurantId, tableId });
  
      if (!result) return res.status(404).json({ error: 'Mesa no encontrada.' });
      
      const { session_token, session_expires_at } = result;
      if (!session_token || new Date() > new Date(session_expires_at)) return res.status(403).json({ error: 'Sesión expirada o no activa.'});
       
      return res.json({ token: session_token });
    } catch (error) {
      console.error("❌ Error obteniendo session_token:", error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  };

module.exports = { register, login, cookies, logout, getSessionTokenTable};