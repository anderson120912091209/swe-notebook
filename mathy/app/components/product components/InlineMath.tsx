'use client';

import React, { useState, useEffect } from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';
import MathLiveInput from '@/app/components/product components/MathLiveInput';
import MathLiveDisplay from '@/app/components/product components/MathLiveDisplay';

const InlineMathRenderer: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inlineContent: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateInlineContent: (content: any) => void;
}> = (props) => {
  const [latex, setLatex] = useState(props.inlineContent.props.latex || '');
  const [isEditing, setIsEditing] = useState(false);

  // Sync local state with props
  useEffect(() => {
    const currentLatex = props.inlineContent.props.latex || '';
    setLatex(currentLatex);
  }, [props.inlineContent.props.latex]);

  // Auto-open editor if empty (newly inserted)
  useEffect(() => {
    if (!props.inlineContent.props.latex || props.inlineContent.props.latex === ' ') {
      setIsEditing(true);
    }
  }, [props.inlineContent.props.latex]);

  const handleSave = () => {
    console.log('[InlineMath] handleSave called, latex state:', latex);
    const trimmed = latex.trim();

    // Don't save if empty - this would cause the content to disappear
    if (!trimmed) {
      console.warn('[InlineMath] Attempted to save empty content, canceling instead');
      handleCancel();
      return;
    }

    console.log('[InlineMath] Saving to BlockNote:', trimmed);
    props.updateInlineContent({
      type: 'inlineMath',
      props: { latex: trimmed },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    console.log('[InlineMath] handleCancel called');
    // Revert to original value
    setLatex(props.inlineContent.props.latex || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <span className="inline-math-editing" style={{ padding: '0 2px' }}>
        <MathLiveInput
          value={latex}
          onChange={setLatex}
          onFinish={handleSave}
          onCancel={handleCancel}
          autoFocus={true}
        />
      </span>
    );
  }

  return (
    <span
      className="inline-math-wrapper"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 4px',
        borderRadius: '4px',
        cursor: 'pointer',
        border: '1px solid transparent',
        minWidth: '20px',
        minHeight: '24px',
        verticalAlign: 'middle'
      }}
      onClick={() => setIsEditing(true)}
    >
      {latex.trim() ? (
        <MathLiveDisplay value={latex} />
      ) : (
        <span style={{ color: 'var(--mantine-color-gray-5)', fontSize: '0.9em', fontFamily: 'monospace' }}>
          math
        </span>
      )}
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