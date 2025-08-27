// models/User.js
const pool = require('../config/db');

// 修改 createUser 接收 username
const createUser = async (username, email, hashedPassword) => {
  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, email, username;
  `;
  const values = [username, email, hashedPassword];
  const result = await pool.query(query, values);
  return result.rows[0];
};



const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
};
