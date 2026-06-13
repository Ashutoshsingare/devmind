/**
 * DevMind — Code Execution Route
 *
 * POST /api/run — Execute user code in a sandboxed child process.
 * Route contains ONLY routing logic — execution is delegated
 * to the sandbox service.
 *
 * Request body:
 *   { code: string, language: "javascript" | "python" }
 *
 * Response:
 *   { stdout: string, stderr: string, exitCode: number|null, timedOut: boolean }
 */

const express = require('express');
const { executeCode, getSupportedLanguages } = require('../services/sandbox');

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/run — Execute code
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', async (req, res, next) => {
  try {
    const { code, language } = req.body;

    // Validate request body
    if (!code || typeof code !== 'string' || code.trim() === '') {
      const err = new Error('Code is required and must be a non-empty string');
      err.statusCode = 400;
      throw err;
    }

    if (!language || typeof language !== 'string') {
      const err = new Error(
        `Language is required. Supported: ${getSupportedLanguages().join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Delegate to sandbox service
    const result = await executeCode({ code, language });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
