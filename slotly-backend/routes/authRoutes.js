// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'slotly-secret';

// ✅ 用户注册
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashed]
    );
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ✅ 用户登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
