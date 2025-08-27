// server.js
// Slotly Backend - Azure App Service 适配

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

// 业务路由
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const taskRoutes = require('./routes/taskRoutes');

// 本地开发读取 .env；在 Azure 上读取环境变量
dotenv.config();

const app = express();

// ---------- CORS ----------
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(s => s.trim());

app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  })
);

// ---------- Middlewares ----------
app.use(express.json());

// ---------- 基础路由 ----------
app.get('/', (req, res) => {
  res.send('✅ Slotly backend is running.');
});

// 健康检查（仅返回 200，用于 Azure 健康探针）
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 就绪检查（包含数据库连通性）
app.get('/ready', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, now: r.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- 业务路由 ----------
app.use('/api', authRoutes);               // 登录注册仍然挂 /api
app.use('/api/requests', requestRoutes);   // ✅ 改为 /api/requests
app.use('/api', taskRoutes);               // 任务路由保持原样（前端请求的是 /api/tasks ...）

// 启动前简单检查一次数据库（不会泄漏连接）
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to PostgreSQL');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  }
})();

// ---------- 启动服务（Azure 会注入 PORT） ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 优雅关闭（可选）
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Exiting...');
  process.exit(0);
});
