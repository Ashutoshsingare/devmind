const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// The data directory where files are stored is the current working directory for the terminal.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * POST /api/terminal/exec
 * Executes an arbitrary shell command in the workspace directory.
 */
router.post('/exec', (req, res, next) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  // Execute the command in a subshell
  exec(command, { cwd: DATA_DIR, timeout: 15000 }, (error, stdout, stderr) => {
    res.json({
      command,
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? (error.code || 1) : 0,
      timedOut: error && error.killed,
    });
  });
});

module.exports = router;
