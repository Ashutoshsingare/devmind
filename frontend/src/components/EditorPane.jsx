/**
 * DevMind — EditorPane Component
 *
 * Monaco-powered code editor with:
 *   - Tab bar for open files
 *   - Custom "devmind-dark" theme
 *   - 500ms debounced auto-save
 *   - Language detection from extension
 *
 * All file operations via useFiles hook props.
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { DiJavascript1, DiReact, DiPython, DiHtml5, DiCss3, DiJava } from 'react-icons/di';
import { SiCplusplus } from 'react-icons/si';
import { VscJson, VscMarkdown, VscFile } from 'react-icons/vsc';

/* ── Language detection from extension ── */
const LANG_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
};

function detectLanguage(filename) {
  if (!filename) return 'javascript';
  const ext = filename.split('.').pop().toLowerCase();
  return LANG_MAP[ext] || 'javascript';
}

/* ── File icon by extension (for tabs) ── */
const FILE_ICONS = {
  js: <DiJavascript1 color="#F7DF1E" size={14} />,
  jsx: <DiReact color="#61DAFB" size={14} />,
  ts: <DiJavascript1 color="#3178C6" size={14} />,
  tsx: <DiReact color="#3178C6" size={14} />,
  py: <DiPython color="#3776AB" size={14} />,
  html: <DiHtml5 color="#E34F26" size={14} />,
  css: <DiCss3 color="#1572B6" size={14} />,
  json: <VscJson color="#CBCB41" size={14} />,
  md: <VscMarkdown color="#519ABA" size={14} />,
  java: <DiJava color="#b07219" size={14} />,
  cpp: <SiCplusplus color="#00599C" size={14} />,
  cc: <SiCplusplus color="#00599C" size={14} />,
  cxx: <SiCplusplus color="#00599C" size={14} />,
  default: <VscFile color="#A1A1AA" size={14} />,
};

function getFileIcon(filename) {
  if (!filename) return FILE_ICONS.default;
  const ext = filename.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

/* ── Define custom Monaco theme ────────── */
let themeRegistered = false;

function registerTheme(monaco) {
  if (themeRegistered) return;
  monaco.editor.defineTheme('devmind-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '71717A', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7C3AED' },
      { token: 'string', foreground: '22C55E' },
      { token: 'number', foreground: 'F59E0B' },
      { token: 'type', foreground: '2563EB' },
    ],
    colors: {
      // Monaco API requires hex — these match our CSS token values
      'editor.background': '#09090B',
      'editor.foreground': '#FAFAFA',
      'editor.lineHighlightBackground': '#18181B',
      'editor.selectionBackground': '#2563EB44',
      'editor.inactiveSelectionBackground': '#2563EB22',
      'editorCursor.foreground': '#2563EB',
      'editorLineNumber.foreground': '#71717A',
      'editorLineNumber.activeForeground': '#A1A1AA',
      'editorIndentGuide.background': '#27272A',
      'editorIndentGuide.activeBackground': '#3F3F46',
      'editor.selectionHighlightBackground': '#2563EB22',
      'editorBracketMatch.background': '#2563EB33',
      'editorBracketMatch.border': '#2563EB',
      'editorWidget.background': '#18181B',
      'editorWidget.border': '#27272A',
      'editorSuggestWidget.background': '#18181B',
      'editorSuggestWidget.border': '#27272A',
      'editorSuggestWidget.selectedBackground': '#2563EB33',
      'input.background': '#09090B',
      'input.border': '#27272A',
      'scrollbarSlider.background': '#27272A88',
      'scrollbarSlider.hoverBackground': '#71717A88',
    },
  });
  themeRegistered = true;
}

