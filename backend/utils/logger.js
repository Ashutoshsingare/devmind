const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'server.log');

function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  // Write to console
  if (level === 'error') {
    console.error(logLine.trim());
  } else {
    console.log(logLine.trim());
  }

  // Append to rolling log file
  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) console.error('Failed to write to server.log', err);
  });
}

module.exports = {
  info: (msg) => writeLog('info', msg),
  error: (msg) => writeLog('error', msg),
  warn: (msg) => writeLog('warn', msg),
};
