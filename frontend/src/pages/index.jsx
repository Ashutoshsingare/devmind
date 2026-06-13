/**
 * DevMind — Editor Page
 *
 * The main editor page that receives all 3 hooks as props
 * from App.jsx and distributes them to the correct components.
 *
 * Layout (from App.css grid classes):
 *   ┌─────────── Navbar ───────────┐
 *   │ Sidebar │ Editor │ AI Panel  │
 *   ├─────────── Console ──────────┤
 *
 * Props:
 *   filesHook       → FileTree, EditorPane
 *   runnerHook      → ConsolePanel
 *   aiHook          → AIChatPanel
 *   selectedCode    → AIChatPanel
 *   onSelectionChange → EditorPane
 *   language        → AIChatPanel
 *   activeFileData  → derived file data for content passing
 */

import React from 'react';
import FileTree from '../components/FileTree';
import SearchPanel from '../components/SearchPanel';
import EditorPane from '../components/EditorPane';
import ConsolePanel from '../components/ConsolePanel';
import AIChatPanel from '../components/AIChatPanel';

export default function EditorPage({
  filesHook,
  runnerHook,
  aiHook,
  selectedCode,
  onSelectionChange,
  language,
  activeSidebarTab,
}) {
  // Derive active file data and content
  const activeFileData = filesHook.activeFile
    ? filesHook.files[filesHook.activeFile]
    : null;
  const fileContent = activeFileData?.content || '';
  const activeFileName = activeFileData?.name || null;

  // Get last stderr output for AI "Fix Error" action
  const lastErrorOutput = runnerHook.output
    .filter((line) => line.type === 'stderr')
    .map((line) => line.text)
    .join('\n') || '';

  return (
    <>
      {/* ── Sidebar: Explorer or Search ────── */}
      {activeSidebarTab && (
        <aside className="sidebar" id="sidebar">
          {activeSidebarTab === 'explorer' && <FileTree useFilesHook={filesHook} />}
          {activeSidebarTab === 'search' && <SearchPanel useFilesHook={filesHook} />}
        </aside>
      )}

      {/* ── Main: Code Editor ─────────── */}
      <main className="editor-area" id="editor-area">
        <EditorPane
          useFilesHook={filesHook}
          onSelectionChange={onSelectionChange}
          language={language}
          activeSidebarTab={activeSidebarTab}
        />
      </main>

      {/* ── Right: AI Assistant ────────── */}
      <aside className="ai-panel" id="ai-panel">
        <AIChatPanel
          useAIHook={aiHook}
          activeFile={activeFileName}
          selectedCode={selectedCode}
          fileContent={fileContent}
          language={language}
          lastErrorOutput={lastErrorOutput}
        />
      </aside>

      {/* ── Bottom: Console / Terminal ─── */}
      <section className="console" id="console">
        <ConsolePanel
          useRunnerHook={runnerHook}
          activeFile={activeFileName}
          fileContent={fileContent}
        />
      </section>
    </>
  );
}
