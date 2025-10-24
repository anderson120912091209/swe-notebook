// MathEditor component for live editing of math expressions

import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import { tokenize } from '@/app/lib/math-dsl/lexer';
import { parse } from '@/app/lib/math-dsl/parser';
import { MathExpression } from '@/app/lib/math-dsl/renderer';
import { MathEditorState, MathEditorAction } from '@/app/lib/math-dsl/types';
import { getSuggestions, getCurrentToken, applySuggestion } from '@/app/lib/math-dsl/suggestions';
import SuggestionPopup from './SuggestionPopup';

interface MathEditorProps {
  initialSrc: string;
  onSave: (src: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
  performanceMode?: 'balanced' | 'aggressive';
}

// Initial state factory
function createInitialState(src: string): MathEditorState {
  return {
    src,
    tokens: [],
    ast: null,
    caretPosition: { tokenIndex: 0, offsetInToken: 0, astNodeId: null },
    selection: null,
    isComposing: false,
    compositionBuffer: '',
    compositionStart: 0,
    suggestions: [],
    selectedSuggestion: -1,
    lastParseTime: 0,
    lastRenderTime: 0
  };
}

// Reducer for state management
function mathEditorReducer(state: MathEditorState, action: MathEditorAction): MathEditorState {
  switch (action.type) {
    case 'SET_SRC':
      return { ...state, src: action.payload };
    case 'SET_CARET':
      return { ...state, caretPosition: action.payload };
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    case 'SET_COMPOSING':
      return {
        ...state,
        isComposing: action.payload.isComposing,
        compositionBuffer: action.payload.buffer || '',
        compositionStart: action.payload.start || 0
      };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'SET_SELECTED_SUGGESTION':
      return { ...state, selectedSuggestion: action.payload };
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        lastParseTime: action.payload.parseTime,
        lastRenderTime: action.payload.renderTime
      };
    case 'RESET_STATE':
      return createInitialState(action.payload.src);
    default:
      return state;
  }
}

/**
 * Main math editor component with live rendering
 */
