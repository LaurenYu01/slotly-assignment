// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'slotly-secret';

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
