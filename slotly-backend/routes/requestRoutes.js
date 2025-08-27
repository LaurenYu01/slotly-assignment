// routes/requestRoutes.js
// Booking Requests 路由（挂载点：/api/requests）
// - 修复 404：使用相对根路径 '/'（与 server.js 的 app.use('/api/requests', requestRoutes) 一致）
// - 修复 500：自动创建/补齐 requests 表的 email/req_time/msg 列
// - 简单 JWT 校验，提取 req.user.id 用于按用户隔离数据

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ---- 获取 PostgreSQL pool（优先复用现有配置） ----
let pool;
try {
  // 若你的项目导出方式为 `module.exports = pool`（server.js 就是这样）
  pool = require('../config/db');
} catch (_) {
  try {
    // 有些项目是 `module.exports = { pool }`
    ({ pool } = require('../config/db'));
  } catch (__) {
    // 兜底：直接用环境变量创建
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    });
  }
}

// ---- 简单认证中间件（与前端现有 Bearer token 兼容） ----
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // 期望 payload 至少包含 id/email（你的登录接口就是这样返回的）
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---- 启动时确保表结构就绪（自动建表/补列）----
let schemaReady;
async function ensureSchema() {
  // 建表（若不存在）
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id         BIGSERIAL PRIMARY KEY,
      user_id    BIGINT NOT NULL,
      email      TEXT,
      req_time   TEXT,
      msg        TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 逐列补齐（重复执行安全）
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS email      TEXT;`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS req_time   TEXT;`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS msg        TEXT;`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();`);
}
schemaReady = ensureSchema();

// ================== 路由 ==================
// GET /api/requests
router.get('/', auth, async (req, res) => {
  try {
    await schemaReady;
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT id, email, req_time, msg, created_at
      FROM requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    // 前端期望字段：{ email, time, msg, createdAt }
    const list = rows.map(r => ({
      email: r.email || '',
      time: r.req_time || '',
      msg: r.msg || '',
      createdAt: r.created_at,
    }));

    res.json(list);
  } catch (err) {
    console.error('❌ Failed to fetch requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /api/requests
router.post('/', auth, express.json(), async (req, res) => {
  try {
    await schemaReady;
    const userId = req.user.id;
    const { email, time, msg } = req.body || {};

    if (!email || !time || !msg) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO requests (user_id, email, req_time, msg)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, req_time, msg, created_at
      `,
      [userId, email, time, msg]
    );

    const r = rows[0];
    res.status(201).json({
      email: r.email,
      time: r.req_time,
      msg: r.msg,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error('❌ Failed to create request:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

module.exports = router;
