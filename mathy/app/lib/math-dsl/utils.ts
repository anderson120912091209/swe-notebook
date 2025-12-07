// Helper functions for the math DSL system

import { ASTNode, Token } from './types';

/**
 * Generate a stable ID for AST nodes
 */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Find token at a specific character offset
 */
export function findTokenAtOffset(tokens: Token[], offset: number): number {
  for (let i = 0; i < tokens.length; i++) {
    if (offset >= tokens[i].start && offset <= tokens[i].end) {
      return i;
    }
  }
  return tokens.length; // EOF position
}

/**
 * Get tokens for a specific AST node
 */
export function getTokensForNode(tokens: Token[], node: ASTNode): Token[] {
  return tokens.filter(token => 
    token.start >= node.startOffset && token.end <= node.endOffset
  );
}

/**
 * Find AST node containing a specific offset
 */
export function findASTNodeContaining(ast: ASTNode, startOffset: number, endOffset: number): ASTNode | null {
  if (ast.startOffset <= startOffset && ast.endOffset >= endOffset) {
    // Check children first
    if (ast.args) {
      for (const arg of ast.args) {
        const found = findASTNodeContaining(arg, startOffset, endOffset);
        if (found) return found;
      }
    }
    if (ast.left) {
      const found = findASTNodeContaining(ast.left, startOffset, endOffset);
      if (found) return found;
    }
    if (ast.right) {
      const found = findASTNodeContaining(ast.right, startOffset, endOffset);
      if (found) return found;
    }
    if (ast.base) {
      const found = findASTNodeContaining(ast.base, startOffset, endOffset);
      if (found) return found;
    }
    if (ast.exponent) {
      const found = findASTNodeContaining(ast.exponent, startOffset, endOffset);
      if (found) return found;
    }
    if (ast.subscript) {
      const found = findASTNodeContaining(ast.subscript, startOffset, endOffset);
      if (found) return found;
    }
    if (ast.expression) {
      const found = findASTNodeContaining(ast.expression, startOffset, endOffset);
      if (found) return found;
    }
    
    return ast;
  }
  return null;
}

/**
 * Replace a subtree in the AST
 */
export function replaceASTSubtree(ast: ASTNode, oldNode: ASTNode, newNode: ASTNode): ASTNode {
  if (ast.id === oldNode.id) {
    return newNode;
  }
  
  // Create a copy and recursively replace
  const newAst = { ...ast };
  
  if (newAst.args) {
    newAst.args = newAst.args.map(arg => 
      arg.id === oldNode.id ? newNode : replaceASTSubtree(arg, oldNode, newNode)
    );
  }
  
  if (newAst.left && newAst.left.id === oldNode.id) {
    newAst.left = newNode;
  } else if (newAst.left) {
    newAst.left = replaceASTSubtree(newAst.left, oldNode, newNode);
  }
  
  if (newAst.right && newAst.right.id === oldNode.id) {
    newAst.right = newNode;
  } else if (newAst.right) {
    newAst.right = replaceASTSubtree(newAst.right, oldNode, newNode);
  }
  
  if (newAst.base && newAst.base.id === oldNode.id) {
    newAst.base = newNode;
  } else if (newAst.base) {
    newAst.base = replaceASTSubtree(newAst.base, oldNode, newNode);
  }
  
  if (newAst.exponent && newAst.exponent.id === oldNode.id) {
    newAst.exponent = newNode;
  } else if (newAst.exponent) {
    newAst.exponent = replaceASTSubtree(newAst.exponent, oldNode, newNode);
  }
  
  if (newAst.subscript && newAst.subscript.id === oldNode.id) {
    newAst.subscript = newNode;
  } else if (newAst.subscript) {
    newAst.subscript = replaceASTSubtree(newAst.subscript, oldNode, newNode);
  }
  
  if (newAst.expression && newAst.expression.id === oldNode.id) {
    newAst.expression = newNode;
  } else if (newAst.expression) {
    newAst.expression = replaceASTSubtree(newAst.expression, oldNode, newNode);
  }
  
  return newAst;
}

/**
 * Calculate percentile from an array of numbers
 */
export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Check if a character is a digit
 */
export function isDigit(char: string): boolean {
  return /[0-9]/.test(char);
}

/**
 * Check if a character is a letter
 */
export function isLetter(char: string): boolean {
  return /[a-zA-Z]/.test(char);
}

/**
 * Check if a character is whitespace
 */
export function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

/**
 * Check if a character is an operator
 */
export function isOperator(char: string): boolean {
  return /[+\-*/]/.test(char);
}

/**
 * Check if a string is a Greek letter keyword
 */
export function isGreekLetter(str: string): boolean {
  const greekLetters = [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
    'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
    'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
  ];
  return greekLetters.includes(str.toLowerCase());
}

/**
 * Check if a string is a function keyword
 */
export function isFunctionKeyword(str: string): boolean {
  const functions = [
    'sqrt', 'frac', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'abs',
    'max', 'min', 'sum', 'int', 'lim'
  ];
  return functions.includes(str.toLowerCase());
}

/**
 * Get the Greek letter symbol for a keyword
 */
export function getGreekSymbol(keyword: string): string {
  const greekMap: Record<string, string> = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'epsilon': 'ε',
    'zeta': 'ζ', 'eta': 'η', 'theta': 'θ', 'iota': 'ι', 'kappa': 'κ',
    'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ', 'omicron': 'ο',
    'pi': 'π', 'rho': 'ρ', 'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ',
    'phi': 'φ', 'chi': 'χ', 'psi': 'ψ', 'omega': 'ω'
  };
  return greekMap[keyword.toLowerCase()] || keyword;
}
