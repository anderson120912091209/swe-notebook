'use client';

import React, { useState, useEffect, useRef } from 'react';

interface MathEditorProps {
  onSave: (latex: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
  initialValue?: string;
}

const MathEditor: React.FC<MathEditorProps> = ({
  onSave,
  onCancel,
  autoFocus = true,
  initialValue = '',
}) => {
  const [latex, setLatex] = useState(initialValue);
  const [preview, setPreview] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.katex && latex) {
      try {
        // @ts-ignore
        const html = window.katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        setPreview(html);
      } catch (error) {
        console.error('KaTeX render error:', error);
        setPreview(latex);
      }
    } else {
      setPreview('');
    }
  }, [latex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (latex.trim()) {
      onSave(latex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="math-editor-container"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '2px solid var(--input-border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px var(--shadow)',
        minWidth: '320px',
        zIndex: 1000,
      }}
    >
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter LaTeX: x^2, \frac{a}{b}, \sqrt{x}"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--foreground)',
            marginBottom: '8px',
          }}
        />
        
        {preview && (
          <div
            style={{
              padding: '8px',
              backgroundColor: 'var(--math-bg)',
              borderRadius: '4px',
              marginBottom: '8px',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '13px',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Insert
          </button>
        </div>
      </form>
    </div>
  );
};

export default MathEditor;

