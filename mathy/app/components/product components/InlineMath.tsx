'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';
import 'mathlive';


// MathLive-based inline math content component
const InlineMathContent: React.FC<{
  latex: string;
  onEdit: () => void;
}> = ({ latex, onEdit }) => {
  return (
    <span 
      className="inline-math-content"
      onClick={onEdit}
      style={{
        cursor: 'pointer',
        display: 'inline-block',
        verticalAlign: 'middle',
        fontSize: '0.9em',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {/* @ts-expect-error - MathLive math-field web component */}
      <math-field
        value={latex}
        readOnly
        style={{
          display: 'inline-block',
          fontSize: 'inherit',
          minWidth: '20px',
          minHeight: '1.2em',
        }}
        mathVirtualKeyboardPolicy="off"
        virtualKeyboardMode="off"
        virtualKeyboards=""
        keypressVibration="off"
        keypressSound="off"
        plonkSound="off"
      />
    </span>
  );
};

// Separate component to handle hooks
const InlineMathRenderer: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inlineContent: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateInlineContent: (content: any) => void;
}> = (props) => {
  const [isEditing, setIsEditing] = useState(!props.inlineContent.props.latex);
  const [currentLatex, setCurrentLatex] = useState(props.inlineContent.props.latex || '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mathFieldRef = useRef<any>(null);

  // Sync with props when they change
  useEffect(() => {
    setCurrentLatex(props.inlineContent.props.latex || '');
  }, [props.inlineContent.props.latex]);

  // Completely disable MathLive audio feedback and set text mode
  useEffect(() => {
    if (mathFieldRef.current) {
      // Disable all audio feedback
      mathFieldRef.current.sound = 'off';
      mathFieldRef.current.audioFeedback = 'off';
      mathFieldRef.current.plonkSound = 'off';
      mathFieldRef.current.keypressSound = 'off';
      
      // Set to text mode for regular typing
      mathFieldRef.current.defaultMode = 'math';
      
      // Override MathLive's audio functions
      if (mathFieldRef.current.playSound) {
        mathFieldRef.current.playSound = () => {}; // No-op function
      }
      
      // Disable audio feedback at the global level
      if (window.MathLive) {
        window.MathLive.sound = 'off';
        window.MathLive.audioFeedback = 'off';
      }
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    // Auto-focus the math field immediately and position cursor at end
    setTimeout(() => {
      if (mathFieldRef.current) {
        mathFieldRef.current.focus();
        // Ensure cursor is positioned at the end of the content
        mathFieldRef.current.executeCommand('moveToMathfieldEnd');
      }
    }, 10);
  };

  const handleSave = (newLatex: string) => {
    if (newLatex.trim()) {
      setCurrentLatex(newLatex);
      props.updateInlineContent({
        type: 'inlineMath',
        props: { latex: newLatex },
      });
      setIsEditing(false);
      
      // Enhanced focus management - try multiple methods
      setTimeout(() => {
        // Method 1: Try to find the BlockNote editor
        const bnEditor = document.querySelector('.bn-container [contenteditable="true"]') as HTMLElement;
        if (bnEditor) {
          bnEditor.focus();
          // Ensure the editor is actually focused and ready for input
          bnEditor.click();
          return;
        }
        
        // Method 2: Try to find any contenteditable element
        const editableElement = document.querySelector('[contenteditable="true"]') as HTMLElement;
        if (editableElement) {
          editableElement.focus();
          editableElement.click();
          return;
        }
        
        // Method 3: Try to find the parent container and focus it
        const parentContainer = document.querySelector('.bn-container') as HTMLElement;
        if (parentContainer) {
          parentContainer.focus();
          parentContainer.click();
        }
      }, 100); // Increased delay to ensure DOM updates
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

  const handleLatexChange = (newLatex: string) => {
    setCurrentLatex(newLatex);
  };

  // Function to switch MathLive mode dynamically
  const switchMathLiveMode = (mode: 'math' | 'text' | 'latex') => {
    if (mathFieldRef.current) {
      mathFieldRef.current.defaultMode = mode;
      // You can also use executeCommand to switch modes
      mathFieldRef.current.executeCommand(`switchTo${mode.charAt(0).toUpperCase() + mode.slice(1)}Mode`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation to prevent BlockNote from handling these keys
    e.stopPropagation();
    
    // Debug: Log all key presses to see what's happening
    console.log("Key pressed:", e.key, "Code:", e.code, "Type:", e.type);
    
    if (e.key === 'Enter') {
      // Comprehensive detection of MathLive suggestion popup
      const mathField = mathFieldRef.current;
      
      // Method 1: Check for any MathLive suggestion elements anywhere
      const allMathLiveElements = document.querySelectorAll('[class*="ML__"]');
      const suggestionElements = Array.from(allMathLiveElements).filter(el => {
        const className = el.className.toLowerCase();
        return className.includes('suggestion') || className.includes('popover') || className.includes('autocomplete');
      });
      
      // Method 2: Check for visible popups that might be MathLive suggestions
      const allPopups = document.querySelectorAll('[style*="position: absolute"], [style*="position: fixed"], [class*="popup"], [class*="dropdown"]');
      const visiblePopups = Array.from(allPopups).filter(popup => {
        const style = window.getComputedStyle(popup);
        return style.display !== 'none' && style.visibility !== 'hidden' && popup.offsetHeight > 0;
      });
      
      // Method 3: Check MathLive's internal state
      const mathLiveState = mathField ? {
        suggestionPanel: (mathField as any).suggestionPanel,
        isEditing: (mathField as any).isEditing,
        hasFocus: (mathField as any).hasFocus,
        selection: (mathField as any).selection
      } : null;
      
      // Method 4: Check if there are any elements with MathLive-specific classes
      const mathLiveClasses = document.querySelectorAll('[class*="ML__suggestion"], [class*="ML__popover"], [class*="ML__autocomplete"]');
      
      const hasActiveSuggestions = suggestionElements.length > 0 || 
                                 visiblePopups.length > 0 || 
                                 mathLiveClasses.length > 0 ||
                                 (mathLiveState?.suggestionPanel && mathLiveState.suggestionPanel.visible);
      
      console.log("Debug info:", {
        allMathLiveElements: allMathLiveElements.length,
        suggestionElements: suggestionElements.length,
        allPopups: allPopups.length,
        visiblePopups: visiblePopups.length,
        mathLiveClasses: mathLiveClasses.length,
        mathLiveState,
        hasActiveSuggestions,
        mathField: mathField
      });
      
      if (hasActiveSuggestions) {
        console.log("Active MathLive Suggestion is detected")
        // Let MathLive handle Enter for suggestion selection
        // Don't prevent default or stop propagation
        return;
      } else {
        // No active suggestions, so Enter should exit the math field
        e.preventDefault();
        handleSave(currentLatex);
        console.log("No MathLive suggestions detected - exiting math field")
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave(currentLatex);
      
      // Additional focus management for Tab key
      setTimeout(() => {
        const bnEditor = document.querySelector('.bn-container [contenteditable="true"]') as HTMLElement;
        if (bnEditor) {
          bnEditor.focus();
          bnEditor.click();
          // Position cursor at the end of the content
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(bnEditor);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 150);
    } else if (e.key === 'ArrowRight') {
      // Check if cursor is at the end of the math field
      const mathField = mathFieldRef.current;
      if (mathField) {
        // Get current cursor position without moving it
        const value = mathField.value;
        const selection = mathField.selection;
        
        // Only check if we're at the end using selection position
        const selectionEnd = selection?.end || selection?.start || 0;
        const isAtEnd = selectionEnd >= value.length - 1;
        
        console.log("Right arrow debug:", {
          valueLength: value.length,
          selectionEnd,
          isAtEnd,
          value: value.substring(0, 50) + "..."
        });
        
        if (isAtEnd) {
          e.preventDefault();
          handleSave(currentLatex);
          console.log("Right arrow at end - exiting math field");
        }
        // Otherwise, let MathLive handle the arrow key normally
      }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only save if not clicking back into the editor
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.bn-container')) {
      handleSave(currentLatex);
    }
  };

  if (isEditing) {
    return (
      <span 
        contentEditable={false}
        style={{ display: 'inline-block', position: 'relative' }}
      >
        {/* @ts-expect-error - MathLive math-field web component */}
            <math-field
              ref={mathFieldRef}
              value={currentLatex}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onInput={(evt: any) => handleLatexChange(evt.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              style={{
                display: 'inline-block',
                fontSize: '0.9em',
                minWidth: '50px',
                padding: '2px 6px',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '3px',
                outline: 'none',
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
      </span>
    );
  }

  if (!currentLatex.trim()) {
    return (
      <span 
        className="inline-math-placeholder"
        onClick={handleEdit}
        style={{
          padding: '2px 6px',
          borderRadius: '3px',
          color: 'var(--muted-text, #6b7280)',
          cursor: 'pointer',
          fontSize: '0.85em',
          border: '1px dashed var(--border-color, #e5e7eb)',
          display: 'inline-block',
          margin: '0 2px',
          verticalAlign: 'middle',
        }}
      >
        math
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
};

// Create the custom inline math content spec
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
      return <InlineMathRenderer {...props} />;
    },
  }
);

export default InlineMath;