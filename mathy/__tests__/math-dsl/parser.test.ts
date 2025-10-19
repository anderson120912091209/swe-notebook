// Unit tests for the math DSL parser

import { tokenize } from '@/app/lib/math-dsl/lexer';
import { parse } from '@/app/lib/math-dsl/parser';
import { ASTNodeType } from '@/app/lib/math-dsl/types';

describe('Parser', () => {
  test('parses simple number', () => {
    const tokens = tokenize('123');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.NUMBER);
    expect(ast.value).toBe('123');
  });

  test('parses simple identifier', () => {
    const tokens = tokenize('x');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.value).toBe('x');
  });

  test('parses Greek letter', () => {
    const tokens = tokenize('alpha');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.GREEK);
    expect(ast.value).toBe('alpha');
  });

  test('parses binary operation', () => {
    const tokens = tokenize('a + b');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('+');
    expect(ast.left?.type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.right?.type).toBe(ASTNodeType.IDENTIFIER);
  });

  test('parses multiplication', () => {
    const tokens = tokenize('a * b');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('*');
  });

  test('handles operator precedence', () => {
    const tokens = tokenize('a + b * c');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('+');
    expect(ast.left?.type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.right?.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.right?.operator).toBe('*');
  });

  test('parses superscript', () => {
    const tokens = tokenize('x^2');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.SUPERSCRIPT);
    expect(ast.base?.type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.exponent?.type).toBe(ASTNodeType.NUMBER);
  });

  test('parses subscript', () => {
    const tokens = tokenize('x_1');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.SUBSCRIPT);
    expect(ast.base?.type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.subscript?.type).toBe(ASTNodeType.NUMBER);
  });

  test('parses grouped expression', () => {
    const tokens = tokenize('(a + b)');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.GROUP);
    expect(ast.expression?.type).toBe(ASTNodeType.BINARY_OP);
  });

  test('parses function call', () => {
    const tokens = tokenize('sqrt(x)');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.FUNCTION);
    expect(ast.name).toBe('sqrt');
    expect(ast.args).toHaveLength(1);
    expect(ast.args?.[0].type).toBe(ASTNodeType.IDENTIFIER);
  });

  test('parses function call with whitespace', () => {
    const tokens = tokenize('sqrt( x )');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.FUNCTION);
    expect(ast.name).toBe('sqrt');
    expect(ast.args).toHaveLength(1);
    expect(ast.args?.[0].type).toBe(ASTNodeType.IDENTIFIER);
  });

  test('parses function with multiple arguments', () => {
    const tokens = tokenize('frac(a, b)');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.FUNCTION);
    expect(ast.name).toBe('frac');
    expect(ast.args).toHaveLength(2);
    expect(ast.args?.[0].type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.args?.[1].type).toBe(ASTNodeType.IDENTIFIER);
  });

  test('parses complex expression', () => {
    const tokens = tokenize('alpha + beta * 2');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('+');
    expect(ast.left?.type).toBe(ASTNodeType.GREEK);
    expect(ast.right?.type).toBe(ASTNodeType.BINARY_OP);
  });

  test('handles empty expression gracefully', () => {
    const tokens = tokenize('');
    const ast = parse(tokens);
    // Should return some kind of placeholder or error node
    expect(ast).toBeDefined();
  });

  test('parses nested superscripts', () => {
    const tokens = tokenize('x^2^3');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.SUPERSCRIPT);
    expect(ast.base?.type).toBe(ASTNodeType.IDENTIFIER);
    expect(ast.exponent?.type).toBe(ASTNodeType.SUPERSCRIPT);
  });

  test('parses function with complex arguments', () => {
    const tokens = tokenize('sqrt(a + b)');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.FUNCTION);
    expect(ast.name).toBe('sqrt');
    expect(ast.args).toHaveLength(1);
    expect(ast.args?.[0].type).toBe(ASTNodeType.BINARY_OP);
  });

  test('parses implicit multiplication', () => {
    const tokens = tokenize('2x');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('*');
    expect(ast.left?.type).toBe(ASTNodeType.NUMBER);
    expect(ast.right?.type).toBe(ASTNodeType.IDENTIFIER);
  });

  test('parses Greek letter multiplication', () => {
    const tokens = tokenize('alpha beta');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('*');
    expect(ast.left?.type).toBe(ASTNodeType.GREEK);
    expect(ast.right?.type).toBe(ASTNodeType.GREEK);
  });

  test('parses complex expression with implicit multiplication', () => {
    const tokens = tokenize('alpha + 2beta * gamma');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.BINARY_OP);
    expect(ast.operator).toBe('+');
    expect(ast.left?.type).toBe(ASTNodeType.GREEK);
    expect(ast.right?.type).toBe(ASTNodeType.BINARY_OP);
  });

  test('parses fraction with Greek letters', () => {
    const tokens = tokenize('frac(alpha, beta)');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.FUNCTION);
    expect(ast.name).toBe('frac');
    expect(ast.args).toHaveLength(2);
    expect(ast.args?.[0].type).toBe(ASTNodeType.GREEK);
    expect(ast.args?.[1].type).toBe(ASTNodeType.GREEK);
  });

  test('parses nested functions', () => {
    const tokens = tokenize('sqrt(frac(a, b))');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.FUNCTION);
    expect(ast.name).toBe('sqrt');
    expect(ast.args).toHaveLength(1);
    expect(ast.args?.[0].type).toBe(ASTNodeType.FUNCTION);
    expect(ast.args?.[0].name).toBe('frac');
  });

  test('parses superscript with Greek letters', () => {
    const tokens = tokenize('alpha^2');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.SUPERSCRIPT);
    expect(ast.base?.type).toBe(ASTNodeType.GREEK);
    expect(ast.exponent?.type).toBe(ASTNodeType.NUMBER);
  });

  test('parses subscript with Greek letters', () => {
    const tokens = tokenize('alpha_beta');
    const ast = parse(tokens);
    expect(ast.type).toBe(ASTNodeType.SUBSCRIPT);
    expect(ast.base?.type).toBe(ASTNodeType.GREEK);
    expect(ast.subscript?.type).toBe(ASTNodeType.GREEK);
  });
});
