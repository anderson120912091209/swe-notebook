// Parser for the custom DSL math input system

import { ASTNode, ASTNodeType, Token, TokenType } from './types';
import { generateNodeId } from './utils';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  /**
   * Parse tokens into an AST
   */
  parse(tokens: Token[]): ASTNode {
    // Filter out whitespace tokens before parsing
    this.tokens = tokens.filter(t => t.type !== TokenType.WHITESPACE);
    this.pos = 0;
    
    if (this.tokens.length === 0 || (this.tokens.length === 1 && this.tokens[0].type === TokenType.EOF)) {
      // Empty input - return placeholder
      return {
        id: generateNodeId(),
        type: ASTNodeType.IDENTIFIER,
        startOffset: 0,
        endOffset: 0,
        value: ''
      };
    }
    
    const ast = this.parseExpression();
    
    // If we didn't consume all tokens, there's a syntax error
    if (this.pos < this.tokens.length - 1) { // -1 for EOF token
      console.warn('Parser: Not all tokens consumed, possible syntax error');
    }
    
    return ast;
  }

  /**
   * Parse an expression (lowest precedence)
   */
  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    
    while (this.match(TokenType.OPERATOR) && (this.currentToken().value === '+' || this.currentToken().value === '-')) {
      const operator = this.currentToken().value;
      this.advance();
      const right = this.parseTerm();
      
      left = {
        id: generateNodeId(),
        type: ASTNodeType.BINARY_OP,
        startOffset: left.startOffset,
        endOffset: right.endOffset,
        operator,
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Parse a term (multiplication precedence)
   */
  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    
    while (this.match(TokenType.OPERATOR) && (this.currentToken().value === '*' || this.currentToken().value === '/')) {
      const operator = this.currentToken().value;
      this.advance();
      const right = this.parseFactor();
      
      left = {
        id: generateNodeId(),
        type: ASTNodeType.BINARY_OP,
        startOffset: left.startOffset,
        endOffset: right.endOffset,
        operator,
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Parse a factor (highest precedence)
   */
  private parseFactor(): ASTNode {
    let base = this.parseBase();
    
    // Handle superscript
    if (this.match(TokenType.CARET)) {
      this.advance();
      const exponent = this.parseFactor(); // Right-associative
      
      base = {
        id: generateNodeId(),
        type: ASTNodeType.SUPERSCRIPT,
        startOffset: base.startOffset,
        endOffset: exponent.endOffset,
        base,
        exponent
      };
    }
    
    // Handle subscript
    if (this.match(TokenType.UNDERSCORE)) {
      this.advance();
      const subscript = this.parseFactor(); // Right-associative
      
      base = {
        id: generateNodeId(),
        type: ASTNodeType.SUBSCRIPT,
        startOffset: base.startOffset,
        endOffset: subscript.endOffset,
        base,
        subscript
      };
    }
    
    return base;
  }

  /**
   * Parse a base (number, identifier, function, or grouped expression)
   */
  private parseBase(): ASTNode {
    // Number
    if (this.match(TokenType.NUMBER)) {
      const token = this.currentToken();
      this.advance();
      return {
        id: generateNodeId(),
        type: ASTNodeType.NUMBER,
        startOffset: token.start,
        endOffset: token.end,
        value: token.value
      };
    }
    
    // Identifier or Greek letter
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.GREEK)) {
      const token = this.currentToken();
      this.advance();
      return {
        id: generateNodeId(),
        type: token.type === TokenType.GREEK ? ASTNodeType.GREEK : ASTNodeType.IDENTIFIER,
        startOffset: token.start,
        endOffset: token.end,
        value: token.value
      };
    }
    
    // Function call
    if (this.match(TokenType.FUNCTION)) {
      return this.parseFunction();
    }
    
    // Grouped expression
    if (this.match(TokenType.LPAREN)) {
      this.advance(); // consume '('
      const expression = this.parseExpression();
      
      if (!this.match(TokenType.RPAREN)) {
        console.warn('Parser: Expected closing parenthesis');
      } else {
        this.advance(); // consume ')'
      }
      
      return {
        id: generateNodeId(),
        type: ASTNodeType.GROUP,
        startOffset: this.tokens[this.pos - 2].start, // '(' position
        endOffset: this.tokens[this.pos - 1].end, // ')' position
        expression
      };
    }
    
    // Error case - return a placeholder
    console.warn('Parser: Unexpected token:', this.currentToken());
    const token = this.currentToken();
    this.advance();
    return {
      id: generateNodeId(),
      type: ASTNodeType.IDENTIFIER,
      startOffset: token.start,
      endOffset: token.end,
      value: token.value
    };
  }

  /**
   * Parse a function call
   */
  private parseFunction(): ASTNode {
    const functionToken = this.currentToken();
    this.advance(); // consume function name
    
    if (!this.match(TokenType.LPAREN)) {
      console.warn('Parser: Expected opening parenthesis after function');
      return {
        id: generateNodeId(),
        type: ASTNodeType.FUNCTION,
        startOffset: functionToken.start,
        endOffset: functionToken.end,
        name: functionToken.value,
        args: []
      };
    }
    
    this.advance(); // consume '('
    const args: ASTNode[] = [];
    
    // Parse arguments
    if (!this.match(TokenType.RPAREN)) {
      args.push(this.parseExpression());
      
      while (this.match(TokenType.COMMA)) {
        this.advance(); // consume ','
        args.push(this.parseExpression());
      }
    }
    
    if (!this.match(TokenType.RPAREN)) {
      console.warn('Parser: Expected closing parenthesis after function arguments');
    } else {
      this.advance(); // consume ')'
    }
    
    return {
      id: generateNodeId(),
      type: ASTNodeType.FUNCTION,
      startOffset: functionToken.start,
      endOffset: this.tokens[this.pos - 1].end,
      name: functionToken.value,
      args
    };
  }

  /**
   * Check if current token matches the given type
   */
  private match(type: TokenType): boolean {
    return this.pos < this.tokens.length && this.tokens[this.pos].type === type;
  }

  /**
   * Get current token
   */
  private currentToken(): Token {
    return this.tokens[this.pos];
  }

  /**
   * Advance to next token
   */
  private advance(): void {
    this.pos++;
  }
}

// Convenience function
export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser();
  return parser.parse(tokens);
}
