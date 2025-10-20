'use client';

import React from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';

type MathSymbolProps = {
  token: string; // source key, e.g., "alpha"
  unicode: string; // rendered glyph, e.g., "α"
  latex?: string; // optional LaTeX backing if needed later
};

// Simple renderer: render unicode directly; inherit line-height; no border
const MathSymbolContent: React.FC<MathSymbolProps> = ({ unicode }) => {
  return (
    <span
      data-math-symbol
      style={{
        display: 'inline',
        padding: '0 1px',
        lineHeight: 'inherit',
        verticalAlign: 'baseline',
        cursor: 'text',
      }}
    >
      {unicode}
    </span>
  );
};

export const InlineMathSymbol = createReactInlineContentSpec(
  {
    type: 'mathSymbol',
    propSchema: {
      token: { default: '' },
      unicode: { default: '' },
      latex: { default: undefined },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const p = props.inlineContent.props as unknown as MathSymbolProps;
      return <MathSymbolContent token={p.token} unicode={p.unicode} latex={p.latex} />;
    },
  }
);

export default InlineMathSymbol;


