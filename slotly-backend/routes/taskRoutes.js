// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../config/db');

// ✅ 保存日程任务（来自 Dashboard）
router.post('/schedule', authenticateToken, async (req, res) => {
  const { title, start_time, end_time } = req.body;
  const user_id = req.user.id;

  if (!title || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to save task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ 加载日程任务（来自 Dashboard）
router.get('/schedule', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      'SELECT id, title, start_time, end_time FROM tasks WHERE user_id = $1 ORDER BY start_time',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to load tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ✅ 保存 Checklist 任务
router.post('/tasks', authenticateToken, async (req, res) => {
  const { tasks } = req.body;
  const user_id = req.user.id;

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Invalid tasks format' });
  }

  try {
    await pool.query('DELETE FROM checklist WHERE user_id = $1', [user_id]);
    for (const task of tasks) {
      await pool.query(
        'INSERT INTO checklist (user_id, task_id, title, status) VALUES ($1, $2, $3, $4)',
        [user_id, task.id, task.title, task.status]
      );
    }
    res.json({ message: 'Checklist saved' });
  } catch (err) {
    console.error('❌ Failed to save checklist:', err);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
});

// ✅ 获取 Checklist 任务
router.get('/tasks', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'SELECT task_id AS id, title, status FROM checklist WHERE user_id = $1 ORDER BY task_id',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to load checklist:', err);
    res.status(500).json({ error: 'Failed to load checklist' });
  }
});

// ✅ 获取任务统计数据
router.get('/tasks/stats', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
         COUNT(*) FILTER (WHERE status = 'done') AS done,
         COUNT(*) FILTER (WHERE status = 'skipped') AS skipped,
         COUNT(*) FILTER (WHERE status = 'postponed') AS postponed
       FROM checklist
       WHERE user_id = $1
       GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to get stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
