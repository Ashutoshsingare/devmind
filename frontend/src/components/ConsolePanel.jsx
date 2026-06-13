import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Terminal, Play, Square, Trash2, CircleAlert, Bug, FileText } from 'lucide-react';

/* ── Language detection ── */
function detectLanguage(filename) {
  if (!filename) return 'javascript';
  const ext = (filename || '').split('.').pop().toLowerCase();
  const map = { js: 'javascript', jsx: 'javascript', ts: 'typescript', py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', cxx: 'cpp' };
  return map[ext] || 'javascript';
}

const COLORS = {
  bgPrimary: '#0D1117',
  bgSecondary: '#111827',
  border: '#1F2937',
  hover: '#161B22',
  command: '#60A5FA',
  output: '#F8FAFC',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  muted: '#94A3B8',
  runBg: '#2563EB',
  runHover: '#1D4ED8',
  stopBorder: '#30363D',
};

const TABS = [
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'output', label: 'Output', icon: FileText },
  { id: 'problems', label: 'Problems', icon: CircleAlert },
  { id: 'debug', label: 'Debug', icon: Bug },
];

export default function ConsolePanel({ useRunnerHook, activeFile, fileContent }) {
  const { output, isRunning, exitCode, runCode, clearOutput } = useRunnerHook;

  const [activeTab, setActiveTab] = useState('terminal');
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [pressedBtn, setPressedBtn] = useState(null);
  
  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalInput, setTerminalInput] = useState('');
  
  // Problems state - derived from output now
  const [problemsList, setProblemsList] = useState([]);

  // Debug state
  const [debugOutput, setDebugOutput] = useState([]);
  const [isDebugRunning, setIsDebugRunning] = useState(false);

  const outputContainerRef = useRef(null);

  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTo({
        top: outputContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [output]);

  const handleRun = useCallback(() => {
    if (isRunning || !activeFile || !fileContent) return;
    setActiveTab('output');
    const lang = detectLanguage(activeFile);
    runCode(activeFile, fileContent, lang);
  }, [isRunning, activeFile, fileContent, runCode]);

  const handleDebugRun = useCallback(async () => {
    if (isDebugRunning || !activeFile) return;
    setActiveTab('debug');
    setIsDebugRunning(true);
    setDebugOutput([{ type: 'system', text: `▶ Starting debugger for ${activeFile}...` }]);
    
    try {
      const lang = detectLanguage(activeFile);
      const res = await fetch('/api/debug/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: activeFile, language: lang })
      });
      const data = await res.json();
      
      if (data.stdout) {
        setDebugOutput(prev => [...prev, ...data.stdout.split('\n').filter(l => l).map(text => ({ type: 'stdout', text }))]);
      }
      if (data.stderr) {
        setDebugOutput(prev => [...prev, ...data.stderr.split('\n').filter(l => l).map(text => ({ type: 'stderr', text }))]);
      }
      setDebugOutput(prev => [...prev, { type: 'system', text: `Process exited with code ${data.exitCode}` }]);
    } catch (err) {
      setDebugOutput(prev => [...prev, { type: 'stderr', text: `Debug error: ${err.message}` }]);
    } finally {
      setIsDebugRunning(false);
    }
  }, [isDebugRunning, activeFile]);

  useEffect(() => {
    // Parse runtime errors from stderr output to populate Problems tab
    const newProblems = [];
    let currentProblem = null;

    output.forEach(line => {
      if (line.type === 'stderr') {
        const text = line.text;
        
        // JS runtime error matching (e.g., /path/file.js:4)
        const jsMatch = text.match(/:(\d+)\r?\n/);
        if (jsMatch && !currentProblem) {
          currentProblem = { line: parseInt(jsMatch[1], 10), col: 1, message: 'Runtime Error', severity: 'error' };
        } else if (text.includes('Error:') && currentProblem) {
          currentProblem.message = text.trim();
          newProblems.push({ ...currentProblem });
          currentProblem = null;
        } else if (text.includes('Error:') && !currentProblem) {
          newProblems.push({ line: '?', col: '?', message: text.trim(), severity: 'error' });
        }

        // Python runtime error matching
        const pyMatch = text.match(/File ".*?", line (\d+)/);
        if (pyMatch) {
          currentProblem = { line: parseInt(pyMatch[1], 10), col: 1, message: 'Runtime Error', severity: 'error' };
        } else if (currentProblem && /^[a-zA-Z]+Error:/.test(text)) {
          currentProblem.message = text.trim();
          newProblems.push({ ...currentProblem });
          currentProblem = null;
        }
      }
    });

    setProblemsList(newProblems);
  }, [output]);

  const handleTerminalSubmit = async (e) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      const cmd = terminalInput.trim();
      setTerminalInput('');
      setTerminalHistory(prev => [...prev, { type: 'command', text: cmd }]);
      
      try {
        const res = await fetch('/api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        
        if (data.stdout) {
          setTerminalHistory(prev => [...prev, ...data.stdout.split('\n').filter(l => l).map(text => ({ type: 'stdout', text }))]);
        }
        if (data.stderr) {
          setTerminalHistory(prev => [...prev, ...data.stderr.split('\n').filter(l => l).map(text => ({ type: 'stderr', text }))]);
        }
      } catch (err) {
        setTerminalHistory(prev => [...prev, { type: 'stderr', text: `Network error: ${err.message}` }]);
      }
    }
  };

  const getStatus = () => {
    if (activeTab === 'terminal') return null;
    if (activeTab === 'debug') {
      if (isDebugRunning) return { label: 'Debugging', color: COLORS.success };
      if (debugOutput.length > 0) return { label: 'Finished', color: COLORS.muted };
    }
    if (activeTab === 'output') {
      if (isRunning) return { label: 'Running', color: COLORS.success };
      if (output.length > 0 && exitCode !== 0 && exitCode !== null) return { label: 'Error', color: COLORS.error };
      if (output.length > 0) return { label: 'Finished', color: COLORS.muted };
    }
    if (activeTab === 'problems') {
      if (problemsList.length > 0) return { label: `${problemsList.length} Errors`, color: COLORS.error };
      return { label: 'No issues', color: COLORS.success };
    }
    return null;
  };

  const status = getStatus();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: COLORS.bgPrimary,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: COLORS.output,
    }}>
      {/* ── Header / Tab Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '40px',
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.bgSecondary,
        padding: '0 16px',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '100%',
                  cursor: 'pointer',
                  color: isActive ? COLORS.output : COLORS.muted,
                  fontSize: '12px',
                  fontWeight: isActive ? 500 : 400,
                  position: 'relative',
                  transition: 'color 180ms ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#cbd5e1'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = COLORS.muted; }}
              >
                <Icon size={14} strokeWidth={1.75} />
                {tab.label}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: '2px',
                    backgroundColor: COLORS.output,
                    borderRadius: '2px 2px 0 0'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '16px', fontSize: '12px', color: COLORS.muted }}>
              <span style={{ color: status.color, fontSize: '10px' }}>●</span>
              {status.label}
            </div>
          )}

          <button
            onClick={clearOutput}
            onMouseEnter={() => setHoveredBtn('clear')}
            onMouseLeave={() => { setHoveredBtn(null); setPressedBtn(null); }}
            onMouseDown={() => setPressedBtn('clear')}
            onMouseUp={() => setPressedBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: hoveredBtn === 'clear' ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: 'none',
              color: COLORS.muted,
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 180ms ease',
              transform: pressedBtn === 'clear' ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            <Trash2 size={14} strokeWidth={1.75} />
            Clear
          </button>

          <button
            onMouseEnter={() => setHoveredBtn('stop')}
            onMouseLeave={() => { setHoveredBtn(null); setPressedBtn(null); }}
            onMouseDown={() => setPressedBtn('stop')}
            onMouseUp={() => setPressedBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: hoveredBtn === 'stop' ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: `1px solid ${COLORS.stopBorder}`,
              color: COLORS.output,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'not-allowed', // not implemented
              fontSize: '12px',
              transition: 'all 180ms ease',
              transform: pressedBtn === 'stop' ? 'scale(0.98)' : 'scale(1)',
              opacity: 0.6,
            }}
          >
            <Square size={14} strokeWidth={1.75} fill="currentColor" />
            Stop
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning || !activeFile}
            onMouseEnter={() => setHoveredBtn('run')}
            onMouseLeave={() => { setHoveredBtn(null); setPressedBtn(null); }}
            onMouseDown={() => setPressedBtn('run')}
            onMouseUp={() => setPressedBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: hoveredBtn === 'run' && !isRunning ? COLORS.runHover : COLORS.runBg,
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: isRunning || !activeFile ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              opacity: (!activeFile || isRunning) ? 0.6 : 1,
              transition: 'all 180ms ease',
              transform: pressedBtn === 'run' ? 'scale(0.98)' : 'scale(1)',
              boxShadow: 'none',
            }}
          >
            <Play size={14} strokeWidth={2} fill="currentColor" />
            Run
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        ref={outputContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          fontSize: '14px',
          lineHeight: 1.6,
          letterSpacing: '0.2px',
        }}
      >
        {activeTab === 'terminal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {terminalHistory.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', color: line.type === 'stderr' ? COLORS.error : COLORS.output }}>
                {line.type === 'command' && <span style={{ color: COLORS.command, userSelect: 'none' }}>$</span>}
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.text}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span style={{ color: COLORS.muted, userSelect: 'none' }}>$</span>
              <input
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalSubmit}
                placeholder="Enter command..."
                spellCheck="false"
                autoComplete="off"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: COLORS.output,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          output.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: COLORS.muted,
              gap: '12px',
              animation: 'fade-in 200ms ease',
            }}>
              <Terminal size={32} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: '4px' }} />
              <div style={{ fontSize: '14px', fontWeight: 500, color: COLORS.output }}>
                Ready to execute your code
              </div>
              <div style={{ fontSize: '13px' }}>
                Run your program to view output here.
              </div>
              <button
                onClick={handleRun}
                style={{
                  marginTop: '8px',
                  background: 'transparent',
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.output,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 180ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Play size={14} fill="currentColor" />
                Run Program
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {output.map((line, i) => {
                let color = COLORS.output;
                if (line.type === 'stderr') color = COLORS.error;
                if (line.type === 'system') {
                  if (line.text.includes('exited with code 0') || line.text.includes('successfully')) color = COLORS.success;
                  else if (line.text.includes('exited with code') || line.text.includes('error')) color = COLORS.error;
                  else color = COLORS.command;
                }

                return (
                  <div key={i} style={{ display: 'flex', gap: '12px', color }}>
                    {line.type === 'system' && !line.text.includes('exited') && (
                      <span style={{ color: COLORS.muted, userSelect: 'none' }}>▶</span>
                    )}
                    {line.text.includes('exited with code 0') && (
                      <span style={{ color: COLORS.success, userSelect: 'none' }}>✔</span>
                    )}
                    {line.text.includes('exited with code') && !line.text.includes('code 0') && (
                      <span style={{ color: COLORS.error, userSelect: 'none' }}>✘</span>
                    )}
                    
                    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'problems' && (
          problemsList.length === 0 ? (
            <div style={{ color: COLORS.success, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CircleAlert size={16} /> No syntax problems detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problemsList.map((prob, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', color: COLORS.error, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '4px', borderLeft: `2px solid ${COLORS.error}` }}>
                  <CircleAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{prob.message}</div>
                    <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>Line {prob.line}, Col {prob.col}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'debug' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {debugOutput.length === 0 ? (
              <div style={{ color: COLORS.muted, fontStyle: 'italic' }}>Run code in debug mode to see trace output.</div>
            ) : (
              debugOutput.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', color: line.type === 'stderr' ? COLORS.error : line.type === 'system' ? COLORS.command : COLORS.output }}>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.text}</span>
                </div>
              ))
            )}
            <button
              onClick={handleDebugRun}
              style={{
                marginTop: '16px',
                alignSelf: 'flex-start',
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.output,
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 180ms ease',
              }}
            >
              Restart Debugger
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