export default function EditorPane({ useFilesHook }) {
  const {
    files,
    activeFile,
    tabs,
    closeTab,
    saveFile,
    setActiveFile,
    updateFileContent,
  } = useFilesHook;

  const debounceRef = useRef(null);
  const editorRef = useRef(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const activeFileData = activeFile ? files[activeFile] : null;
  const language = activeFileData ? detectLanguage(activeFileData.name) : 'javascript';

  /* ── Dynamic HTML Preview Generation ── */
  const previewSrcDoc = useMemo(() => {
    if (!showPreview) return '';

    const getFileContentByName = (filename) => {
      const file = Object.values(files).find(f => f.name.toLowerCase() === filename.toLowerCase());
      return file ? file.content : '';
    };

    let htmlContent = getFileContentByName('index.html');
    
    // Fallback: If no index.html exists, but the active file is HTML, use it.
    if (!htmlContent && language === 'html' && activeFileData) {
      htmlContent = activeFileData.content;
    }

    if (!htmlContent) {
      htmlContent = `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#A1A1AA;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#09090B;"><div>No HTML file found. Create <strong>index.html</strong> to see the preview.</div></body></html>`;
    }

    const cssContent = getFileContentByName('styles.css');
    const jsContent = getFileContentByName('script.js');

    let combined = htmlContent;

    // Inject CSS
    if (cssContent) {
      const styleTag = `<style>\n${cssContent}\n</style>`;
      if (combined.includes('</head>')) {
        combined = combined.replace('</head>', `${styleTag}\n</head>`);
      } else {
        combined += styleTag;
      }
    }

    // Inject JS
    if (jsContent) {
      const scriptTag = `<script>\n${jsContent}\n</script>`;
      if (combined.includes('</body>')) {
        combined = combined.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        combined += scriptTag;
      }
    }

    return combined;
  }, [files, showPreview, language, activeFileData]);

  /* ── Debounced save on change ────────── */
  const handleEditorChange = useCallback((value) => {
    if (!activeFile) return;

    // Update local state immediately for responsive editing
    updateFileContent(activeFile, value);

    // Debounce the API save call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveFile(activeFile, value).catch(() => {});
    }, 500);
  }, [activeFile, saveFile, updateFileContent]);

  /* ── Cleanup debounce on unmount ─────── */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /* ── Monaco onMount ─────────────────── */
  const handleEditorMount = useCallback((editor, monaco) => {
    registerTheme(monaco);
    monaco.editor.setTheme('devmind-dark');
    editorRef.current = editor;

    // Keyboard shortcut: Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFile) {
        const value = editor.getValue();
        saveFile(activeFile, value).catch(() => {});
      }
    });
  }, [activeFile, saveFile]);

  /* ── Close tab handler ──────────────── */
  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  /* ── Empty state ────────────────────── */
  if (!activeFile || tabs.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--space-4)',
        color: 'var(--color-text-muted)',
      }}>
        <span style={{ fontSize: '48px', opacity: 0.3 }}>✦</span>
        <span style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
        }}>
          Welcome to DevMind
        </span>
        <span style={{ fontSize: '13px' }}>
          Open or create a file to start editing
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <span style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-1) var(--space-2)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-secondary)',
          }}>Ctrl+N</span>
          <span style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-1) var(--space-2)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-secondary)',
          }}>New File</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Tab Bar ─────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
        minHeight: '36px',
        flexShrink: 0,
      }}>
        {tabs.map((tabId) => {
          const file = files[tabId];
          if (!file) return null;

          const isActive = tabId === activeFile;
          const isHovered = tabId === hoveredTab;

          return (
            <div
              key={tabId}
              onClick={() => setActiveFile(tabId)}
              onMouseEnter={() => setHoveredTab(tabId)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '0 var(--space-4)',
                height: '36px',
                cursor: 'pointer',
                background: isActive ? 'var(--color-bg)' : isHovered ? 'var(--color-bg-secondary)' : 'transparent',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                borderRight: '1px solid var(--color-border)',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                transition: 'background var(--transition-fast), color var(--transition-fast)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', flexShrink: 0 }}>
                {getFileIcon(file.name)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                {file.name}
              </span>
              <button
                onClick={(e) => handleCloseTab(e, tabId)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: isHovered || isActive ? 'var(--color-text-muted)' : 'transparent',
                  padding: '0 2px',
                  lineHeight: 1,
                  transition: 'color var(--transition-fast)',
                  borderRadius: 'var(--radius-sm)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                onMouseLeave={(e) => e.currentTarget.style.color = (isHovered || isActive) ? 'var(--color-text-muted)' : 'transparent'}
              >
                ✕
              </button>
            </div>
          );
        })}
        {/* ── Toggle Preview Button ────────── */}
        <div style={{ marginLeft: 'auto', paddingRight: 'var(--space-2)' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle Web Preview"
            style={{
              background: showPreview ? 'var(--color-primary-subtle)' : 'transparent',
              border: '1px solid',
              borderColor: showPreview ? 'var(--color-primary)' : 'transparent',
              color: showPreview ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!showPreview) {
                e.currentTarget.style.background = 'var(--color-bg)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showPreview) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Editor & Preview Area ──── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
        
        {/* Monaco Editor */}
        <div style={{ 
          flex: 1, 
          height: '100%', 
          overflow: 'hidden',
          borderRight: showPreview ? '1px solid var(--color-border)' : 'none'
        }}>
          <Editor
          height="100%"
          language={language}
          value={activeFileData?.content || ''}
          theme="devmind-dark"
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          loading={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-text-muted)',
              fontSize: '14px',
            }}>
              Loading editor...
            </div>
          }
          options={{
            fontSize: 16,
            fontFamily: "'JetBrains Mono', 'Geist Mono', Consolas, monospace",
            lineHeight: 1.8,
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            tabSize: 2,
            wordWrap: 'on',
            suggest: {
              showMethods: true,
              showFunctions: true,
              showVariables: true,
              showConstants: true,
            },
          }}
        />
        </div>

        {/* Web Preview Iframe */}
        {showPreview && (
          <div style={{ flex: 1, height: '100%', backgroundColor: '#ffffff' }}>
            <iframe
              title="Web Preview"
              srcDoc={previewSrcDoc}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#ffffff'
              }}
              sandbox="allow-scripts allow-modals allow-popups allow-forms allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
