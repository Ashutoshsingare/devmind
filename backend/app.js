/**
 * DevMind — Express Application Setup
 *
 * Configures the Express app with:
 *   1. CORS (configurable origins via ALLOWED_ORIGINS env var)
 *   2. JSON body parser
 *   3. Global rate limiter
 *   4. Route mounting (/api/files, /api/run, /api/ai)
 *   5. Global error handler (registered LAST)
 */

const express = require('express');
const cors = require('cors');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const filesRoutes = require('./routes/files');
const runRoutes = require('./routes/run');
const aiRoutes = require('./routes/ai');
const terminalRoutes = require('./routes/terminal');
const problemsRoutes = require('./routes/problems');
const debugRoutes = require('./routes/debug');
const logsRoutes = require('./routes/logs');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Create Express app
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const app = express();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORS Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Body Parser
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(express.json({ limit: '1mb' }));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Global Rate Limiter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(globalLimiter);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Health Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'devmind-backend',
    timestamp: new Date().toISOString(),
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Route Mounting
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use('/api/files', filesRoutes);
app.use('/api/run', runRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/logs', logsRoutes);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 404 Handler — Unmatched routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    statusCode: 404,
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Global Error Handler (must be LAST)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(errorHandler);

module.exports = app;
