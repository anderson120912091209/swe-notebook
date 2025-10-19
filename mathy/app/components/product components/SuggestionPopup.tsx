// Suggestion popup component for math DSL autocomplete

import React from 'react';
import { Suggestion } from '@/app/lib/math-dsl/types';

interface SuggestionPopupProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
}

/**
 * Autocomplete popup for math DSL keywords
 */
const SuggestionPopup: React.FC<SuggestionPopupProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onClose
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '250px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.keyword}
          onClick={() => onSelect(suggestion)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: index === selectedIndex ? 'var(--hover-bg)' : 'transparent',
            borderLeft: index === selectedIndex ? '3px solid var(--accent-color)' : '3px solid transparent',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontSize: '13px',
              fontWeight: 'bold',
              color: 'var(--foreground)'
            }}>
              {suggestion.keyword.split('(')[0]}
            </span>
            <span style={{ 
              fontSize: '16px',
              color: 'var(--accent-color)',
              marginLeft: '8px'
            }}>
              {suggestion.display}
            </span>
          </div>
          {suggestion.description && (
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--foreground-muted)',
              marginTop: '2px'
            }}>
              {suggestion.description}
            </div>
          )}
        </div>
      ))}
      
      {/* Footer hint */}
      <div style={{
        padding: '6px 12px',
        backgroundColor: 'var(--hover-bg)',
        borderTop: '1px solid var(--border-color)',
        fontSize: '10px',
        color: 'var(--foreground-muted)',
        textAlign: 'center'
      }}>
        Tab or Click to insert • Esc to close
      </div>
    </div>
  );
};

export default SuggestionPopup;
