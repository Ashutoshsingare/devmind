/**
 * DevMind — FileTree Component
 *
 * Sidebar file explorer panel. Lists all files from in-memory
 * storage with icons, supports create/open/delete actions.
 * All data operations via useFiles hook props — no fetch() here.
 */

import React, { useState, useRef, useEffect } from 'react';
import { DiJavascript1, DiReact, DiPython, DiHtml5, DiCss3 } from 'react-icons/di';
import { VscJson, VscMarkdown, VscFile } from 'react-icons/vsc';

/* ── File icon mapping by extension ─── */
const FILE_ICONS = {
  js: <DiJavascript1 color="#F7DF1E" size={16} />,
  jsx: <DiReact color="#61DAFB" size={16} />,
  ts: <DiJavascript1 color="#3178C6" size={16} />,
  tsx: <DiReact color="#3178C6" size={16} />,
  py: <DiPython color="#3776AB" size={16} />,
  html: <DiHtml5 color="#E34F26" size={16} />,
  css: <DiCss3 color="#1572B6" size={16} />,
  json: <VscJson color="#CBCB41" size={16} />,
  md: <VscMarkdown color="#519ABA" size={16} />,
  default: <VscFile color="#A1A1AA" size={16} />,
};

function getFileIcon(filename) {
  if (!filename) return FILE_ICONS.default;
  const ext = filename.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export default function FileTree({ useFilesHook }) {
  const {
    files,
    activeFile,
    createFile,
    openFile,
    renameFile,
    deleteFile,
  } = useFilesHook;

  const [hoveredFile, setHoveredFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);
  const inputRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (renamingFileId && renameInputRef.current) {
      renameInputRef.current.focus();
      // Select filename without extension if possible
      const lastDot = renameInput.lastIndexOf('.');
      if (lastDot > 0) {
        renameInputRef.current.setSelectionRange(0, lastDot);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [renamingFileId]);

  // Auto-focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  /* ── Create new file via inline input ─ */
  const handleNewFile = () => {
    setIsCreating(true);
    setNewFileName('');
  };

  const submitNewFile = () => {
    const name = newFileName.trim();
    if (name) {
      createFile(name).catch(() => {});
    }
    setIsCreating(false);
    setNewFileName('');
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewFileName('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      submitNewFile();
    } else if (e.key === 'Escape') {
      cancelCreating();
    }
  };

  /* ── Rename file ─────────────── */
  const handleRenameClick = (e, fileId, currentName) => {
    e.stopPropagation();
    setRenamingFileId(fileId);
    setRenameInput(currentName);
  };

  const submitRename = () => {
    const name = renameInput.trim();
    if (name && renamingFileId) {
      renameFile(renamingFileId, name).catch(() => {});
    }
    setRenamingFileId(null);
    setRenameInput('');
  };

  const cancelRename = () => {
    setRenamingFileId(null);
    setRenameInput('');
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      submitRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  /* ── Delete with confirmation ───────── */
  const handleDeleteClick = (e, fileId, fileName) => {
    e.stopPropagation();
    setFileToDelete({ id: fileId, name: fileName });
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete.id).catch(() => {});
      setFileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setFileToDelete(null);
  };

  const fileList = Object.values(files);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* ── Header ──────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          userSelect: 'none',
        }}>
          Explorer
        </span>
        <button
          onClick={handleNewFile}
          title="New File"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'var(--color-primary)',
            padding: 'var(--space-1)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
        >
          ＋
        </button>
      </div>

      {/* ── File List ───────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-2) 0',
      }}>
        {/* Inline Create Input */}
        {isCreating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--space-1) var(--space-4)',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-text-primary)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 'var(--space-2)' }}>
              <VscFile color="#A1A1AA" size={16} />
            </span>
            <input
              ref={inputRef}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={cancelCreating}
              placeholder="filename.js..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        )}

        {fileList.length === 0 && !isCreating ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-8) var(--space-4)',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
            textAlign: 'center',
            gap: 'var(--space-3)',
          }}>
            <span style={{ fontSize: '28px', opacity: 0.5 }}>📂</span>
            <span>No files yet</span>
            <button
              onClick={handleNewFile}
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
            >
              + Create File
            </button>
          </div>
        ) : (
          fileList.map((file) => {
            const isActive = file.id === activeFile;
            const isHovered = file.id === hoveredFile;

            return (
              <div
                key={file.id}
                onClick={() => openFile(file.id)}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-1) var(--space-4)',
                  cursor: 'pointer',
                  background: isActive
                    ? 'var(--color-primary-subtle)'
                    : isHovered
                      ? 'var(--color-card)'
                      : 'transparent',
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                  userSelect: 'none',
                  minHeight: '28px',
                }}
              >
                {/* File icon + name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  overflow: 'hidden',
                  flex: 1,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '16px', height: '16px' }}>
                    {getFileIcon(file.name)}
                  </span>
                  {renamingFileId === file.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={submitRename}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        width: '100%',
                        padding: '0 4px',
                        borderRadius: '2px',
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {file.name}
                    </span>
                  )}
                </div>

                {/* Edit & Delete buttons — visible on hover */}
                {isHovered && renamingFileId !== file.id && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => handleRenameClick(e, file.id, file.name)}
                      title={`Rename ${file.name}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        padding: '0 var(--space-1)',
                        lineHeight: 1,
                        transition: 'color var(--transition-fast)',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, file.id, file.name)}
                      title={`Delete ${file.name}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        padding: '0 var(--space-1)',
                        lineHeight: 1,
                        transition: 'color var(--transition-fast)',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer: file count ──────────── */}
      {fileList.length > 0 && (
        <div style={{
          padding: 'var(--space-2) var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
        }}>
          {fileList.length} file{fileList.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* ── Custom Delete Modal ─────────── */}
      {fileToDelete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(3px)',
          animation: 'fade-in 150ms ease-out'
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: 'var(--space-5)',
            width: '340px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            animation: 'fade-in 200ms ease-out'
          }}>
            <div>
              <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                Delete File
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong style={{ color: 'var(--color-text-primary)' }}>{fileToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button
                onClick={cancelDelete}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'background var(--transition-fast), color var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  background: 'var(--color-error)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'opacity var(--transition-fast), transform 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
