/**
 * DevMind — File Routes
 *
 * RESTful CRUD endpoints for in-memory file storage.
 * Routes contain ONLY routing logic — all business logic
 * is delegated to the storage service.
 *
 * Endpoints:
 *   GET    /api/files      — List all files
 *   GET    /api/files/:id  — Get a single file
 *   POST   /api/files      — Create a new file
 *   PUT    /api/files/:id  — Update an existing file
 *   DELETE /api/files/:id  — Delete a file
 */

const express = require('express');
const storage = require('../services/storage');

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/files — List all files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/', (_req, res, next) => {
  try {
    const files = storage.listFiles();
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/files/:id — Get a single file
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id', (req, res, next) => {
  try {
    const file = storage.getFile(req.params.id);

    if (!file) {
      const err = new Error(`File not found: ${req.params.id}`);
      err.statusCode = 404;
      throw err;
    }

    res.json({ file });
  } catch (err) {
    next(err);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/files — Create a new file
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', (req, res, next) => {
  try {
    const { name, language, content } = req.body;
    const file = storage.createFile({ name, language, content });
    res.status(201).json({ file });
  } catch (err) {
    next(err);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/files/:id — Update an existing file
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id', (req, res, next) => {
  try {
    const { name, language, content } = req.body;
    const file = storage.updateFile(req.params.id, { name, language, content });

    if (!file) {
      const err = new Error(`File not found: ${req.params.id}`);
      err.statusCode = 404;
      throw err;
    }

    res.json({ file });
  } catch (err) {
    next(err);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/files/:id — Delete a file
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.delete('/:id', (req, res, next) => {
  try {
    const deleted = storage.deleteFile(req.params.id);

    if (!deleted) {
      const err = new Error(`File not found: ${req.params.id}`);
      err.statusCode = 404;
      throw err;
    }

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
