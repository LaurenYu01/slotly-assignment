const { saveTasksToDB, getTasksFromDB } = require('../models/Task');

// 保存 Checklist 到数据库
const saveChecklist = async (req, res) => {
  const userId = req.user.userId;
  const tasks = req.body.tasks;

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks must be an array' });
  }

  try {
    await saveTasksToDB(userId, tasks);
    res.status(201).json({ message: 'Checklist saved successfully' });
  } catch (err) {
    console.error('[❌ Error saving checklist]', err);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
};

// 获取用户的 Checklist
const getTasks = async (req, res) => {
  const userId = req.user.userId;

  try {
    const tasks = await getTasksFromDB(userId);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('🔥 Error fetching tasks:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const { getTaskStatsFromDB } = require('../models/Task'); // 确保这一行有引入

// 获取任务统计
const getTaskStats = async (req, res) => {
  const userId = req.user?.userId;

  try {
    const stats = await getTaskStatsFromDB(userId);
    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Error fetching task stats:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
};

module.exports = {
  saveChecklist,
  getTasks,
  getTaskStats
};
