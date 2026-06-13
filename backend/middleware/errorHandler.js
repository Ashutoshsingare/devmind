/**
 * DevMind — Global Error Handler Middleware
 *
 * Catches all unhandled errors in the Express pipeline and
 * returns a consistent JSON response:
 *   { error: string, statusCode: number }
 *
 * Must be registered LAST in the middleware chain.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Global error-handling middleware.
 * Express identifies this as an error handler because it has 4 parameters.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Determine status code: use err.statusCode if set, otherwise 500
  const statusCode = err.statusCode && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  // Build error message
  const message = err.message || 'Internal server error';

  // Log server errors (5xx) for debugging
  if (statusCode >= 500) {
    console.error(`[DevMind Error] ${statusCode} — ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  // Send consistent JSON error response
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : message,
    statusCode,
  });
}

module.exports = errorHandler;
