const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const LOG_FILE = path.join(__dirname, '..', 'server.log');

/**
 * GET /api/logs
 * Fetches the system/backend logs for the DevMind server.
 */
router.get('/', (req, res, next) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.json({ logs: [] });
  }

  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read logs' });
    }

    const lines = data.split('\n').filter(l => l.trim().length > 0);
    // Return last 100 logs to prevent massive payloads
    const recentLogs = lines.slice(-100);

    res.json({ logs: recentLogs });
  });
});

module.exports = router;