const MathEditor: React.FC<MathEditorProps> = ({
  initialSrc = '',
  onSave,
  onCancel,
  autoFocus = true,
  performanceMode = 'balanced'
}) => {
  const [state, dispatch] = useReducer(mathEditorReducer, createInitialState(initialSrc));
  const [isEditing, setIsEditing] = useState(!initialSrc.trim());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse and render when src changes
  useEffect(() => {
    if (!state.src.trim()) {
      return;
    }

    const startTime = performance.now();
    
    try {
      const tokens = tokenize(state.src);
      const ast = parse(tokens);
      
      const parseTime = performance.now() - startTime;
      
      dispatch({ type: 'UPDATE_PERFORMANCE', payload: { parseTime, renderTime: 0 } });
      
    } catch (error) {
      console.error('MathEditor: Parse error:', error);
    }
  }, [state.src]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.selectionStart = inputRef.current.value.length;
          inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Update suggestions when input changes
  useEffect(() => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const currentToken = getCurrentToken(state.src, cursorPosition);
    
    if (currentToken && currentToken.token.length >= 1) {
      const suggestions = getSuggestions(currentToken.token);
      dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
      if (suggestions.length > 0) {
        dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: 0 });
      } else {
        dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: -1 });
      }
    } else {
      dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
      dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: -1 });
    }
  }, [state.src]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSrc = e.target.value;
    dispatch({ type: 'SET_SRC', payload: newSrc });
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (index: number) => {
    if (index < 0 || index >= state.suggestions.length) return;
    
    const suggestion = state.suggestions[index];
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const { newSrc, newCursorPosition } = applySuggestion(state.src, cursorPosition, suggestion);
    
    dispatch({ type: 'SET_SRC', payload: newSrc });
    dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
    dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: -1 });
    
    // Move cursor to end of inserted text
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestions navigation
    if (state.suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = (state.selectedSuggestion + 1) % state.suggestions.length;
        dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: newIndex });
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = state.selectedSuggestion <= 0 ? state.suggestions.length - 1 : state.selectedSuggestion - 1;
        dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: newIndex });
        return;
      } else if (e.key === 'Tab' && state.selectedSuggestion >= 0) {
        e.preventDefault();
        handleSelectSuggestion(state.selectedSuggestion);
        return;
      } else if (e.key === 'Escape') {
        if (state.suggestions.length > 0) {
          e.preventDefault();
          dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
          dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: -1 });
          return;
        }
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // If suggestions are open and one is selected, use it
      if (state.suggestions.length > 0 && state.selectedSuggestion >= 0) {
        handleSelectSuggestion(state.selectedSuggestion);
      } else if (state.src.trim()) {
        onSave(state.src);
        setIsEditing(false);
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.math-editor-container')) {
      if (state.src.trim()) {
        onSave(state.src);
      } else {
        onCancel();
      }
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (state.src.trim()) {
          onSave(state.src);
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.src, onSave, onCancel]);

  // Parse the current source for rendering
  const parsedAST = useMemo(() => {
    if (!state.src.trim()) return null;
    try {
      const tokens = tokenize(state.src);
      return parse(tokens);
    } catch (error) {
      console.error('MathEditor: Parse error:', error);
      return null;
    }
  }, [state.src]);

  if (!isEditing) {
    // Display mode
    return (
      <div className="math-editor-container" ref={containerRef}>
        <div
          onClick={() => setIsEditing(true)}
          style={{
            padding: '6px 10px',
            border: '2px solid var(--input-border)',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--foreground)',
            cursor: 'text',
            minWidth: '200px',
            display: 'inline-block'
          }}
        >
          {state.src || 'Type math expression...'}
        </div>
      </div>
    );
  }

  // Editing mode - show both input and preview
  return (
    <div className="math-editor-container" ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px 12px',
          border: '2px solid var(--input-border)',
          borderRadius: '6px',
          backgroundColor: 'var(--input-bg)',
          minWidth: '300px',
          maxWidth: '600px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        {/* Input field - VISIBLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--foreground-muted)', fontSize: '12px', fontWeight: 'bold' }}>
            Input:
          </span>
          <input
            ref={inputRef}
            type="text"
            value={state.src}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Try: alpha, frac(a,b), x^2, sqrt(x), 2x+3"
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
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        {/* Live preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '28px' }}>
          <span style={{ color: 'var(--foreground-muted)', fontSize: '12px', fontWeight: 'bold' }}>
            Preview:
          </span>
          <div style={{ 
            flex: 1, 
            padding: '4px 8px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            backgroundColor: 'var(--background)',
            minHeight: '28px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {state.src.trim() && parsedAST ? (
              <MathExpression 
                node={parsedAST} 
                theme="light"
              />
            ) : state.src.trim() ? (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>
                Error in: {state.src}
              </span>
            ) : (
              <span style={{ color: 'var(--foreground-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                Preview will appear here...
              </span>
            )}
          </div>
        </div>

        {/* Helper text */}
        <div style={{ 
          fontSize: '10px', 
          color: 'var(--foreground-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Press Enter to save, Esc to cancel • Tab for suggestions</span>
          {state.lastParseTime > 0 && (
            <span>⚡ {state.lastParseTime.toFixed(1)}ms</span>
          )}
        </div>

        {/* Suggestion Popup */}
        <SuggestionPopup
          suggestions={state.suggestions}
          selectedIndex={state.selectedSuggestion}
          onSelect={(suggestion) => handleSelectSuggestion(state.suggestions.indexOf(suggestion))}
          onClose={() => {
            dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
            dispatch({ type: 'SET_SELECTED_SUGGESTION', payload: -1 });
          }}
        />
      </div>
    </div>
  );
};

export default MathEditor;