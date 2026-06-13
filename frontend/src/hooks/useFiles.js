/**
 * DevMind — useFiles Hook
 *
 * Manages file state: CRUD operations via backend API,
 * active file tracking, and tab management.
 *
 * All fetch() calls are encapsulated here — components
 * only call the returned action functions.
 *
 * State shape:
 *   files:      { [id]: { id, name, language, content, createdAt, updatedAt } }
 *   activeFile: string | null  (file ID of the currently open file)
 *   tabs:       string[]       (array of open file IDs)
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Detect language from filename extension.
 * @param {string} filename
 * @returns {string}
 */
function detectLanguage(filename) {
  if (!filename) return 'javascript';
  const ext = filename.split('.').pop().toLowerCase();
  const langMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
  };
  return langMap[ext] || 'javascript';
}

export default function useFiles() {
  // ── State ──────────────────────────────
  const [files, setFiles] = useState(() => {
    const saved = sessionStorage.getItem('devmind_files_files');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeFile, setActiveFile] = useState(() => {
    return sessionStorage.getItem('devmind_files_active') || null;
  });
  const [tabs, setTabs] = useState(() => {
    const saved = sessionStorage.getItem('devmind_files_tabs');
    return saved ? JSON.parse(saved) : [];
  });

  // ── Persist to sessionStorage ────────────
  useEffect(() => {
    sessionStorage.setItem('devmind_files_files', JSON.stringify(files));
    sessionStorage.setItem('devmind_files_active', activeFile || '');
    sessionStorage.setItem('devmind_files_tabs', JSON.stringify(tabs));
  }, [files, activeFile, tabs]);

  // ── Load all files on mount ────────────
  const loadAll = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load files: ${res.status}`);
      }
      const data = await res.json();
      setFiles((prev) => {
        const newFilesMap = {};
        (data.files || []).forEach((file) => {
          if (prev[file.id]) {
            // Preserve locally modified unsaved content across reloads
            newFilesMap[file.id] = { ...file, content: prev[file.id].content };
          } else {
            newFilesMap[file.id] = file;
          }
        });
        return newFilesMap;
      });
    } catch (err) {
      console.error('[useFiles] loadAll error:', err.message);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Create a new file ──────────────────
  const createFile = useCallback(async (name, content = '') => {
    try {
      const language = detectLanguage(name);
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, language, content }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create file: ${res.status}`);
      }

      const data = await res.json();
      const file = data.file;

      // Add to state
      setFiles((prev) => ({ ...prev, [file.id]: file }));

      // Open the newly created file
      setTabs((prev) => (prev.includes(file.id) ? prev : [...prev, file.id]));
      setActiveFile(file.id);

      return file;
    } catch (err) {
      console.error('[useFiles] createFile error:', err.message);
      throw err;
    }
  }, []);

  // ── Open a file (fetch full content + activate tab) ──
  const openFile = useCallback(async (fileId) => {
    try {
      // If we already have the file in state, just activate it
      if (files[fileId]) {
        setTabs((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
        setActiveFile(fileId);
        return files[fileId];
      }

      // Otherwise fetch from API
      const res = await fetch(`/api/files/${fileId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to open file: ${res.status}`);
      }

      const data = await res.json();
      const file = data.file;

      setFiles((prev) => ({ ...prev, [file.id]: file }));
      setTabs((prev) => (prev.includes(file.id) ? prev : [...prev, file.id]));
      setActiveFile(file.id);

      return file;
    } catch (err) {
      console.error('[useFiles] openFile error:', err.message);
      throw err;
    }
  }, [files]);

  // ── Save file content ──────────────────
  const saveFile = useCallback(async (fileId, content) => {
    try {
      const existing = files[fileId];
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language: existing ? existing.language : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to save file: ${res.status}`);
      }

      const data = await res.json();
      const file = data.file;

      setFiles((prev) => ({ ...prev, [file.id]: file }));
      return file;
    } catch (err) {
      console.error('[useFiles] saveFile error:', err.message);
      throw err;
    }
  }, [files]);

  // ── Rename file ────────────────────────
  const renameFile = useCallback(async (fileId, newName) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          language: detectLanguage(newName),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to rename file: ${res.status}`);
      }

      const data = await res.json();
      const file = data.file;

      setFiles((prev) => ({ ...prev, [file.id]: { ...prev[file.id], name: file.name, language: file.language } }));
      return file;
    } catch (err) {
      console.error('[useFiles] renameFile error:', err.message);
      throw err;
    }
  }, []);

  // ── Delete a file ──────────────────────
  const deleteFile = useCallback(async (fileId) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete file: ${res.status}`);
      }

      // Remove from files state
      setFiles((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });

      // Remove from tabs
      setTabs((prev) => {
        const next = prev.filter((id) => id !== fileId);

        // If we deleted the active file, switch to adjacent tab
        if (activeFile === fileId) {
          const oldIndex = prev.indexOf(fileId);
          const newActive = next[Math.min(oldIndex, next.length - 1)] || null;
          setActiveFile(newActive);
        }

        return next;
      });
    } catch (err) {
      console.error('[useFiles] deleteFile error:', err.message);
      throw err;
    }
  }, [activeFile]);

  // ── Close a tab (no deletion) ──────────
  const closeTab = useCallback((fileId) => {
    setTabs((prev) => {
      const next = prev.filter((id) => id !== fileId);

      // If we closed the active tab, switch to adjacent
      if (activeFile === fileId) {
        const oldIndex = prev.indexOf(fileId);
        const newActive = next[Math.min(oldIndex, next.length - 1)] || null;
        setActiveFile(newActive);
      }

      return next;
    });
  }, [activeFile]);

  // ── Update file content locally (for live editing without save) ──
  const updateFileContent = useCallback((fileId, content) => {
    setFiles((prev) => {
      if (!prev[fileId]) return prev;
      return {
        ...prev,
        [fileId]: { ...prev[fileId], content },
      };
    });
  }, []);

  return {
    files,
    activeFile,
    tabs,
    createFile,
    openFile,
    saveFile,
    renameFile,
    deleteFile,
    loadAll,
    closeTab,
    setActiveFile,
    updateFileContent,
    detectLanguage,
  };
}
