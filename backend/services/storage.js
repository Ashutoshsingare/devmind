/**
 * DevMind — In-Memory File Storage Service
 *
 * Stores files as an in-memory JavaScript object.
 * No database — all data is lost on server restart.
 *
 * Each file record:
 *   { id, name, language, content, createdAt, updatedAt }
 */

const { randomUUID } = require('crypto');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// In-memory store: { [id]: fileRecord }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const files = {};

/**
 * List all stored files.
 * Returns an array of file records (shallow copies).
 */
function listFiles() {
  return Object.values(files).map((file) => ({ ...file }));
}

/**
 * Get a single file by ID.
 * @param {string} id — File UUID
 * @returns {object|null} — File record or null if not found
 */
function getFile(id) {
  const file = files[id];
  if (!file) return null;
  return { ...file };
}

/**
 * Create a new file.
 * @param {object} data — { name: string, language: string, content: string }
 * @returns {object} — The created file record
 * @throws {Error} — If required fields are missing
 */
function createFile(data) {
  const { name, language, content } = data;

  if (!name || typeof name !== 'string') {
    const err = new Error('File name is required and must be a string');
    err.statusCode = 400;
    throw err;
  }

  if (!language || typeof language !== 'string') {
    const err = new Error('File language is required and must be a string');
    err.statusCode = 400;
    throw err;
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  const file = {
    id,
    name: name.trim(),
    language: language.trim().toLowerCase(),
    content: typeof content === 'string' ? content : '',
    createdAt: now,
    updatedAt: now,
  };

  files[id] = file;
  return { ...file };
}

/**
 * Update an existing file by ID.
 * Only provided fields are updated; others remain unchanged.
 * @param {string} id — File UUID
 * @param {object} data — Fields to update: { name?, language?, content? }
 * @returns {object|null} — Updated file record, or null if not found
 */
function updateFile(id, data) {
  const file = files[id];
  if (!file) return null;

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      const err = new Error('File name must be a non-empty string');
      err.statusCode = 400;
      throw err;
    }
    file.name = data.name.trim();
  }

  if (data.language !== undefined) {
    if (typeof data.language !== 'string' || data.language.trim() === '') {
      const err = new Error('File language must be a non-empty string');
      err.statusCode = 400;
      throw err;
    }
    file.language = data.language.trim().toLowerCase();
  }

  if (data.content !== undefined) {
    if (typeof data.content !== 'string') {
      const err = new Error('File content must be a string');
      err.statusCode = 400;
      throw err;
    }
    file.content = data.content;
  }

  file.updatedAt = new Date().toISOString();
  return { ...file };
}

/**
 * Delete a file by ID.
 * @param {string} id — File UUID
 * @returns {boolean} — true if deleted, false if not found
 */
function deleteFile(id) {
  if (!files[id]) return false;
  delete files[id];
  return true;
}

module.exports = {
  listFiles,
  getFile,
  createFile,
  updateFile,
  deleteFile,
};
