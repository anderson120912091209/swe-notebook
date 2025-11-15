'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';
import 'mathlive';

const InlineMathRenderer: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inlineContent: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateInlineContent: (content: any) => void;
}> = (props) => {
  const [currentLatex, setCurrentLatex] = useState(props.inlineContent.props.latex || '');
  const [hasFocus, setHasFocus] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mathFieldRef = useRef<any>(null);

  useEffect(() => {
    setCurrentLatex(props.inlineContent.props.latex || '');
  }, [props.inlineContent.props.latex]);

  useEffect(() => {
    if (!currentLatex.trim()) {
      setTimeout(() => {
        mathFieldRef.current?.focus();
        mathFieldRef.current?.executeCommand('moveToMathfieldEnd');
      }, 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.sound = 'off';
      mathFieldRef.current.audioFeedback = 'off';
      mathFieldRef.current.plonkSound = 'off';
      mathFieldRef.current.keypressSound = 'off';
      mathFieldRef.current.defaultMode = 'math';
      if (mathFieldRef.current.playSound) {
        mathFieldRef.current.playSound = () => {};
      }
      if (typeof window !== 'undefined') {
        const mathLiveGlobal = (window as typeof window & { MathLive?: { sound: string; audioFeedback: string } }).MathLive;
        if (mathLiveGlobal) {
          mathLiveGlobal.sound = 'off';
          mathLiveGlobal.audioFeedback = 'off';
        }
      }
    }
  }, [hasFocus]);

  const updateInlineMath = (latex: string) => {
    setCurrentLatex(latex);
    props.updateInlineContent({
      type: 'inlineMath',
      props: { latex },
    });
  };

  const handleLatexChange = (newLatex: string) => {
    updateInlineMath(newLatex);
  };

  const focusBlockNoteEditor = (position: 'before' | 'after' = 'after') => {
    const bnEditor = document.querySelector('.bn-container [contenteditable="true"]') as HTMLElement | null;
    const mathElement = mathFieldRef.current as HTMLElement | null;
    if (!bnEditor || !mathElement) return;

    const wrapper = mathElement.parentElement;
    const range = document.createRange();
    const selection = window.getSelection();

    if (wrapper && wrapper.parentNode) {
      if (position === 'after') {
        range.setStartAfter(wrapper);
        range.setEndAfter(wrapper);
      } else {
        range.setStartBefore(wrapper);
        range.setEndBefore(wrapper);
      }
    } else {
      range.selectNodeContents(bnEditor);
      range.collapse(position === 'after');
    }

    selection?.removeAllRanges();
    selection?.addRange(range);
    bnEditor.focus();
  };

  const exitMathField = (direction: 'before' | 'after' = 'after') => {
    mathFieldRef.current?.blur();
    setHasFocus(false);
    focusBlockNoteEditor(direction);
  };

  const hasActiveSuggestions = () => {
    if (typeof document === 'undefined') return false;
    const elements = document.querySelectorAll('[class*="ML__suggestion"], [class*="ML__popover"], [class*="ML__autocomplete"]');
    return elements.length > 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Tab') {
      e.preventDefault();
      exitMathField('after');
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      updateInlineMath(props.inlineContent.props.latex || '');
      exitMathField('after');
      return;
    }

    if (e.key === 'Enter') {
      if (!hasActiveSuggestions()) {
        return;
      }
    }

    if (e.key === 'ArrowRight') {
      const mathField = mathFieldRef.current;
      if (mathField) {
        const selection = mathField.selection;
        const value = mathField.value || '';
        const selectionEnd = selection?.end ?? selection?.start ?? 0;
        const isAtEnd = selectionEnd >= value.length;
        if (isAtEnd && !hasActiveSuggestions()) {
          e.preventDefault();
          exitMathField('after');
        }
      }
    }

    if (e.key === 'ArrowLeft') {
      const mathField = mathFieldRef.current;
      if (mathField) {
        const selection = mathField.selection;
        const selectionStart = selection?.start ?? 0;
        if (selectionStart <= 0 && !hasActiveSuggestions()) {
          e.preventDefault();
          exitMathField('before');
        }
      }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.bn-container')) {
      setHasFocus(false);
    }
  };

  const handleFocus = () => {
    setHasFocus(true);
  };

  const showPlaceholder = !currentLatex.trim() && !hasFocus;

  return (
    <span
      contentEditable={false}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        marginInline: '1px',
      }}
      className="inline-math-wrapper"
    >
      {showPlaceholder && (
        <span
          style={{
            position: 'absolute',
            left: '8px',
            color: 'var(--muted-text, #6b7280)',
            fontSize: '0.85em',
            pointerEvents: 'none',
          }}
        >
          math
        </span>
      )}
      {/* @ts-expect-error - MathLive math-field web component */}
      <math-field
        ref={mathFieldRef}
        value={currentLatex}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput={(evt: any) => handleLatexChange(evt.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        style={{
          display: 'inline-block',
          fontSize: '0.9em',
          minWidth: '60px',
          padding: '2px 6px',
          border: 'none',
          borderRadius: '0',
          outline: 'none',
          backgroundColor: 'transparent',
        }}
        mathVirtualKeyboardPolicy="off"
        smartMode={true}
        smartFence={true}
        smartSuperscript={true}
        smartSubscript={true}
        smartFunction={true}
        smartSpace={true}
        defaultMode="math"
        virtualKeyboardMode="off"
        virtualKeyboards=""
        virtualKeyboardToggle="off"
        keypressVibration="off"
        keypressSound="off"
        plonkSound="off"
        sound="off"
        audioFeedback="off"
        audioFeedbackEnabled="false"
      />
      <span style={{ userSelect: 'none' }}>{'\u200B'}</span>
    </span>
  );
};

export const InlineMath = createReactInlineContentSpec(
  {
    type: 'inlineMath',
    propSchema: {
      latex: {
        default: '',
        values: undefined,
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      return <InlineMathRenderer {...props} />;
    },
  }
);

export default InlineMath;