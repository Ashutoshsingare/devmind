/**
 * DevMind — Root Application Shell
 *
 * Top-level component that:
 *   1. Initializes all 3 hooks (useFiles, useRunner, useAI)
 *   2. Manages selectedCode state for editor ↔ AI panel communication
 *   3. Renders the 4-panel grid layout (navbar + EditorPage)
 *
 * Layout grid (defined in App.css):
 *   ┌─────────── Navbar ───────────┐
 *   │ Sidebar │ Editor │ AI Panel  │
 *   ├─────────── Console ──────────┤
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { VscFiles, VscSearch, VscHistory, VscSettingsGear } from 'react-icons/vsc';
import useFiles from './src/hooks/useFiles';
import useRunner from './src/hooks/useRunner';
import useAI from './src/hooks/useAI';
import EditorPage from './src/pages/index';

/* ── Language detection helper ──────── */
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

export default function App() {
  // ── Initialize hooks at the top level ──
  const filesHook = useFiles();
  const runnerHook = useRunner();
  const aiHook = useAI();

  // ── UI Toggles ─────────────────────────
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');

  // ── Selected code state (shared between Editor ↔ AI) ──
  const [selectedCode, setSelectedCode] = useState('');

  // ── Derive language from active file ───
  const activeFileData = filesHook.activeFile
    ? filesHook.files[filesHook.activeFile]
    : null;

  const language = useMemo(
    () => detectLanguage(activeFileData?.name),
    [activeFileData?.name]
  );

  // ── Resizer State ──────────────────────
  const [aiWidth, setAiWidth] = useState(300);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);

  // ── AI Panel Resizer ───────────────────
  const startAiResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = aiWidth;
    setIsResizing(true);

    const onMouseMove = (moveEvent) => {
      // Dragging left increases width, dragging right decreases width
      const newWidth = Math.max(250, Math.min(800, startWidth - (moveEvent.clientX - startX)));
      setAiWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [aiWidth]);

  // ── Console Resizer ────────────────────
  const startConsoleResize = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = consoleHeight;
    setIsResizing(true);

    const onMouseMove = (moveEvent) => {
      // Dragging up increases height, dragging down decreases height
      const newHeight = Math.max(150, Math.min(800, startHeight - (moveEvent.clientY - startY)));
      setConsoleHeight(newHeight);
    };
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [consoleHeight]);

  return (
    <div 
      className="app-layout" 
      style={{
        gridTemplateColumns: `48px ${activeSidebarTab ? '220px' : '0px'} 1fr ${aiWidth}px`,
        gridTemplateRows: `48px 1fr ${consoleHeight}px`,
        // Prevent text selection while dragging
        userSelect: isResizing ? 'none' : 'auto'
      }}
    >
      {/* ── Navbar ─────────────────────── */}
      <nav className="navbar" id="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="navbar-logo">
            <span style={{ color: 'var(--color-primary)', marginRight: '4px', fontSize: '26px' }}>◢</span>
            <span>
              <span className="logo-dev">Dev</span>
              <span className="logo-mind">Mind</span>
            </span>
          </div>
        </div>
      </nav>

      {/* ── Activity Bar ───────────────── */}
      <div style={{
        gridColumn: 1,
        gridRow: '2 / -1',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-4) 0',
        gap: 'var(--space-4)',
        zIndex: 60,
      }}>
        {/* Top Icons */}
        <button 
          onClick={() => setActiveSidebarTab(activeSidebarTab === 'explorer' ? null : 'explorer')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSidebarTab === 'explorer' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            borderLeft: activeSidebarTab === 'explorer' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginLeft: '-2px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)'
          }}
          title="Explorer"
          onMouseEnter={(e) => activeSidebarTab !== 'explorer' && (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => activeSidebarTab !== 'explorer' && (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <VscFiles size={24} />
        </button>
        <button 
          onClick={() => setActiveSidebarTab(activeSidebarTab === 'search' ? null : 'search')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSidebarTab === 'search' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            borderLeft: activeSidebarTab === 'search' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginLeft: '-2px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)'
          }}
          title="Search"
          onMouseEnter={(e) => activeSidebarTab !== 'search' && (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => activeSidebarTab !== 'search' && (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <VscSearch size={22} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Bottom Icons */}
        <button 
          style={{
            background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
            padding: 'var(--space-2)', width: '100%', display: 'flex', justifyContent: 'center'
          }}
          title="History"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <VscHistory size={22} />
        </button>
        <button 
          style={{
            background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
            padding: 'var(--space-2)', width: '100%', display: 'flex', justifyContent: 'center'
          }}
          title="Settings"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <VscSettingsGear size={22} />
        </button>
      </div>

      {/* ── Editor Page (all 4 panels) ─── */}
      <EditorPage
        filesHook={filesHook}
        runnerHook={runnerHook}
        aiHook={aiHook}
        selectedCode={selectedCode}
        onSelectionChange={setSelectedCode}
        language={language}
        activeSidebarTab={activeSidebarTab}
      />

      {/* ── Invisible Drag Handles ───────── */}
      <div
        onMouseDown={startAiResize}
        style={{
          gridColumn: 4,
          gridRow: 2,
          justifySelf: 'start',
          width: '6px',
          height: '100%',
          cursor: 'col-resize',
          transform: 'translateX(-3px)',
          zIndex: 50,
          background: 'transparent',
        }}
        title="Resize AI Assistant"
      />

      <div
        onMouseDown={startConsoleResize}
        style={{
          gridColumn: '1 / -1',
          gridRow: 3,
          alignSelf: 'start',
          height: '6px',
          width: '100%',
          cursor: 'row-resize',
          transform: 'translateY(-3px)',
          zIndex: 50,
          background: 'transparent',
        }}
        title="Resize Terminal"
      />

      {/* Global cursor override during drag */}
      {isResizing && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999,
          cursor: 'grabbing'
        }} />
      )}
    </div>
  );
}
