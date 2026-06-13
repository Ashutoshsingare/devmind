import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, Bug, Zap, Wrench, ArrowRight, Trash2, Square, Play, Brain, Check } from 'lucide-react';

/* ── Action button definitions ────────── */
const AI_ACTIONS = [
  { key: 'explain', icon: Sparkles, label: 'Explain' },
  { key: 'fix', icon: Bug, label: 'Debug' },
  { key: 'optimize', icon: Zap, label: 'Optimize' },
  { key: 'refactor', icon: Wrench, label: 'Refactor' },
];

export default function AIChatPanel({
  useAIHook,
  activeFile,
  selectedCode,
  fileContent,
  language,
  lastErrorOutput,
}) {
  const {
    messages,
    isLoading,
    sendMessage,
    explainCode,
    fixError,
    optimizeCode,
    refactor,
    clearMessages,
  } = useAIHook;

  const [inputValue, setInputValue] = useState('');
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [pressedBtn, setPressedBtn] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  /* ── Auto-scroll on new messages ─────── */
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  /* ── Send chat message ──────────────── */
  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue('');
    sendMessage(text, fileContent, language || 'javascript');
  }, [inputValue, isLoading, sendMessage, fileContent, language]);

  /* ── Keyboard: Ctrl+Enter to send ───── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  /* ── Action button handlers ─────────── */
  const handleAction = useCallback((action) => {
    if (isLoading) return;
    const code = selectedCode || fileContent || '';
    const lang = language || 'javascript';

    switch (action) {
      case 'explain': explainCode(code, lang); break;
      case 'fix': fixError(fileContent || '', lastErrorOutput || 'Unknown error', lang); break;
      case 'optimize': optimizeCode(code, lang); break;
      case 'refactor': refactor(code, lang); break;
      default: break;
    }
  }, [isLoading, selectedCode, fileContent, language, lastErrorOutput, explainCode, fixError, optimizeCode, refactor]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#0D1117',
      fontFamily: "'Inter', sans-serif",
      color: '#F8FAFC',
    }}>
      {/* ── Header ──────────────────────── */}
      <div style={{
        padding: '16px',
        backgroundColor: '#0D1117',
        borderBottom: '1px solid #1F2937',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>AI Assistant</div>
        <div style={{ fontSize: '13px', color: '#94A3B8' }}>Powered by DevMind</div>
      </div>

      {/* ── Messages Area ───────────────── */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {messages.length === 0 && !isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '32px',
            color: '#94A3B8',
            textAlign: 'center',
            animation: 'fade-in 180ms ease',
          }}>
            <Brain size={48} strokeWidth={1.5} style={{ opacity: 0.6 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC' }}>AI Assistant</div>
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span>Explain code</span>
                <span>Fix bugs</span>
                <span>Generate tests</span>
                <span>Refactor</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#1F2937' }} />
            <div style={{ fontSize: '14px' }}>Start a conversation</div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isError = msg.role === 'error';

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'fade-in 180ms ease',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>
                  {isUser ? 'You' : 'DevMind'}
                </div>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#111827',
                  border: isError ? '1px solid #EF4444' : '1px solid #1F2937',
                  color: isError ? '#EF4444' : '#F8FAFC',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 8px rgba(0,0,0,.12)',
                }}>
                  {isUser || isError ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeText = String(children).replace(/\n$/, '');
                          return !inline && match ? (
                            <div style={{ margin: '16px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1F2937' }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#0D1117',
                                padding: '8px 12px',
                                borderBottom: '1px solid #1F2937',
                                fontSize: '12px',
                                color: '#94A3B8',
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              }}>
                                <span>{match[1]}</span>
                                <button
                                  onClick={(e) => {
                                    navigator.clipboard.writeText(codeText);
                                    const btn = e.currentTarget;
                                    const originalHTML = btn.innerHTML;
                                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
                                    btn.style.color = '#22C55E';
                                    setTimeout(() => {
                                      btn.innerHTML = originalHTML;
                                      btn.style.color = '#94A3B8';
                                    }, 2000);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94A3B8',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontFamily: "'Inter', sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'color 180ms ease'
                                  }}
                                  onMouseEnter={(e) => { if (e.currentTarget.innerText !== 'Copied!') e.currentTarget.style.color = '#F8FAFC'; }}
                                  onMouseLeave={(e) => { if (e.currentTarget.innerText !== 'Copied!') e.currentTarget.style.color = '#94A3B8'; }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                  Copy
                                </button>
                              </div>
                              <SyntaxHighlighter
                                {...props}
                                children={codeText}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  background: '#0D1117', // Match outer bg
                                  fontSize: '13px',
                                  padding: '12px',
                                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}
                              />
                            </div>
                          ) : (
                            <code {...props} className={className} style={{
                              background: 'rgba(255,255,255,0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              fontSize: '13px',
                              color: '#F8FAFC'
                            }}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }) { return <p style={{ margin: '0 0 16px 0' }}>{children}</p>; },
                        ul({ children }) { return <ul style={{ margin: '0 0 16px 0', paddingLeft: '24px' }}>{children}</ul>; },
                        ol({ children }) { return <ol style={{ margin: '0 0 16px 0', paddingLeft: '24px' }}>{children}</ol>; },
                        h1({ children }) { return <h1 style={{ margin: '24px 0 16px 0', fontSize: '18px', fontWeight: 600 }}>{children}</h1>; },
                        h2({ children }) { return <h2 style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: 600 }}>{children}</h2>; },
                        h3({ children }) { return <h3 style={{ margin: '16px 0 8px 0', fontSize: '14px', fontWeight: 600 }}>{children}</h3>; },
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading skeleton skeleton */}
        {isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fade-in 180ms ease',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>DevMind</div>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#111827',
              border: '1px solid #1F2937',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ height: '12px', width: '60%', backgroundColor: '#1F2937', borderRadius: '4px', animation: 'pulse-dot 1.5s infinite' }} />
              <div style={{ height: '12px', width: '80%', backgroundColor: '#1F2937', borderRadius: '4px', animation: 'pulse-dot 1.5s infinite 0.2s' }} />
              <div style={{ height: '12px', width: '40%', backgroundColor: '#1F2937', borderRadius: '4px', animation: 'pulse-dot 1.5s infinite 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions ──────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        borderTop: '1px solid #1F2937',
        backgroundColor: '#0D1117',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Sparkles size={14} /> Quick Actions
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {AI_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isHovered = hoveredAction === action.key;
            return (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={isLoading}
                onMouseEnter={() => setHoveredAction(action.key)}
                onMouseLeave={() => setHoveredAction(null)}
                style={{
                  height: '36px',
                  background: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: '1px solid #1F2937',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isHovered ? '#F8FAFC' : '#CBD5E1',
                  cursor: isLoading ? 'default' : 'pointer',
                  transition: 'all 180ms ease',
                  opacity: isLoading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,.12)',
                }}
              >
                <Icon size={14} strokeWidth={1.75} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Message Input ──────────────────── */}
      <div style={{
        padding: '0 16px 16px',
        backgroundColor: '#0D1117',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0D1117',
          border: isInputFocused ? '1px solid #2563EB' : '1px solid #30363D',
          borderRadius: '10px',
          padding: '0 12px',
          height: '44px',
          transition: 'border-color 180ms ease',
          boxShadow: isInputFocused ? '0 0 0 1px rgba(37,99,235,0.2)' : 'none',
        }}>
          <input
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Ask anything about your code..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span style={{ fontSize: '10px', color: '#94A3B8', marginRight: '8px', userSelect: 'none' }}>
            Ctrl+Enter
          </span>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              background: 'transparent',
              color: (!inputValue.trim() || isLoading) ? '#30363D' : '#2563EB',
              border: 'none',
              cursor: (!inputValue.trim() || isLoading) ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              transition: 'color 180ms ease, transform 180ms ease',
              transform: pressedBtn === 'send' ? 'scale(0.9)' : 'scale(1)',
            }}
            onMouseDown={() => setPressedBtn('send')}
            onMouseUp={() => setPressedBtn(null)}
            onMouseLeave={() => setPressedBtn(null)}
          >
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

    </div>
  );
}
