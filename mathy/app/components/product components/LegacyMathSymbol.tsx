'use client';

import { createReactInlineContentSpec } from '@blocknote/react';

// Backward compatibility: Convert old mathSymbol to inlineMath format
export const LegacyMathSymbol = createReactInlineContentSpec(
  {
    type: 'mathSymbol',
    propSchema: {
      symbol: {
        default: '',
        values: undefined,
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      // Convert mathSymbol to inlineMath format
      const symbol = props.inlineContent.props.symbol || '';
      return (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '3px',
            backgroundColor: 'var(--math-bg)',
            display: 'inline-block',
            margin: '0 2px',
            verticalAlign: 'middle',
            fontSize: '0.85em',
            border: '1px solid transparent',
          }}
        >
          {symbol}
        </span>
      );
    },
  }
);
