// Integration tests for the math DSL system

import React from 'react';
import { render, screen } from '@testing-library/react';
import { tokenize } from '@/app/lib/math-dsl/lexer';
import { parse } from '@/app/lib/math-dsl/parser';
import { MathExpression } from '@/app/lib/math-dsl/renderer';

describe('Math DSL Integration', () => {
  test('renders simple expression', () => {
    const src = 'alpha + beta';
    const tokens = tokenize(src);
    const ast = parse(tokens);
    
    render(<MathExpression node={ast} theme="light" />);
    
    // Should render without errors
    expect(screen.getByText('α')).toBeInTheDocument();
    expect(screen.getByText('β')).toBeInTheDocument();
  });

  test('renders fraction', () => {
    const src = 'frac(a, b)';
    const tokens = tokenize(src);
    const ast = parse(tokens);
    
    render(<MathExpression node={ast} theme="light" />);
    
    // Should render fraction without errors
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  test('renders superscript', () => {
    const src = 'x^2';
    const tokens = tokenize(src);
    const ast = parse(tokens);
    
    render(<MathExpression node={ast} theme="light" />);
    
    // Should render superscript without errors
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders complex expression', () => {
    const src = 'alpha + frac(beta, gamma) * 2';
    const tokens = tokenize(src);
    const ast = parse(tokens);
    
    render(<MathExpression node={ast} theme="light" />);
    
    // Should render complex expression without errors
    expect(screen.getByText('α')).toBeInTheDocument();
    expect(screen.getByText('β')).toBeInTheDocument();
    expect(screen.getByText('γ')).toBeInTheDocument();
  });

  test('handles parse errors gracefully', () => {
    const src = 'invalid syntax !@#';
    const tokens = tokenize(src);
    const ast = parse(tokens);
    
    render(<MathExpression node={ast} theme="light" />);
    
    // Should render something even with invalid syntax
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });
});
