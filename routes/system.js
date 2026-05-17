const express = require('express');
const router = express.Router();
const { getScripts, runScript, getScriptLogs } = require('../controllers/scriptController');
const { protect, authorize } = require('../middlewares/auth');
const { getQueueStats } = require('../services/messagingService');
const { getStats: getWsStats } = require('../services/websocketService');

router.use(protect);
router.get('/scripts', getScripts);
router.post('/scripts/:scriptId/run', authorize('admin', 'superadmin'), runScript);
router.get('/scripts/logs', getScriptLogs);
router.get('/backups', authorize('admin', 'superadmin'), (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const backupDir = path.join(__dirname, '../backups/db');
  if (!fs.existsSync(backupDir)) return res.json({ success: true, data: [] });
  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const stat = fs.statSync(path.join(backupDir, f));
      return { name: f, size: stat.size, createdAt: stat.mtime };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: files });
});
router.get('/queue-stats', async (req, res) => {
  const stats = await getQueueStats();
  res.json({ success: true, data: stats });
});
router.get('/ws-stats', (req, res) => {
  res.json({ success: true, data: getWsStats() });
});
router.get('/system-health', async (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    data: {
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'disconnected',
      websocket: getWsStats(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date(),
    },
  });
});

module.exports = router;
