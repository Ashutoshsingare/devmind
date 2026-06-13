/**
 * DevMind — AI Route
 *
 * POST /api/ai — Send code/message to Anthropic Claude for AI-powered
 * assistance (explain, fix, refactor, chat).
 *
 * Route contains ONLY routing logic — AI logic is delegated
 * to the aiService.
 *
 * Request body:
 *   {
 *     taskType: "explainCode" | "fixError" | "refactor" | "chat",
 *     code?: string,       (required for explainCode, fixError, refactor)
 *     language: string,    (required for all)
 *     error?: string,      (required for fixError)
 *     message?: string     (required for chat)
 *   }
 *
 * Response:
 *   { response: string, model: string, usage: object }
 */

const express = require('express');
const { sendAIRequest, getSupportedTaskTypes } = require('../services/aiService');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/ai — AI assistance (with stricter rate limit)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', aiLimiter, async (req, res, next) => {
  try {
    const { taskType, code, language, error, message } = req.body;

    // Validate taskType
    if (!taskType || typeof taskType !== 'string') {
      const err = new Error(
        `taskType is required. Supported: ${getSupportedTaskTypes().join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Validate language
    if (!language || typeof language !== 'string') {
      const err = new Error('Language is required for all AI requests');
      err.statusCode = 400;
      throw err;
    }

    // Delegate to AI service
    const result = await sendAIRequest({ taskType, code, language, error, message });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
