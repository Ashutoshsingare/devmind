/**
 * DevMind — HTTP Server Entry Point
 *
 * Loads environment variables from .env, imports the Express app,
 * and starts listening on the configured PORT.
 */

// Load environment variables FIRST — before any other imports
require('dotenv').config();

const app = require('./app');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PORT = parseInt(process.env.PORT, 10) || 3001;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Start Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🧠 DevMind Backend — Running');
  console.log(`  📡 http://localhost:${PORT}`);
  console.log(`  🕐 Started at ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Routes:');
  console.log(`    GET    /api/health`);
  console.log(`    GET    /api/files`);
  console.log(`    GET    /api/files/:id`);
  console.log(`    POST   /api/files`);
  console.log(`    PUT    /api/files/:id`);
  console.log(`    DELETE /api/files/:id`);
  console.log(`    POST   /api/run`);
  console.log(`    POST   /api/ai`);
  console.log('');
});
