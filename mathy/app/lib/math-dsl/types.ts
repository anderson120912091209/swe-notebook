// Core types for the custom DSL math input system

export enum TokenType {
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  GREEK = 'GREEK',
  OPERATOR = 'OPERATOR',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  CARET = 'CARET',
  UNDERSCORE = 'UNDERSCORE',
  FUNCTION = 'FUNCTION',
  WHITESPACE = 'WHITESPACE',
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  start: number; // Offset in src
  end: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any; // Function args, etc.
}

export enum ASTNodeType {
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  GREEK = 'GREEK',
  BINARY_OP = 'BINARY_OP',
  FUNCTION = 'FUNCTION',
  SUPERSCRIPT = 'SUPERSCRIPT',
  SUBSCRIPT = 'SUBSCRIPT',
  GROUP = 'GROUP'
}

export interface ASTNode {
  id: string; // Stable ID for memoization
  type: ASTNodeType;
  startOffset: number; // Character offset in src
  endOffset: number;
  value?: string; // For numbers, identifiers
  operator?: string; // For binary ops
  name?: string; // For functions
  args?: ASTNode[]; // For functions
  base?: ASTNode; // For superscript/subscript
  exponent?: ASTNode; // For superscript
  subscript?: ASTNode; // For subscript
  left?: ASTNode; // For binary ops
  right?: ASTNode; // For binary ops
  expression?: ASTNode; // For groups
}

export interface CaretPosition {
  tokenIndex: number; // Which token cursor is at/before
  offsetInToken: number; // Position within token (0 = before)
  astNodeId: string | null; // For nested structures
}

export interface Selection {
  start: CaretPosition;
  end: CaretPosition;
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  start: number;
  end: number;
  newText?: string;
}

export interface MathEditorState {
  // Source of truth
  src: string; // "alpha + frac(a,b)"
  
  // Parsed representation
  tokens: Token[]; // Cached token stream
  ast: ASTNode | null; // Root AST node
  
  // Caret/Selection
  caretPosition: CaretPosition; // Logical position in tokens/AST
  selection: Selection | null; // Range selection
  
  // IME state
  isComposing: boolean;
  compositionBuffer: string;
  compositionStart: number;
  
  // Suggestions
  suggestions: Suggestion[];
  selectedSuggestion: number;
  
  // Performance
  lastParseTime: number;
  lastRenderTime: number;
}

export interface Suggestion {
  keyword: string;
  display: string;
  description?: string;
}

export interface ParseCache {
  src: string; // Last parsed source
  tokens: Token[];
  ast: ASTNode;
  astNodeMap: Map<string, ASTNode>; // ID → node for fast lookup
}

// Action types for useReducer
export type MathEditorAction = 
  | { type: 'SET_SRC'; payload: string }
  | { type: 'SET_CARET'; payload: CaretPosition }
  | { type: 'SET_SELECTION'; payload: Selection | null }
  | { type: 'SET_COMPOSING'; payload: { isComposing: boolean; buffer?: string; start?: number } }
  | { type: 'SET_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'SET_SELECTED_SUGGESTION'; payload: number }
  | { type: 'UPDATE_PERFORMANCE'; payload: { parseTime: number; renderTime: number } }
  | { type: 'RESET_STATE'; payload: { src: string } };
