import React, { useState, useMemo } from 'react';
import { VscSearch, VscFileCode } from 'react-icons/vsc';

export default function SearchPanel({ useFilesHook }) {
  const { files, setActiveFile } = useFilesHook;
  const [query, setQuery] = useState('');

  // Search logic: check filename or file contents (case-insensitive)
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    
    return Object.values(files).filter(file => {
      const matchName = file.name.toLowerCase().includes(q);
      const matchContent = file.content && file.content.toLowerCase().includes(q);
      return matchName || matchContent;
    });
  }, [files, query]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-sidebar)',
    }}>
      <div style={{
        padding: '16px 16px 8px 16px',
        fontWeight: 600,
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--color-text-muted)'
      }}>
        Search
      </div>

      <div style={{ padding: '0 16px 16px 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          gap: '8px'
        }}>
          <VscSearch size={14} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!query.trim() && (
          <div style={{ padding: '0 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Type to search inside all workspace files...
          </div>
        )}
        
        {query.trim() && results.length === 0 && (
          <div style={{ padding: '0 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No results found.
          </div>
        )}

        {query.trim() && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0 16px 8px 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map(file => (
              <div
                key={file.id}
                onClick={() => setActiveFile(file.id)}
                style={{
                  padding: '4px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <VscFileCode size={14} color="var(--color-primary)" />
                <span style={{ color: 'var(--color-text-primary)' }}>{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
