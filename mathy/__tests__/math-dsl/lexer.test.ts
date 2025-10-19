// Unit tests for the math DSL lexer

import { tokenize } from '@/app/lib/math-dsl/lexer';
import { TokenType } from '@/app/lib/math-dsl/types';

describe('Lexer', () => {
  test('tokenizes simple identifier', () => {
    const tokens = tokenize('alpha');
    expect(tokens).toEqual([
      { type: TokenType.GREEK, value: 'alpha', start: 0, end: 5 },
      { type: TokenType.EOF, value: '', start: 5, end: 5 }
    ]);
  });

  test('tokenizes number', () => {
    const tokens = tokenize('123');
    expect(tokens).toEqual([
      { type: TokenType.NUMBER, value: '123', start: 0, end: 3 },
      { type: TokenType.EOF, value: '', start: 3, end: 3 }
    ]);
  });

  test('tokenizes decimal number', () => {
    const tokens = tokenize('3.14');
    expect(tokens).toEqual([
      { type: TokenType.NUMBER, value: '3.14', start: 0, end: 4 },
      { type: TokenType.EOF, value: '', start: 4, end: 4 }
    ]);
  });

  test('tokenizes operators', () => {
    const tokens = tokenize('+ - * /');
    expect(tokens).toEqual([
      { type: TokenType.OPERATOR, value: '+', start: 0, end: 1 },
      { type: TokenType.WHITESPACE, value: ' ', start: 1, end: 2 },
      { type: TokenType.OPERATOR, value: '-', start: 2, end: 3 },
      { type: TokenType.WHITESPACE, value: ' ', start: 3, end: 4 },
      { type: TokenType.OPERATOR, value: '*', start: 4, end: 5 },
      { type: TokenType.WHITESPACE, value: ' ', start: 5, end: 6 },
      { type: TokenType.OPERATOR, value: '/', start: 6, end: 7 },
      { type: TokenType.EOF, value: '', start: 7, end: 7 }
    ]);
  });

  test('tokenizes parentheses', () => {
    const tokens = tokenize('(a + b)');
    expect(tokens).toEqual([
      { type: TokenType.LPAREN, value: '(', start: 0, end: 1 },
      { type: TokenType.IDENTIFIER, value: 'a', start: 1, end: 2 },
      { type: TokenType.WHITESPACE, value: ' ', start: 2, end: 3 },
      { type: TokenType.OPERATOR, value: '+', start: 3, end: 4 },
      { type: TokenType.WHITESPACE, value: ' ', start: 4, end: 5 },
      { type: TokenType.IDENTIFIER, value: 'b', start: 5, end: 6 },
      { type: TokenType.RPAREN, value: ')', start: 6, end: 7 },
      { type: TokenType.EOF, value: '', start: 7, end: 7 }
    ]);
  });

  test('tokenizes superscript and subscript', () => {
    const tokens = tokenize('x^2_y');
    expect(tokens).toEqual([
      { type: TokenType.IDENTIFIER, value: 'x', start: 0, end: 1 },
      { type: TokenType.CARET, value: '^', start: 1, end: 2 },
      { type: TokenType.NUMBER, value: '2', start: 2, end: 3 },
      { type: TokenType.UNDERSCORE, value: '_', start: 3, end: 4 },
      { type: TokenType.IDENTIFIER, value: 'y', start: 4, end: 5 },
      { type: TokenType.EOF, value: '', start: 5, end: 5 }
    ]);
  });

  test('tokenizes function', () => {
    const tokens = tokenize('sqrt');
    expect(tokens).toEqual([
      { type: TokenType.FUNCTION, value: 'sqrt', start: 0, end: 4 },
      { type: TokenType.EOF, value: '', start: 4, end: 4 }
    ]);
  });

  test('tokenizes complex expression', () => {
    const tokens = tokenize('alpha + beta * 2');
    expect(tokens).toEqual([
      { type: TokenType.GREEK, value: 'alpha', start: 0, end: 5 },
      { type: TokenType.WHITESPACE, value: ' ', start: 5, end: 6 },
      { type: TokenType.OPERATOR, value: '+', start: 6, end: 7 },
      { type: TokenType.WHITESPACE, value: ' ', start: 7, end: 8 },
      { type: TokenType.GREEK, value: 'beta', start: 8, end: 12 },
      { type: TokenType.WHITESPACE, value: ' ', start: 12, end: 13 },
      { type: TokenType.OPERATOR, value: '*', start: 13, end: 14 },
      { type: TokenType.WHITESPACE, value: ' ', start: 14, end: 15 },
      { type: TokenType.NUMBER, value: '2', start: 15, end: 16 },
      { type: TokenType.EOF, value: '', start: 16, end: 16 }
    ]);
  });

  test('handles empty string', () => {
    const tokens = tokenize('');
    expect(tokens).toEqual([
      { type: TokenType.EOF, value: '', start: 0, end: 0 }
    ]);
  });

  test('handles whitespace only', () => {
    const tokens = tokenize('   ');
    expect(tokens).toEqual([
      { type: TokenType.WHITESPACE, value: '   ', start: 0, end: 3 },
      { type: TokenType.EOF, value: '', start: 3, end: 3 }
    ]);
  });

  test('adds implicit multiplication between number and identifier', () => {
    const tokens = tokenize('2x');
    expect(tokens).toEqual([
      { type: TokenType.NUMBER, value: '2', start: 0, end: 1 },
      { type: TokenType.OPERATOR, value: '*', start: 1, end: 1 },
      { type: TokenType.IDENTIFIER, value: 'x', start: 1, end: 2 },
      { type: TokenType.EOF, value: '', start: 2, end: 2 }
    ]);
  });

  test('adds implicit multiplication between Greek letters', () => {
    const tokens = tokenize('alpha beta');
    expect(tokens).toEqual([
      { type: TokenType.GREEK, value: 'alpha', start: 0, end: 5 },
      { type: TokenType.WHITESPACE, value: ' ', start: 5, end: 6 },
      { type: TokenType.GREEK, value: 'beta', start: 6, end: 10 },
      { type: TokenType.EOF, value: '', start: 10, end: 10 }
    ]);
  });

  test('adds implicit multiplication between identifier and function', () => {
    const tokens = tokenize('x sqrt');
    expect(tokens).toEqual([
      { type: TokenType.IDENTIFIER, value: 'x', start: 0, end: 1 },
      { type: TokenType.WHITESPACE, value: ' ', start: 1, end: 2 },
      { type: TokenType.FUNCTION, value: 'sqrt', start: 2, end: 6 },
      { type: TokenType.EOF, value: '', start: 6, end: 6 }
    ]);
  });

  test('adds implicit multiplication after closing parenthesis', () => {
    const tokens = tokenize('(a + b) x');
    expect(tokens).toEqual([
      { type: TokenType.LPAREN, value: '(', start: 0, end: 1 },
      { type: TokenType.IDENTIFIER, value: 'a', start: 1, end: 2 },
      { type: TokenType.WHITESPACE, value: ' ', start: 2, end: 3 },
      { type: TokenType.OPERATOR, value: '+', start: 3, end: 4 },
      { type: TokenType.WHITESPACE, value: ' ', start: 4, end: 5 },
      { type: TokenType.IDENTIFIER, value: 'b', start: 5, end: 6 },
      { type: TokenType.RPAREN, value: ')', start: 6, end: 7 },
      { type: TokenType.WHITESPACE, value: ' ', start: 7, end: 8 },
      { type: TokenType.IDENTIFIER, value: 'x', start: 8, end: 9 },
      { type: TokenType.EOF, value: '', start: 9, end: 9 }
    ]);
  });
});
