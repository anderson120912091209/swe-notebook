// Lexer for the custom DSL math input system

import { Token, TokenType } from './types';
import { isDigit, isLetter, isWhitespace, isOperator, isGreekLetter, isFunctionKeyword } from './utils';

export class Lexer {
  private src: string = '';
  private pos: number = 0;

  /**
   * Tokenize a source string into tokens
   */
  tokenize(src: string): Token[] {
    this.src = src;
    this.pos = 0;
    const tokens: Token[] = [];

    while (this.pos < this.src.length) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    // Add EOF token
    tokens.push({
      type: TokenType.EOF,
      value: '',
      start: this.src.length,
      end: this.src.length
    });

    // Post-process to add implicit multiplication tokens
    return this.addImplicitMultiplication(tokens);
  }

  /**
   * Add implicit multiplication tokens where needed
   */
  private addImplicitMultiplication(tokens: Token[]): Token[] {
    const result: Token[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];
      
      result.push(current);
      
      // Add implicit multiplication between:
      // - Number and identifier/Greek/function
      // - Identifier/Greek and identifier/Greek/function
      // - ) and identifier/Greek/function/number
      if (next && next.type !== TokenType.EOF && this.needsImplicitMultiplication(current, next)) {
        result.push({
          type: TokenType.OPERATOR,
          value: '*',
          start: current.end,
          end: current.end
        });
      }
    }
    
    return result;
  }

  /**
   * Check if two tokens need implicit multiplication between them
   */
  private needsImplicitMultiplication(current: Token, next: Token): boolean {
    // Skip whitespace
    if (current.type === TokenType.WHITESPACE) return false;
    
    const currentIsFactor = current.type === TokenType.NUMBER || 
                           current.type === TokenType.IDENTIFIER || 
                           current.type === TokenType.GREEK ||
                           current.type === TokenType.RPAREN;
    
    const nextIsFactor = next.type === TokenType.NUMBER || 
                         next.type === TokenType.IDENTIFIER || 
                         next.type === TokenType.GREEK ||
                         next.type === TokenType.FUNCTION ||
                         next.type === TokenType.LPAREN;
    
    return currentIsFactor && nextIsFactor;
  }

  /**
   * Get the next token from the source
   */
  private nextToken(): Token | null {
    // Skip whitespace but track it
    if (isWhitespace(this.currentChar())) {
      return this.readWhitespace();
    }

    const char = this.currentChar();
    const start = this.pos;

    // Numbers
    if (isDigit(char)) {
      return this.readNumber();
    }

    // Letters (identifiers, Greek letters, functions)
    if (isLetter(char)) {
      return this.readIdentifier();
    }

    // Operators
    if (isOperator(char)) {
      this.advance();
      return {
        type: TokenType.OPERATOR,
        value: char,
        start,
        end: this.pos
      };
    }

    // Parentheses
    if (char === '(') {
      this.advance();
      return {
        type: TokenType.LPAREN,
        value: char,
        start,
        end: this.pos
      };
    }

    if (char === ')') {
      this.advance();
      return {
        type: TokenType.RPAREN,
        value: char,
        start,
        end: this.pos
      };
    }

    // Comma
    if (char === ',') {
      this.advance();
      return {
        type: TokenType.COMMA,
        value: char,
        start,
        end: this.pos
      };
    }

    // Caret (superscript)
    if (char === '^') {
      this.advance();
      return {
        type: TokenType.CARET,
        value: char,
        start,
        end: this.pos
      };
    }

    // Underscore (subscript)
    if (char === '_') {
      this.advance();
      return {
        type: TokenType.UNDERSCORE,
        value: char,
        start,
        end: this.pos
      };
    }

    // Unknown character - skip it
    this.advance();
    return null;
  }

  /**
   * Read a number token
   */
  private readNumber(): Token {
    const start = this.pos;
    let value = '';

    // Read integer part
    while (this.pos < this.src.length && isDigit(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }

    // Read decimal part if present
    if (this.currentChar() === '.' && this.pos + 1 < this.src.length && isDigit(this.src[this.pos + 1])) {
      value += this.currentChar();
      this.advance();
      
      while (this.pos < this.src.length && isDigit(this.currentChar())) {
        value += this.currentChar();
        this.advance();
      }
    }

    return {
      type: TokenType.NUMBER,
      value,
      start,
      end: this.pos
    };
  }

  /**
   * Read an identifier token (could be Greek letter, function, or variable)
   */
  private readIdentifier(): Token {
    const start = this.pos;
    let value = '';

    while (this.pos < this.src.length && (isLetter(this.currentChar()) || isDigit(this.currentChar()))) {
      value += this.currentChar();
      this.advance();
    }

    // Determine token type
    let type: TokenType;
    if (isGreekLetter(value)) {
      type = TokenType.GREEK;
    } else if (isFunctionKeyword(value)) {
      type = TokenType.FUNCTION;
    } else {
      type = TokenType.IDENTIFIER;
    }

    return {
      type,
      value,
      start,
      end: this.pos
    };
  }

  /**
   * Read whitespace token
   */
  private readWhitespace(): Token {
    const start = this.pos;
    let value = '';

    while (this.pos < this.src.length && isWhitespace(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }

    return {
      type: TokenType.WHITESPACE,
      value,
      start,
      end: this.pos
    };
  }

  /**
   * Get current character
   */
  private currentChar(): string {
    return this.pos < this.src.length ? this.src[this.pos] : '';
  }

  /**
   * Advance to next character
   */
  private advance(): void {
    this.pos++;
  }
}

// Convenience function
export function tokenize(src: string): Token[] {
  const lexer = new Lexer();
  return lexer.tokenize(src);
}
