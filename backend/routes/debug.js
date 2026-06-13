const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * POST /api/debug/run
 * Executes code with debugging and trace flags enabled.
 */
router.post('/run', (req, res, next) => {
  const { filename, language } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  let cmd = '';
  if (language === 'javascript' || language === 'typescript') {
    // Run Node.js with verbose tracing
    cmd = `node --trace-warnings --trace-uncaught "${filePath}"`;
  } else if (language === 'python') {
    // Run Python with faulthandler
    cmd = `python -X faulthandler "${filePath}"`;
  } else {
    return res.status(400).json({ error: 'Debugging not supported for this language.' });
  }

  exec(cmd, { cwd: DATA_DIR, timeout: 15000 }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? (error.code || 1) : 0,
      timedOut: error && error.killed,
    });
  });
});

module.exports = router;
