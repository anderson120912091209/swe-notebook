// MathDisplay component for static rendering of saved math

import React, { useMemo } from 'react';
import { tokenize } from '@/app/lib/math-dsl/lexer';
import { parse } from '@/app/lib/math-dsl/parser';
import { MathExpression } from '@/app/lib/math-dsl/renderer';

interface MathDisplayProps {
  src: string;
  onEdit: () => void;
  theme?: 'light' | 'dark';
}

/**
 * Static display component for rendered math expressions
 */
const MathDisplay: React.FC<MathDisplayProps> = ({ src, onEdit, theme = 'light' }) => {
  // Parse the source string into AST
  const ast = useMemo(() => {
    if (!src.trim()) return null;
    try {
      const tokens = tokenize(src);
      return parse(tokens);
    } catch (error) {
      console.error('MathDisplay: Parse error:', error);
      return null;
    }
  }, [src]);

  // Render the AST
  const rendered = useMemo(() => {
    if (!ast) return null;
    return <MathExpression node={ast} theme={theme} />;
  }, [ast, theme]);

  if (!src.trim()) {
    return (
      <span 
        className="math-display-empty"
        onClick={onEdit}
        style={{
          padding: '2px 6px',
          border: '1px dashed var(--border-color)',
          borderRadius: '3px',
          color: 'var(--foreground-muted)',
          cursor: 'pointer',
          backgroundColor: 'var(--hover-bg)',
          fontSize: '0.9em',
          display: 'inline-block',
          minWidth: '40px',
          textAlign: 'center'
        }}
      >
        $math$
      </span>
    );
  }

  if (!rendered) {
    return (
      <span 
        className="math-display-error"
        onClick={onEdit}
        style={{
          padding: '2px 6px',
          border: '1px solid #ef4444',
          borderRadius: '3px',
          color: '#ef4444',
          cursor: 'pointer',
          backgroundColor: '#fef2f2',
          fontSize: '0.9em',
          display: 'inline-block'
        }}
      >
        Error: {src}
      </span>
    );
  }

  return (
    <span 
      className="math-display"
      onClick={onEdit}
      style={{
        padding: '2px 6px',
        border: '1px solid var(--border-color)',
        borderRadius: '3px',
        backgroundColor: 'var(--math-bg)',
        cursor: 'pointer',
        display: 'inline-block',
        margin: '0 2px',
        verticalAlign: 'middle',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--math-bg)';
      }}
    >
      {rendered}
    </span>
  );
};

export default MathDisplay;
