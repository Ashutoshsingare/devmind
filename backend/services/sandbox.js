/**
 * DevMind — Sandbox Code Execution Service
 *
 * Executes user code in a child process (Node.js or Python).
 * Hard 10-second timeout — kills the process if exceeded.
 * Returns stdout and stderr as separate fields.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { randomUUID } = require('crypto');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TIMEOUT_MS = 10_000; // 10-second hard timeout
const SUPPORTED_LANGUAGES = {
  javascript: { command: 'node', ext: '.js' },
  python: { command: 'python', ext: '.py' },
  java: { command: 'java', ext: '.java' },
  cpp: { ext: '.cpp' },
};

/**
 * Execute code in a sandboxed child process.
 *
 * @param {object} options
 * @param {string} options.code     — The source code to execute
 * @param {string} options.language — "javascript" or "python"
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number|null, timedOut: boolean }>}
 * @throws {Error} — If language is unsupported or code is empty
 */
function executeCode({ code, language }) {
  return new Promise((resolve, reject) => {
    // ── Validate inputs ──────────────────────
    if (!code || typeof code !== 'string' || code.trim() === '') {
      const err = new Error('Code is required and must be a non-empty string');
      err.statusCode = 400;
      return reject(err);
    }

    const lang = (language || '').trim().toLowerCase();
    const config = SUPPORTED_LANGUAGES[lang];

    if (!config) {
      const err = new Error(
        `Unsupported language: "${language}". Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      );
      err.statusCode = 400;
      return reject(err);
    }

    // ── Write code to a temporary file ───────
    const tmpDir = os.tmpdir();
    const baseName = `devmind_${randomUUID()}`;
    const filePath = path.join(tmpDir, `${baseName}${config.ext}`);

    try {
      fs.writeFileSync(filePath, code, 'utf8');
    } catch (writeErr) {
      const err = new Error('Failed to prepare code for execution');
      err.statusCode = 500;
      return reject(err);
    }

    // ── Spawn child process ──────────────────
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    let command, args;
    if (lang === 'cpp') {
      const isWin = process.platform === 'win32';
      const exePath = path.join(tmpDir, `${baseName}${isWin ? '.exe' : ''}`);
      command = isWin ? 'cmd.exe' : 'sh';
      args = isWin
        ? ['/c', `g++ "${filePath}" -o "${exePath}" && "${exePath}"`]
        : ['-c', `g++ "${filePath}" -o "${exePath}" && "${exePath}"`];
    } else {
      command = config.command;
      args = [filePath];
    }

    const child = spawn(command, args, {
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'sandbox' },
    });

    // ── Capture stdout ───────────────────────
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    // ── Capture stderr ───────────────────────
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    // ── Hard timeout: kill process ───────────
    const timer = setTimeout(() => {
      if (!settled) {
        timedOut = true;
        child.kill('SIGKILL');
      }
    }, TIMEOUT_MS);

    // ── Handle process exit ──────────────────
    child.on('close', (exitCode) => {
      settled = true;
      clearTimeout(timer);
      cleanup(filePath);

      if (timedOut) {
        stderr += '\n[DevMind] Execution timed out after 10 seconds. Process was killed.';
      }

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: timedOut ? null : exitCode,
        timedOut,
      });
    });

    // ── Handle spawn errors ──────────────────
    child.on('error', (spawnErr) => {
      settled = true;
      clearTimeout(timer);
      cleanup(filePath);

      const err = new Error(`Failed to execute code: ${spawnErr.message}`);
      err.statusCode = 500;
      reject(err);
    });
  });
}

/**
 * Clean up the temporary file.
 * @param {string} filePath
 */
function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    // Cleanup compiled exe if cpp
    if (filePath.endsWith('.cpp')) {
      const isWin = process.platform === 'win32';
      const exePath = filePath.replace('.cpp', isWin ? '.exe' : '');
      if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Get the list of supported languages.
 * @returns {string[]}
 */
function getSupportedLanguages() {
  return Object.keys(SUPPORTED_LANGUAGES);
}

module.exports = {
  executeCode,
  getSupportedLanguages,
};
