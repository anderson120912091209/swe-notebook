/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';
import { preprocessToLatex } from '@/app/lib/math-dsl/preprocessor';

// Inline math content component - renders saved LaTeX
const InlineMathContent: React.FC<{
  latex: string;
  onEdit: () => void;
}> = ({ latex, onEdit }) => {
  const [renderedMath, setRenderedMath] = useState<string>('');
  const [isKatexReady, setIsKatexReady] = useState(false);

  // Load KaTeX if not already loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if KaTeX is already loaded
      if (window.katex) {
        setIsKatexReady(true);
      } else {
        // Load KaTeX script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js';
        script.integrity = 'sha384-hIoBPJpTUs74ddyc4bFZSM1TVlQDA60VBbJS0oA934VSz82sBx1X7kSx2ATBDIyd';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          setIsKatexReady(true);
        };
        document.head.appendChild(script);
      }
    }
  }, []);

  // Render LaTeX when KaTeX is ready
  useEffect(() => {
    if (isKatexReady && latex && typeof window !== 'undefined' && window.katex) {
      try {
        const html = window.katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        setRenderedMath(html);
      } catch (error) {
        console.error('KaTeX render error:', error);
        setRenderedMath(latex);
      }
    }
  }, [latex, isKatexReady]);

  if (!latex.trim()) {
    return (
      <span 
        className="inline-math-placeholder"
        onClick={onEdit}
        style={{
          padding: '2px 6px',
          borderRadius: '3px',
          color: 'var(--muted-text)',
          cursor: 'pointer',
          backgroundColor: 'var(--math-bg)',
          fontSize: '0.85em',
        }}
      >
        $math$
      </span>
    );
  }

  // Show loading state while KaTeX is loading
  if (!isKatexReady) {
    return (
      <span 
        className="inline-math-loading"
        style={{
          padding: '2px 6px',
          borderRadius: '3px',
          backgroundColor: 'var(--math-bg)',
          cursor: 'pointer',
          display: 'inline-block',
          margin: '0 2px',
          fontSize: '0.85em',
          color: 'var(--muted-text)',
        }}
      >
        {latex}
      </span>
    );
  }

  return (
    <span 
      className="inline-math-content"
      onClick={onEdit}
      style={{
        padding: '2px 6px',
        borderRadius: '3px',
        backgroundColor: 'var(--math-bg)',
        cursor: 'pointer',
        display: 'inline-block',
        margin: '0 2px',
        verticalAlign: 'middle',
        fontSize: '0.85em',
      }}
      dangerouslySetInnerHTML={{ __html: renderedMath || latex }}
    />
  );
};

// Create the custom inline math content
export const InlineMath = createReactInlineContentSpec(
  {
    type: 'inlineMath',
    propSchema: {
      latex: {
        default: '',
        values: undefined, // Any string value
      },
    },
    content: 'none', // No styled text content, just the math
  },
  {
    render: (props) => {
      // Start in edit mode ONLY if latex is empty (new content)
      const [isEditing, setIsEditing] = useState(!props.inlineContent.props.latex);
      const [currentLatex, setCurrentLatex] = useState(props.inlineContent.props.latex || '');

      // Sync with props when they change
      useEffect(() => {
        setCurrentLatex(props.inlineContent.props.latex || '');
      }, [props.inlineContent.props.latex]);

      const handleEdit = () => {
        setIsEditing(true);
      };

      const handleSave = (newLatex: string) => {
        if (newLatex.trim()) {
          setCurrentLatex(newLatex);
          props.updateInlineContent({
            type: 'inlineMath',
            props: { latex: newLatex },
          });
          setIsEditing(false);
          
          // Focus back to the editor content after a brief delay
          setTimeout(() => {
            // Find the BlockNote editor container and focus it
            const bnEditor = document.querySelector('.bn-container [contenteditable="true"]') as HTMLElement;
            if (bnEditor) {
              bnEditor.focus();
            }
          }, 50);
        } else {
          handleCancel();
        }
      };

      const handleCancel = () => {
        setIsEditing(false);
        // If cancelling empty math, keep it empty
        if (!currentLatex || currentLatex.trim() === '') {
          props.updateInlineContent({
            type: 'inlineMath',
            props: { latex: '' },
          });
        }
      };

      if (isEditing) {
        return (
          <span 
            contentEditable={false}
            style={{ display: 'inline-block', position: 'relative' }}
          >
            <InlineMathEditor
              initialLatex={currentLatex}
              onSave={handleSave}
              onCancel={handleCancel}
              autoFocus
            />
          </span>
        );
      }

      return (
        <>
          <InlineMathContent
            latex={currentLatex}
            onEdit={handleEdit}
          />
          <span style={{ userSelect: 'none' }}>{'\u200B'}</span>
        </>
      );
    },
  }
);

// Simple LaTeX input editor component with preprocessing
interface InlineMathEditorProps {
  initialLatex: string;
  onSave: (latex: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

const InlineMathEditor: React.FC<InlineMathEditorProps> = ({
  initialLatex = '',
  onSave,
  onCancel,
  autoFocus = true,
}) => {
  const [latex, setLatex] = useState(initialLatex);
  const [previewLatex, setPreviewLatex] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preprocess input to LaTeX for preview
  useEffect(() => {
    const processed = preprocessToLatex(latex);
    setPreviewLatex(processed);
  }, [latex]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Use setTimeout to ensure focus happens after render
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Move cursor to end
          inputRef.current.selectionStart = inputRef.current.value.length;
          inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        // Don't trigger if clicking on BlockNote editor
        const target = event.target as HTMLElement;
        if (!target.closest('.bn-container')) {
          handleSave();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latex]);

  const handleSave = () => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (latex.trim()) {
      // Save the preprocessed LaTeX
      onSave(previewLatex);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation to prevent BlockNote from handling these keys
    e.stopPropagation();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'ArrowRight' && inputRef.current) {
      // If cursor is at the end, save and exit
      const cursorPos = inputRef.current.selectionStart || 0;
      const textLength = inputRef.current.value.length;
      if (cursorPos === textLength) {
        e.preventDefault();
        handleSave();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setLatex(e.target.value);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only save if not clicking back into the editor
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.bn-container')) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 150);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={latex}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onBlur={handleBlur}
        placeholder="Type: x/y, alpha, x^2, \\frac{a}{b}"
        autoComplete="off"
        spellCheck={false}
        style={{
          flex: 1,
          padding: '4px 8px',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          fontSize: '13px',
          fontFamily: 'monospace',
          outline: 'none',
          backgroundColor: 'var(--input-bg)',
          color: 'var(--foreground)'
        }}
      />
      
      {/* Live preview */}
      {previewLatex && (
        <div style={{ 
          padding: '2px 6px',
          borderRadius: '3px',
          backgroundColor: 'var(--math-bg)',
          fontSize: '11px',
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {previewLatex}
        </div>
      )}
    </div>
  );
};

export default InlineMath;

