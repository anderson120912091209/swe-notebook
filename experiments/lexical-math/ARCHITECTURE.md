# Lexical Math Experiment - Architecture & Development Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Analysis](#architecture-analysis)
3. [Current Implementation Status](#current-implementation-status)
4. [MVP to Prototype Roadmap](#mvp-to-prototype-roadmap)
5. [Completing Mathematical Logic](#completing-mathematical-logic)
6. [Key Design Decisions](#key-design-decisions)

---

## 🎯 System Overview

### What is This?
A **Lexical-based rich text editor** with **nested math expression support**. It allows users to type mathematical notation (summations, integrals, fractions, etc.) directly inline with text, using a structured node-based approach.

### Core Concept
Instead of rendering math as static LaTeX strings, this system uses **Lexical DecoratorNodes** that contain **nested Lexical editors**. Each math symbol (Σ, ∫, √, etc.) is a node with its own mini-editor for limits, operands, and sub-expressions.

---

## 🏗️ Architecture Analysis

### 1. **Core Components**

#### **A. MathNode (`src/nodes/MathNode.tsx`)**
- **Type**: Lexical `DecoratorNode<ReactNode>`
- **Purpose**: Represents a mathematical expression as a structured node
- **Key Properties**:
  - `__mathType`: Type of math symbol (`'sum' | 'int' | 'frac' | 'sqrt' | 'sup' | 'sub' | 'symbol'`)
  - `__upperLimit`: Nested LexicalEditor for upper bounds
  - `__lowerLimit`: Nested LexicalEditor for lower bounds  
  - `__operand`: Nested LexicalEditor for the main expression

**Architecture Pattern**: **Composite Pattern** - Each math node contains nested editors that can themselves contain more math nodes (recursive structure).

#### **B. Editor Component (`src/components/Editor.tsx`)**
- **Purpose**: Main editor wrapper
- **Plugins Used**:
  - `RichTextPlugin`: Handles basic text editing
  - `HistoryPlugin`: Undo/redo
  - `AutoFocusPlugin`: Auto-focus on mount
  - `MathPlugin`: Registers math insertion commands
  - `MathTypeaheadPlugin`: Provides autocomplete for math symbols

#### **C. Plugins**

**MathPlugin** (`src/plugins/MathPlugin.tsx`):
- Registers `INSERT_MATH_COMMAND` command
- Handles programmatic insertion of math nodes
- **Command Pattern**: Uses Lexical's command system for decoupled communication

**MathTypeaheadPlugin** (`src/plugins/MathTypeaheadPlugin.tsx`):
- **Trigger System**: 
  - `/` prefix (standard typeahead)
  - Direct keywords: `sum`, `int`, `frac`, `sqrt`, `^`, `_`
- **Features**:
  - Filters options based on query
  - Supports Greek letters (α, β, γ, etc.)
  - Inserts either text nodes (Greek) or MathNodes (operators)

**MathNavigationPlugin** (`src/plugins/MathNavigationPlugin.tsx`):
- **Purpose**: Handles keyboard navigation between nested editors
- **Key Feature**: Tab/Enter moves focus to next editor in sequence
- **Navigation Flow**: 
  - Enter in nested editor → focus next editor
  - Enter in last editor → exit math node

### 2. **Data Flow**

```
User Types "sum" 
  ↓
MathTypeaheadPlugin detects trigger
  ↓
Shows menu with "Summation (sum)"
  ↓
User selects option
  ↓
MathTypeaheadPlugin dispatches INSERT_MATH_COMMAND
  ↓
MathPlugin handles command
  ↓
Creates MathNode with type 'sum'
  ↓
MathNode renders with 3 nested editors (upperLimit, lowerLimit, operand)
  ↓
Auto-focus on lowerLimit (first logical editor)
```

### 3. **Nested Editor System**

**Key Innovation**: Each math node contains **separate LexicalEditor instances** for different parts:
- **Summation (Σ)**: 
  - Upper limit editor (top)
  - Lower limit editor (bottom)
  - Operand editor (right side)
- **Integral (∫)**:
  - Upper bound (top)
  - Lower bound (bottom)
  - Integrand (right side)
- **Fraction**: 
  - Numerator (top)
  - Denominator (bottom)
- **Square Root (√)**:
  - Single operand editor

**Why Nested Editors?**
- ✅ Each part can have its own editing state
- ✅ Supports recursive nesting (fractions inside summations, etc.)
- ✅ Independent undo/redo per section
- ✅ Natural keyboard navigation

---

## 📊 Current Implementation Status

### ✅ **What Works**
1. **Basic Math Node Creation**: Can insert sum, int, frac, sqrt, sup, sub
2. **Visual Rendering**: Math symbols render correctly with proper layout
3. **Nested Editing**: Can type in nested editors
4. **Typeahead**: Autocomplete menu appears and works
5. **Navigation**: Basic Enter key navigation between editors
6. **Selection**: Click to select math nodes
7. **Greek Letters**: Can insert Greek letters as text nodes

### ⚠️ **What's Missing/Incomplete**

#### **1. Mathematical Expression Parsing**
- **Current**: Nested editors are just plain text editors
- **Missing**: No parsing of mathematical expressions inside editors
- **Impact**: Can't type `x^2 + y^2` and have it render as proper math

#### **2. Expression Evaluation**
- **Current**: No evaluation logic
- **Missing**: Can't compute `2+2` or `sqrt(16)`
- **Impact**: Purely visual, no computational capability

#### **3. Serialization/Persistence**
- **Current**: `exportJSON()` only saves `mathType`, not editor contents
- **Missing**: Need to serialize nested editor states
- **Impact**: Can't save/load documents with math

#### **4. Advanced Math Operations**
- **Current**: Only basic symbols (sum, int, frac, sqrt, sup, sub)
- **Missing**: 
  - Products (Π)
  - Limits (lim)
  - Derivatives (d/dx)
  - Matrices
  - Sets
  - And more...

#### **5. Input Validation**
- **Current**: No validation of mathematical syntax
- **Missing**: Error handling for invalid expressions
- **Impact**: Users can type invalid math

#### **6. Copy/Paste**
- **Current**: Basic Lexical copy/paste (may not work well with math nodes)
- **Missing**: Special handling for math node serialization

#### **7. LaTeX Export**
- **Current**: No export functionality
- **Missing**: Convert math nodes to LaTeX strings
- **Impact**: Can't export to other systems

---

## 🚀 MVP to Prototype Roadmap

### **Phase 1: Core Expression Parsing** (Priority: HIGH)

#### **Step 1.1: Add Math DSL Parser**
**Reference**: Look at `mathy/app/lib/math-dsl/` for inspiration

**Create**: `src/lib/math-parser/`
```
math-parser/
  ├── lexer.ts          # Tokenize input: "x^2" → [IDENTIFIER, CARET, NUMBER]
  ├── parser.ts         # Parse tokens into AST
  ├── types.ts          # AST node types
  └── utils.ts          # Helper functions
```

**Implementation Strategy**:
1. **Start Simple**: Parse basic expressions first
   - Numbers: `123`, `3.14`
   - Variables: `x`, `y`, `alpha`
   - Binary ops: `+`, `-`, `*`, `/`
   - Superscripts: `x^2`
   - Subscripts: `x_i`

2. **Integrate with Nested Editors**:
   - On editor content change → parse → render AST
   - Use a plugin to watch editor updates
   - Render AST as formatted math (similar to mathy's renderer)

**Example Flow**:
```typescript
// User types "x^2 + y^2" in operand editor
// 1. Lexer tokenizes: [IDENTIFIER('x'), CARET, NUMBER('2'), PLUS, ...]
// 2. Parser creates AST:
//    {
//      type: 'BINARY_OP',
//      operator: '+',
//      left: { type: 'SUPERSCRIPT', base: 'x', exponent: '2' },
//      right: { type: 'SUPERSCRIPT', base: 'y', exponent: '2' }
//    }
// 3. Renderer displays formatted math
```

#### **Step 1.2: Create Math Renderer Component**
**Create**: `src/components/MathRenderer.tsx`

**Purpose**: Render parsed AST as formatted math notation

**Features**:
- Render superscripts/subscripts properly
- Style identifiers (italic)
- Style numbers (monospace)
- Handle binary operators with spacing
- Support Greek letters

**Integration**: 
- Replace plain `ContentEditable` in nested editors with:
  ```tsx
  <MathRenderer ast={parsedAST} editor={nestedEditor} />
  ```

### **Phase 2: Enhanced Serialization** (Priority: HIGH)

#### **Step 2.1: Serialize Nested Editor Content**

**Update `MathNode.exportJSON()`**:
```typescript
exportJSON(): SerializedMathNode {
  return {
    mathType: this.__mathType,
    type: 'math-node',
    version: 1,
    // NEW: Serialize nested editor content
    upperLimit: this.__upperLimit.getEditorState().toJSON(),
    lowerLimit: this.__lowerLimit.getEditorState().toJSON(),
    operand: this.__operand.getEditorState().toJSON(),
  };
}
```

**Update `MathNode.importJSON()`**:
```typescript
static importJSON(serializedNode: SerializedMathNode): MathNode {
  const node = new MathNode(serializedNode.mathType);
  // NEW: Restore nested editor states
  if (serializedNode.upperLimit) {
    node.__upperLimit.setEditorState(
      node.__upperLimit.parseEditorState(serializedNode.upperLimit)
    );
  }
  // ... same for lowerLimit and operand
  return node;
}
```

### **Phase 3: Advanced Math Operations** (Priority: MEDIUM)

#### **Step 3.1: Add More Math Types**

**Extend `MathSymbolType`**:
```typescript
export type MathSymbolType = 
  | 'sum' | 'int' | 'frac' | 'sqrt' | 'sup' | 'sub' 
  | 'prod'      // Product (Π)
  | 'lim'       // Limit
  | 'deriv'     // Derivative (d/dx)
  | 'matrix'    // Matrix
  | 'set'       // Set notation { }
  | 'abs'       // Absolute value | |
  | 'norm'      // Norm || ||
  | 'binomial'; // Binomial coefficient
```

**Add rendering logic** in `MathComponent` for each new type.

### **Phase 4: Expression Evaluation** (Priority: MEDIUM)

#### **Step 4.1: Create Evaluator**

**Create**: `src/lib/math-evaluator/`
```
math-evaluator/
  ├── evaluator.ts      # Evaluate AST to number/value
  ├── functions.ts     # Math functions: sin, cos, log, etc.
  └── constants.ts      # Math constants: π, e, etc.
```

**Features**:
- Evaluate numeric expressions: `2 + 2` → `4`
- Handle variables: `x = 5, x^2` → `25`
- Support functions: `sin(π/2)` → `1`
- Error handling for invalid expressions

**Integration**: Add "Evaluate" button/command to math nodes.

### **Phase 5: LaTeX Export** (Priority: LOW)

#### **Step 5.1: LaTeX Converter**

**Create**: `src/lib/latex-export/`

**Purpose**: Convert math nodes to LaTeX strings

**Example**:
```typescript
// MathNode (sum from i=0 to n of x_i)
// → LaTeX: "\sum_{i=0}^{n} x_i"
```

---

## 🔧 Completing Mathematical Logic

### **1. Expression Parsing Architecture**

#### **Option A: Real-time Parsing (Recommended)**
- Parse on every keystroke (debounced)
- Show syntax errors immediately
- **Pros**: Immediate feedback
- **Cons**: Performance concerns with large expressions

#### **Option B: Parse on Blur**
- Parse when user leaves editor
- **Pros**: Better performance
- **Cons**: Delayed feedback

#### **Option C: Hybrid**
- Parse on blur for performance
- Quick validation on keystroke (just check basic syntax)

### **2. Parser Implementation Strategy**

**Start with Recursive Descent Parser** (like mathy's parser):

```typescript
// Precedence levels (lowest to highest):
// 1. Expression: +, -
// 2. Term: *, /
// 3. Factor: ^ (exponentiation)
// 4. Base: numbers, identifiers, functions, groups

parseExpression() {
  let left = parseTerm();
  while (match('+') || match('-')) {
    const op = currentToken().value;
    advance();
    const right = parseTerm();
    left = { type: 'BINARY_OP', operator: op, left, right };
  }
  return left;
}
```

### **3. Integration Points**

#### **A. Editor Content Change Handler**

**Create**: `src/plugins/MathParserPlugin.tsx`

```typescript
export default function MathParserPlugin({ editor }: { editor: LexicalEditor }) {
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        // Get all math nodes
        const mathNodes = editorState._nodeMap.values()
          .filter(node => $isMathNode(node));
        
        // Parse each nested editor's content
        mathNodes.forEach(mathNode => {
          const operandText = getEditorText(mathNode.__operand);
          const ast = parse(lex(operandText));
          // Store AST in node or trigger re-render
        });
      });
    });
  }, [editor]);
}
```

#### **B. AST Storage**

**Option 1**: Store AST in MathNode
```typescript
class MathNode {
  __operandAST: ASTNode | null = null;
  // Update when editor content changes
}
```

**Option 2**: Compute on-demand (no storage)
- Parse when rendering
- Cache with memoization

**Recommendation**: Option 2 for MVP (simpler), Option 1 for production (better performance).

### **4. Rendering Parsed Expressions**

**Create**: `src/components/ParsedMathRenderer.tsx`

```typescript
function ParsedMathRenderer({ ast, theme }: { ast: ASTNode, theme: 'light' | 'dark' }) {
  switch (ast.type) {
    case 'NUMBER':
      return <span className="math-number">{ast.value}</span>;
    case 'IDENTIFIER':
      return <span className="math-identifier">{ast.value}</span>;
    case 'BINARY_OP':
      return (
        <>
          <ParsedMathRenderer ast={ast.left} />
          <span className="math-operator">{ast.operator}</span>
          <ParsedMathRenderer ast={ast.right} />
        </>
      );
    case 'SUPERSCRIPT':
      return (
        <>
          <ParsedMathRenderer ast={ast.base} />
          <sup><ParsedMathRenderer ast={ast.exponent} /></sup>
        </>
      );
    // ... more cases
  }
}
```

**Replace in NestedEditor**:
```typescript
// Instead of plain ContentEditable:
{parsedAST ? (
  <ParsedMathRenderer ast={parsedAST} />
) : (
  <ContentEditable ... />
)}
```

### **5. Error Handling**

**Add Error States**:
```typescript
interface ParseError {
  message: string;
  position: number;
  token?: Token;
}

// Show errors in UI
function MathEditorWithErrors({ editor, ast, error }) {
  return (
    <div className={error ? 'math-error' : ''}>
      {error && <span className="error-message">{error.message}</span>}
      <ParsedMathRenderer ast={ast} />
    </div>
  );
}
```

---

## 🎨 Key Design Decisions

### **1. Why Nested Editors?**
- **Flexibility**: Each part can be edited independently
- **Recursion**: Supports nested math (fractions in summations)
- **State Management**: Lexical handles undo/redo automatically
- **Navigation**: Natural tab/enter flow

### **2. Why DecoratorNode?**
- **Separation**: Math nodes are separate from text nodes
- **Custom Rendering**: Full control over visual representation
- **Selection**: Can select entire math node or parts

### **3. Why Not Use Existing Math Libraries?**
- **Control**: Full control over editing experience
- **Integration**: Seamless with Lexical's editing model
- **Customization**: Can add features specific to your use case

### **4. Trade-offs**

**Pros**:
- ✅ Rich editing experience
- ✅ Nested structure supports complex math
- ✅ Extensible architecture

**Cons**:
- ⚠️ More complex than simple LaTeX input
- ⚠️ Performance concerns with many nested editors
- ⚠️ Requires custom parsing/evaluation

---

## 📝 Next Steps Checklist

### **Immediate (Week 1)**
- [ ] Create math parser (lexer + parser)
- [ ] Integrate parser with nested editors
- [ ] Create AST renderer component
- [ ] Test with simple expressions (`x^2`, `a+b`)

### **Short-term (Week 2-3)**
- [ ] Fix serialization to save nested editor content
- [ ] Add more math types (product, limit, etc.)
- [ ] Improve error handling
- [ ] Add syntax validation

### **Medium-term (Month 1)**
- [ ] Expression evaluator
- [ ] LaTeX export
- [ ] Copy/paste support
- [ ] Performance optimization

### **Long-term (Month 2+)**
- [ ] Advanced features (matrices, sets)
- [ ] MathML export
- [ ] Collaborative editing support
- [ ] Accessibility improvements

---

## 🔗 References

- **Lexical Docs**: https://lexical.dev/
- **Mathy Implementation**: `mathy/app/lib/math-dsl/` (good reference for parser/renderer)
- **AST Parsing**: Recursive descent parser pattern
- **Math Notation**: LaTeX syntax as inspiration

---

## 💡 Tips for Development

1. **Start Small**: Get `x^2` parsing/rendering working first
2. **Test Incrementally**: Add one feature at a time
3. **Use TypeScript**: Strong typing helps catch errors early
4. **Leverage Lexical**: Use built-in features (commands, plugins, nodes)
5. **Reference Mathy**: The main app has a working math DSL - study it!

---

**Last Updated**: 2025-01-XX
**Status**: MVP → Prototype (In Progress)

