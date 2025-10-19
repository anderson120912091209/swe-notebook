// Unit tests for the math DSL preprocessor

import { preprocessToLatex, needsPreprocessing } from '@/app/lib/math-dsl/preprocessor';

describe('Preprocessor', () => {
  test('converts Greek letters without backslash', () => {
    expect(preprocessToLatex('alpha')).toBe('\\alpha');
    expect(preprocessToLatex('beta')).toBe('\\beta');
    expect(preprocessToLatex('gamma')).toBe('\\gamma');
    expect(preprocessToLatex('pi')).toBe('\\pi');
  });

  test('converts fractions', () => {
    expect(preprocessToLatex('x/y')).toBe('\\frac{x}{y}');
    expect(preprocessToLatex('a/b')).toBe('\\frac{a}{b}');
    expect(preprocessToLatex('1/2')).toBe('\\frac{1}{2}');
  });

  test('handles complex expressions', () => {
    expect(preprocessToLatex('alpha + beta')).toBe('\\alpha + \\beta');
    expect(preprocessToLatex('x/y + z')).toBe('\\frac{x}{y} + z');
    expect(preprocessToLatex('alpha/beta')).toBe('\\frac{\\alpha}{\\beta}');
  });

  test('preserves existing LaTeX', () => {
    expect(preprocessToLatex('\\alpha')).toBe('\\alpha');
    expect(preprocessToLatex('\\frac{x}{y}')).toBe('\\frac{x}{y}');
    expect(preprocessToLatex('x^2')).toBe('x^2');
  });

  test('handles mixed syntax', () => {
    expect(preprocessToLatex('alpha + \\beta')).toBe('\\alpha + \\beta');
    expect(preprocessToLatex('x/y + \\frac{a}{b}')).toBe('\\frac{x}{y} + \\frac{a}{b}');
  });

  test('detects when preprocessing is needed', () => {
    expect(needsPreprocessing('alpha')).toBe(true);
    expect(needsPreprocessing('x/y')).toBe(true);
    expect(needsPreprocessing('alpha + x/y')).toBe(true);
    expect(needsPreprocessing('\\alpha')).toBe(false);
    expect(needsPreprocessing('x^2')).toBe(false);
    expect(needsPreprocessing('x + y')).toBe(false);
  });

  test('handles edge cases', () => {
    expect(preprocessToLatex('')).toBe('');
    expect(preprocessToLatex('x')).toBe('x');
    expect(preprocessToLatex('alpha/beta/gamma')).toBe('\\alpha/\\beta/\\gamma'); // Multiple slashes
  });

  test('converts complex fractions with parentheses', () => {
    expect(preprocessToLatex('f(x)=x/(sqrt(x))')).toBe('f(x)=\\frac{x}{\\sqrt{x}}');
  });

  test('converts nested fractions', () => {
    expect(preprocessToLatex('(a+b)/(c+d)')).toBe('\\frac{a+b}{c+d}');
  });

  test('converts fractions with functions', () => {
    expect(preprocessToLatex('sin(x)/cos(x)')).toBe('\\frac{\\sin{x}}{\\cos{x}}');
  });

  test('converts fractions with Greek letters', () => {
    expect(preprocessToLatex('alpha/beta')).toBe('\\frac{\\alpha}{\\beta}');
  });

  test('converts complex nested expressions', () => {
    expect(preprocessToLatex('(x^2 + 1)/(sqrt(x^2 + 1))')).toBe('\\frac{x^2 + 1}{\\sqrt{x^2 + 1}}');
  });

  test('handles multiple fractions in one expression', () => {
    expect(preprocessToLatex('a/b + c/d')).toBe('\\frac{a}{b} + \\frac{c}{d}');
  });

  test('does not convert already LaTeX fractions', () => {
    expect(preprocessToLatex('\\frac{a}{b}')).toBe('\\frac{a}{b}');
  });

  test('converts fractions with function calls', () => {
    expect(preprocessToLatex('f(x) = x/sum(x)')).toBe('f(x) = \\frac{x}{\\sum{x}}');
  });

  test('converts fractions with complex function calls', () => {
    expect(preprocessToLatex('y = alpha/sqrt(beta)')).toBe('y = \\frac{\\alpha}{\\sqrt{beta}}');
  });
});
