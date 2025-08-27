const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/User');

const signup = async (req, res) => {
  const { username, email, password } = req.body;

  console.log('📩 Signup request received with:', { username, email });

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.warn('⚠️  User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    console.log('🔒 Password hashed:', hashed);

    const newUser = await createUser(username, email, hashed);
    console.log('✅ User created:', newUser);

    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    console.error('❌ Signup error stack:', err.stack);
    console.error('❌ Signup error message:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('❌ Login error stack:', err.stack);
    console.error('❌ Login error message:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { signup, login };
