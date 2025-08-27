const pool = require('../config/db');

// 保存任务（先删后存）
const saveTasksToDB = async (userId, tasks) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 删除旧任务
    await client.query('DELETE FROM tasks WHERE user_id = $1', [userId]);

    // 插入新任务
    const insertQuery = 'INSERT INTO tasks (user_id, title, status) VALUES ($1, $2, $3)';
    for (let task of tasks) {
      await client.query(insertQuery, [userId, task.title, task.status]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// 获取任务
const getTasksFromDB = async (userId) => {
  const result = await pool.query(
    'SELECT id, title, status, created_at FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const getTaskStatsFromDB = async (userId) => {
  const query = `
    SELECT 
      TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
      COUNT(*) FILTER (WHERE status = 'done') AS done,
      COUNT(*) FILTER (WHERE status = 'skipped') AS skipped,
      COUNT(*) FILTER (WHERE status = 'postponed') AS postponed
    FROM tasks
    WHERE user_id = $1
    GROUP BY date
    ORDER BY date DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};


module.exports = {
  saveTasksToDB,
  getTasksFromDB,
  getTaskStatsFromDB
};
