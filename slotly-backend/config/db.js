// config/db.js
// 兼容两种方式：优先使用 Azure 的 DATABASE_URL；否则回退到本地的 DB_* 变量
const { Pool } = require('pg');
require('dotenv').config();

const hasDatabaseUrl = !!process.env.DATABASE_URL;

const pool = hasDatabaseUrl
  ? new Pool({
      // 例如：postgres://slotly:<ENCODED_PW>@slotly01.postgres.database.azure.com:5432/slotly?sslmode=require
      connectionString: process.env.DATABASE_URL,
      // Azure PostgreSQL 需要 SSL，受管证书需关闭校验
      ssl: { rejectUnauthorized: false },
      keepAlive: true,
      max: 10,
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'slotly',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT || 5432),
      // 本地不强制 SSL；如果你在别的云环境也要 SSL，可设置 DB_SSL=true
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      keepAlive: true,
      max: 10,
    });

// 小提示日志（不会泄露敏感信息）
if (hasDatabaseUrl) {
  console.log('[DB] Using DATABASE_URL with SSL (Azure).');
} else {
  console.log('[DB] Using discrete DB_* env vars.', {
    host: process.env.DB_HOST,
    db: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true',
  });
}

module.exports = pool;
