const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * POST /api/problems/analyze
 * Analyzes a file for syntax errors and returns a structured list of problems.
 */
router.post('/analyze', (req, res, next) => {
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
    // Use Node's built-in syntax checker
    cmd = `node --check "${filePath}"`;
  } else if (language === 'python') {
    // Use Python's built-in compiler check
    cmd = `python -m py_compile "${filePath}"`;
  } else {
    // Unsupported language for basic syntax check, return 0 problems
    return res.json({ problems: [] });
  }

  exec(cmd, { cwd: DATA_DIR, timeout: 5000 }, (error, stdout, stderr) => {
    const problems = [];
    
    if (error) {
      const stderrStr = stderr.toString();
      
      // Parse Node.js SyntaxError
      if ((language === 'javascript' || language === 'typescript') && stderrStr.includes('SyntaxError')) {
        const lines = stderrStr.split('\n');
        const errLineMsg = lines.find(l => l.includes('SyntaxError'));
        
        // Attempt to extract line number (e.g. /path/to/file.js:10)
        const match = stderrStr.match(/:(\d+)\r?\n/);
        const line = match ? parseInt(match[1], 10) : 1;
        
        problems.push({
          line,
          col: 1,
          message: errLineMsg ? errLineMsg.trim() : 'Syntax Error',
          severity: 'error'
        });
      } 
      // Parse Python SyntaxError
      else if (language === 'python' && (stderrStr.includes('SyntaxError') || stderrStr.includes('IndentationError'))) {
        const match = stderrStr.match(/line (\d+)/);
        const line = match ? parseInt(match[1], 10) : 1;
        
        const lines = stderrStr.split('\n').filter(l => l.trim().length > 0);
        const errLineMsg = lines[lines.length - 1]; // The actual error is usually the last line
        
        problems.push({
          line,
          col: 1,
          message: errLineMsg ? errLineMsg.trim() : 'Syntax Error',
          severity: 'error'
        });
      } else {
        // Generic error
        problems.push({
          line: 1,
          col: 1,
          message: 'Syntax error detected, but could not parse location.',
          severity: 'error'
        });
      }
    }

    res.json({ problems });
  });
});

module.exports = router;
