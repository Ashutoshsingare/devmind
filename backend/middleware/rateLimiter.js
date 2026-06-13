/**
 * DevMind — Rate Limiter Middleware
 *
 * Two tiers of rate limiting:
 *   1. Global:  100 requests per minute per IP (all routes)
 *   2. AI:      10 requests per minute per IP  (/api/ai only)
 *
 * All rate-limit responses follow the standard error format:
 *   { error: string, statusCode: number }
 */

const rateLimit = require('express-rate-limit');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Global Rate Limiter — 100 req/min
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later. Limit: 100 requests per minute.',
      statusCode: 429,
    });
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI Rate Limiter — 10 req/min
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'AI request limit exceeded. Please wait before making another AI request. Limit: 10 requests per minute.',
      statusCode: 429,
    });
  },
});

module.exports = {
  globalLimiter,
  aiLimiter,
};
