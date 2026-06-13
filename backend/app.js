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
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://devmind-3iw85th3q-ashutosh637s-projects.vercel.app"
    ],
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
    credentials: true
}));

app.options("*", cors());

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
