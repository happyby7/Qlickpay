const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        console.log( "MI JWT!!! "+ process.env.JWT_SECRET);
        const token = jwt.sign({ id: user.id, role: user.role, name:user.full_name}, process.env.JWT_SECRET, { expiresIn: '15m' }); //REVISAR LO DEL JWT
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Error en el inicio de sesión" });
    }
};

module.exports = { register, login };