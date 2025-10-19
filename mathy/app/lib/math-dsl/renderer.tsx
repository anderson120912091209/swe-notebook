// Renderer for the custom DSL math input system

import React from 'react';
import { ASTNode, ASTNodeType } from './types';
import { getGreekSymbol } from './utils';

interface MathExpressionProps {
  node: ASTNode;
  theme?: 'light' | 'dark';
}

/**
 * Main renderer component for AST nodes
 */
export const MathExpression: React.FC<MathExpressionProps> = React.memo(({ node, theme = 'light' }) => {
  return (
    <span 
      data-ast-node-id={node.id}
      style={{ display: 'inline-block' }}
    >
      {renderNode(node, theme)}
    </span>
  );
});

/**
 * Render a single AST node
 */
function renderNode(node: ASTNode, theme: 'light' | 'dark'): React.ReactNode {
  switch (node.type) {
    case ASTNodeType.NUMBER:
      return (
        <span data-token-index="number" style={{ fontFamily: 'monospace' }}>
          {node.value}
        </span>
      );

    case ASTNodeType.IDENTIFIER:
      return (
        <span data-token-index="identifier" style={{ fontStyle: 'italic' }}>
          {node.value}
        </span>
      );

    case ASTNodeType.GREEK:
      return (
        <span data-token-index="greek" style={{ fontStyle: 'italic', fontFamily: 'serif' }}>
          {getGreekSymbol(node.value || '')}
        </span>
      );

    case ASTNodeType.BINARY_OP:
      if (!node.left || !node.right) return null;
      return (
        <span data-token-index="binary-op">
          {renderNode(node.left, theme)}
          <span style={{ margin: '0 2px' }}>{node.operator}</span>
          {renderNode(node.right, theme)}
        </span>
      );

    case ASTNodeType.FUNCTION:
      return renderFunction(node, theme);

    case ASTNodeType.SUPERSCRIPT:
      if (!node.base || !node.exponent) return null;
      return (
        <span data-token-index="superscript">
          {renderNode(node.base, theme)}
          <sup style={{ fontSize: '0.7em' }}>
            {renderNode(node.exponent, theme)}
          </sup>
        </span>
      );

    case ASTNodeType.SUBSCRIPT:
      if (!node.base || !node.subscript) return null;
      return (
        <span data-token-index="subscript">
          {renderNode(node.base, theme)}
          <sub style={{ fontSize: '0.7em' }}>
            {renderNode(node.subscript, theme)}
          </sub>
        </span>
      );

    case ASTNodeType.GROUP:
      if (!node.expression) return null;
      return (
        <span data-token-index="group" style={{ margin: '0 1px' }}>
          ({renderNode(node.expression, theme)})
        </span>
      );

    default:
      return <span>?</span>;
  }
}

/**
 * Render a function node
 */
function renderFunction(node: ASTNode, theme: 'light' | 'dark'): React.ReactNode {
  const { name, args } = node;
  
  if (!name) return <span>?</span>;

  // Special rendering for common functions
  switch (name.toLowerCase()) {
    case 'sqrt':
      if (args && args.length === 1) {
        return (
          <span data-token-index="function">
            √<span style={{ borderTop: '1px solid currentColor' }}>
              {renderNode(args[0], theme)}
            </span>
          </span>
        );
      }
      break;

    case 'frac':
      if (args && args.length === 2) {
        return (
          <span data-token-index="function" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}>
            <div style={{ textAlign: 'center', lineHeight: 1, fontSize: '0.9em' }}>
              <div style={{ borderBottom: '1px solid currentColor', paddingBottom: '1px', marginBottom: '1px' }}>
                {renderNode(args[0], theme)}
              </div>
              <div style={{ fontSize: '0.8em' }}>
                {renderNode(args[1], theme)}
              </div>
            </div>
          </span>
        );
      }
      break;

    case 'sin':
    case 'cos':
    case 'tan':
    case 'log':
    case 'ln':
      if (args && args.length === 1) {
        return (
          <span data-token-index="function">
            {name}({renderNode(args[0], theme)})
          </span>
        );
      }
      break;

    default:
      // Generic function rendering
      if (args && args.length > 0) {
        return (
          <span data-token-index="function">
            {name}({args.map((arg, i) => (
              <React.Fragment key={i}>
                {renderNode(arg, theme)}
                {i < args.length - 1 && ', '}
              </React.Fragment>
            ))})
          </span>
        );
      } else {
        return (
          <span data-token-index="function">
            {name}()
          </span>
        );
      }
  }

  // Fallback
  return (
    <span data-token-index="function">
      {name}({args?.map((arg, i) => (
        <React.Fragment key={i}>
          {renderNode(arg, theme)}
          {i < args.length - 1 && ', '}
        </React.Fragment>
      ))})
    </span>
  );
}

/**
 * Render AST to HTML string (for copy/paste)
 */
export function renderToHTML(ast: ASTNode, theme: 'light' | 'dark' = 'light'): string {
  // This is a simplified version - in a real implementation,
  // you'd want to use a proper HTML serializer
  return `<span class="math-expression">${ast.value || 'expression'}</span>`;
}

export default MathExpression;
