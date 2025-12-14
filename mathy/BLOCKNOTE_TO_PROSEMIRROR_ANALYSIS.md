# Deep Analysis: BlockNote → ProseMirror Migration Guide

**Date:** December 2024  
**Current Framework:** BlockNote v0.41.1  
**Target Framework:** ProseMirror (direct)

---

## 1. Current Architecture: How You're Using BlockNote

### 1.1 BlockNote Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│              YOUR APPLICATION LAYER                      │
│  - PageEditor.tsx, PageEditorModal.tsx                  │
│  - Custom blocks: InlineMath, CodeBlock                 │
│  - Custom schema: blocknote-schema.ts                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              BLOCKNOTE FRAMEWORK LAYER                   │
│  @blocknote/react  │  useCreateBlockNote()              │
│  @blocknote/mantine │  BlockNoteView                    │
│  @blocknote/core    │  BlockNoteSchema, BlockSpec       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              PROSEMIRROR (UNDER THE HOOD)                │
│  - Document Model (ProseMirror Schema)                  │
│  - Editor State & Commands                              │
│  - Plugins (formatting, toolbars, etc.)                 │
│  - Transactions & Updates                               │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Your Current BlockNote Usage

#### **Initialization Pattern:**
```typescript
// Current pattern (repeated in multiple files)
const editor = useCreateBlockNote({
  schema: customSchema,
  initialContent: initialContent, // BlockNote blocks format
});
```

**Files using this pattern:**
- `PageEditor.tsx` (line 273-276)
- `PageEditorModal.tsx` (line 281-284)
- `PageCardPreview.tsx` (line 124-127)
- `ScienceEditor.tsx` (line 86)

#### **Content Storage:**
- **Database format:** `JSONB` storing BlockNote's block structure
- **Example structure:**
  ```json
  {
    "blocks": [
      {
        "id": "xxx",
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Hello ",
            "styles": {}
          },
          {
            "type": "inlineMath",
            "props": { "latex": "x^2 + y^2" }
          }
        ]
      }
    ]
  }
  ```

#### **Editor API Methods You're Using:**
1. **`editor.document`** - Get all blocks (used for saving)
   - `PageEditor.tsx:284` - Auto-save content
   - `PageEditorModal.tsx:296, 324` - Auto-save content
   - `PageCardPreview.tsx:138` - Preview updates

2. **`editor.replaceBlocks()`** - Replace all blocks
   - `PageCardPreview.tsx:146` - Update preview when content changes

3. **`editor.insertInlineContent()`** - Insert inline math
   - `blocknote-schema.ts:31, 54` - Math menu items

4. **`editor.updateBlock()`** - Update block properties
   - `CodeBlock.tsx:65, 92, 120` - Update code block language/code/output

#### **Custom Extensions You've Built:**

1. **InlineMath** (`InlineMath.tsx`)
   - Uses `createReactInlineContentSpec()`
   - Custom props: `{ latex: string }`
   - Interactive: Click to edit, MathLive integration
   - **Complexity:** Medium - has custom editing UI, focus management

2. **CodeBlock** (`CodeBlock.tsx`)
   - Uses `createReactBlockSpec()`
   - Custom props: `{ language, code, output, isExecuting }`
   - CodeMirror integration for syntax highlighting
   - **Complexity:** High - full code editor with execution logic

3. **LegacyMathSymbol** (`LegacyMathSymbol.tsx`)
   - Backward compatibility wrapper
   - Simple display component

### 1.3 BlockNote's ProseMirror Integration

BlockNote **does NOT expose** direct ProseMirror APIs. Instead:

1. **Wraps ProseMirror** in its own abstraction layer
2. **Converts** between BlockNote blocks ↔ ProseMirror document model
3. **Exposes** only BlockNote-specific APIs (`editor.document`, `editor.insertInlineContent`, etc.)

**What you CAN'T access with BlockNote:**
- Direct ProseMirror `EditorView`
- ProseMirror `Transaction` objects
- Custom ProseMirror plugins (easily)
- Fine-grained selection/cursor control
- Direct schema manipulation
- Low-level event handlers

---

## 2. Why You Might Feel Limited

### 2.1 Likely Pain Points

Based on your codebase, here are limitations you're probably hitting:

#### **A. Limited Control Over Rendering**
- **Issue:** BlockNote controls the entire editor view (`BlockNoteView`)
- **Impact:** Hard to customize UI outside BlockNote's constraints
- **Your workaround:** Complex DOM manipulation in `InlineMath.tsx` (lines 51-91) to position caret after math insertion

#### **B. Block Structure Constraints**
- **Issue:** BlockNote forces block-based model even when you need inline flexibility
- **Evidence:** Your `inlineMath` requires special handling as "inline content" rather than true inline nodes
- **Impact:** More complex than it should be for inline math

#### **C. Custom Block Complexity**
- **Issue:** Your `CodeBlock` with execution is complex - BlockNote's abstraction makes it harder
- **Evidence:** Need to use `editor.updateBlock()` in multiple places for state sync
- **Impact:** More boilerplate, harder to manage complex state

#### **D. Performance Concerns**
- **Issue:** BlockNote adds conversion overhead (blocks ↔ ProseMirror)
- **Evidence:** You have `sanitizeBlocks()` validation - likely due to BlockNote's strict format
- **Impact:** Potential performance issues with large documents

#### **E. Limited Access to ProseMirror Features**
- **Issue:** Can't use ProseMirror plugins, custom commands, advanced selections
- **Impact:** Hard to implement advanced features like:
  - Custom keyboard shortcuts
  - Advanced text selection
  - Custom copy/paste behavior
  - Collaborative editing beyond BlockNote's Y.js integration

### 2.2 What BlockNote IS Good For

- ✅ **Rapid prototyping** - Quick to set up block-based editor
- ✅ **Consistent UI** - Provides polished UI components out of the box
- ✅ **Type safety** - TypeScript support for block schemas
- ✅ **React integration** - React hooks and components
- ✅ **Basics work well** - Standard rich text features

### 2.3 What You're Missing

- ❌ **Direct ProseMirror control** - Can't fine-tune editing behavior
- ❌ **Custom plugins** - Limited plugin ecosystem
- ❌ **Advanced features** - Collaborative editing, custom commands
- ❌ **Performance optimization** - Can't optimize at ProseMirror level
- ❌ **Flexibility** - Locked into BlockNote's abstractions

---

## 3. ProseMirror Architecture Deep Dive

### 3.1 ProseMirror Core Concepts

#### **Document Model:**
```typescript
// ProseMirror represents documents as a tree of nodes
{
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Hello " },
        { type: "math_inline", attrs: { latex: "x^2" } }
      ]
    }
  ]
}
```

#### **Schema:**
```typescript
// Define what nodes/marks are allowed
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*" },
    math_inline: { inline: true, atom: true, attrs: { latex: {} } }
  },
  marks: { strong: {}, em: {} }
});
```

#### **Editor State:**
- Contains the document, selection, and marks
- Immutable - changes via transactions
- Updated through commands

#### **Commands:**
```typescript
// Commands are functions that return true/false
function insertMath(editorState, dispatch, view) {
  const mathNode = schema.nodes.math_inline.create({ latex: "" });
  // Insert at current selection
  // Return true if command succeeded
}
```

#### **Plugins:**
```typescript
// Plugins can react to state changes, add UI, handle events
const mathPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.key === "$") {
        insertMath(view.state, view.dispatch);
        return true; // Prevent default
      }
    }
  }
});
```

### 3.2 React Integration (prose-mirror-react)

Unlike BlockNote's React-first approach, ProseMirror is framework-agnostic. To use with React:

**Option A: `prosemirror-react` or similar wrapper**
- Manual React integration
- More control, more setup

**Option B: Build custom hooks** (recommended)
```typescript
function useProseMirror(schema, initialDoc, plugins) {
  const [editorState, setEditorState] = useState(() => 
    EditorState.create({ schema, doc: initialDoc, plugins })
  );
  
  // Handle updates, expose commands, etc.
  return { editorState, dispatch, commands };
}
```

---

## 4. Migration Strategy: BlockNote → ProseMirror

### 4.1 Migration Complexity Assessment

**Your Custom Components:**

| Component | Complexity | Migration Effort |
|-----------|-----------|------------------|
| `InlineMath` | Medium | Medium - Need to convert to ProseMirror node spec |
| `CodeBlock` | High | High - Complex state, needs careful migration |
| Standard blocks | Low | Low - ProseMirror has equivalents |

**Data Migration:**
- **Current:** BlockNote block format in database
- **Need:** Conversion function: BlockNote blocks → ProseMirror JSON
- **Risk:** Medium - Need to handle edge cases, nested blocks

### 4.2 Step-by-Step Migration Plan

#### **Phase 1: Setup ProseMirror Foundation (Week 1)**

1. **Install ProseMirror packages:**
   ```bash
   npm install prosemirror-model prosemirror-state prosemirror-view \
     prosemirror-transform prosemirror-commands prosemirror-history \
     prosemirror-keymap prosemirror-schema-basic prosemirror-schema-list \
     prosemirror-example-setup
   ```

2. **Create base schema:**
   ```typescript
   // lib/prosemirror-schema.ts
   import { Schema } from 'prosemirror-model';
   import { nodes, marks } from 'prosemirror-schema-basic';
   import { orderedList, bulletList, listItem } from 'prosemirror-schema-list';
   
   // Add your custom nodes
   const mathInline = {
     inline: true,
     atom: true,
     group: 'inline',
     attrs: { latex: { default: '' } },
     toDOM: (node) => ['span', { class: 'math-inline' }, node.attrs.latex],
     parseDOM: [{ tag: 'span.math-inline', getAttrs: (dom) => ({ latex: dom.textContent }) }]
   };
   
   export const schema = new Schema({
     nodes: {
       ...nodes,
       ...orderedList,
       ...bulletList,
       listItem,
       mathInline
     },
     marks
   });
   ```

3. **Create React hook:**
   ```typescript
   // hooks/useProseMirror.ts
   import { useEffect, useRef, useState } from 'react';
   import { EditorState } from 'prosemirror-state';
   import { EditorView } from 'prosemirror-view';
   import { schema } from '@/app/lib/prosemirror-schema';
   
   export function useProseMirror(initialContent, plugins = []) {
     const editorRef = useRef<HTMLDivElement>(null);
     const viewRef = useRef<EditorView | null>(null);
     
     useEffect(() => {
       if (!editorRef.current) return;
       
       const state = EditorState.create({
         schema,
         doc: schema.nodeFromJSON(initialContent),
         plugins
       });
       
       const view = new EditorView(editorRef.current, {
         state,
         dispatchTransaction: (tr) => {
           const newState = view.state.apply(tr);
           view.updateState(newState);
           // Call onChange callback
         }
       });
       
       viewRef.current = view;
       
       return () => view.destroy();
     }, []);
     
     return { editorRef, view: viewRef.current };
   }
   ```

#### **Phase 2: Migrate Custom Components (Week 2-3)**

1. **Convert InlineMath to ProseMirror node:**
   ```typescript
   // lib/prosemirror-nodes/math-inline.ts
   import { NodeSpec } from 'prosemirror-model';
   
   export const mathInlineSpec: NodeSpec = {
     inline: true,
     atom: true,
     group: 'inline',
     attrs: {
       latex: { default: '' }
     },
     toDOM: (node) => [
       'span',
       {
         class: 'math-inline',
         'data-latex': node.attrs.latex
       }
     ],
     parseDOM: [{
       tag: 'span.math-inline',
       getAttrs: (dom) => ({
         latex: dom.getAttribute('data-latex') || ''
       })
     }]
   };
   ```

2. **Create React component for math rendering:**
   ```typescript
   // components/MathNodeView.tsx
   import { NodeView } from 'prosemirror-view';
   import ReactDOM from 'react-dom';
   import { InlineMathEditor } from './InlineMathEditor';
   
   export class MathNodeView implements NodeView {
     dom: HTMLElement;
     contentDOM?: HTMLElement;
     
     constructor(node, view, getPos) {
       this.dom = document.createElement('span');
       this.render(node);
     }
     
     update(node) {
       if (node.type.name !== 'math_inline') return false;
       this.render(node);
       return true;
     }
     
     render(node) {
       ReactDOM.render(
         <InlineMathEditor
           latex={node.attrs.latex}
           onChange={(latex) => {
             // Update node via transaction
           }}
         />,
         this.dom
       );
     }
     
     destroy() {
       ReactDOM.unmountComponentAtNode(this.dom);
     }
   }
   ```

3. **Convert CodeBlock similarly** (more complex due to execution logic)

#### **Phase 3: Data Migration (Week 3)**

1. **Create conversion function:**
   ```typescript
   // lib/blocknote-to-prosemirror.ts
   export function convertBlockNoteToProseMirror(blockNoteContent) {
     // Convert BlockNote blocks to ProseMirror JSON
     // Handle nested blocks, inline content, etc.
     const prosemirrorDoc = {
       type: 'doc',
       content: blockNoteContent.blocks.map(convertBlock)
     };
     return prosemirrorDoc;
   }
   
   function convertBlock(block) {
     // Convert individual BlockNote block to ProseMirror node
     switch (block.type) {
       case 'paragraph':
         return {
           type: 'paragraph',
           content: block.content?.map(convertInlineContent) || []
         };
       // ... handle other block types
     }
   }
   ```

2. **Update database** (one-time migration script or on-load)

#### **Phase 4: Replace BlockNote Usage (Week 4)**

1. **Update PageEditor.tsx:**
   - Replace `useCreateBlockNote` → `useProseMirror`
   - Replace `BlockNoteView` → custom `<div ref={editorRef} />`
   - Update save logic to use ProseMirror's `editorState.doc.toJSON()`

2. **Update other editor instances** similarly

3. **Remove BlockNote dependencies:**
   ```bash
   npm uninstall @blocknote/react @blocknote/mantine @blocknote/core
   ```

### 4.3 Migration Challenges & Solutions

#### **Challenge 1: BlockNote → ProseMirror Data Format**
- **Solution:** Write comprehensive conversion function, test with all block types
- **Risk:** Edge cases in nested blocks, inline content

#### **Challenge 2: Math Input UI**
- **Solution:** Use NodeViews to embed React components in ProseMirror
- **Benefit:** More control, better performance

#### **Challenge 3: Code Block Execution**
- **Solution:** Store execution state outside ProseMirror document (in component state)
- **Benefit:** Cleaner separation of concerns

#### **Challenge 4: Slash Commands**
- **Solution:** Build custom plugin with suggestion menu (like BlockNote's `SuggestionMenuController`)
- **Complexity:** Medium - need to build UI, handle positioning

#### **Challenge 5: Formatting Toolbar**
- **Solution:** Use ProseMirror's built-in commands + custom React toolbar
- **Benefit:** Full control over UI/UX

---

## 5. Recommended Approach

### 5.1 Should You Migrate?

**Migrate if:**
- ✅ You need fine-grained control over editing behavior
- ✅ You want custom keyboard shortcuts/commands
- ✅ You need better performance with large documents
- ✅ You want to use ProseMirror plugins
- ✅ You're building advanced features BlockNote doesn't support

**Stay with BlockNote if:**
- ✅ Current functionality meets your needs
- ✅ You prioritize development speed over flexibility
- ✅ You don't need low-level control
- ✅ Your team isn't familiar with ProseMirror

### 5.2 Hybrid Approach (Recommended for Gradual Migration)

**Option: Use both temporarily**
1. Keep BlockNote for main editor
2. Use ProseMirror directly for specific features (e.g., advanced math input)
3. Gradually migrate features over time

**Implementation:**
```typescript
// Use ProseMirror for specific use cases
import { EditorView } from 'prosemirror-view';

// For math input, use ProseMirror directly
const mathEditor = new EditorView(/* ... */);

// Main editor still uses BlockNote
const mainEditor = useCreateBlockNote(/* ... */);
```

### 5.3 Best Practices for ProseMirror Migration

1. **Start small:** Migrate one feature at a time
2. **Test thoroughly:** Especially data conversion
3. **Keep BlockNote code:** Don't delete until migration is complete
4. **Use TypeScript:** ProseMirror has excellent TS support
5. **Learn ProseMirror:** Read the official guide, understand transactions
6. **Build abstractions:** Create React hooks to simplify usage

---

## 6. Resources & Next Steps

### 6.1 ProseMirror Learning Resources

1. **Official Documentation:** https://prosemirror.net/docs/
2. **ProseMirror Guide:** https://prosemirror.net/docs/guide/
3. **Example Editor:** https://prosemirror.net/examples/basic/
4. **React Integration Examples:** Search GitHub for "prosemirror-react"

### 6.2 Migration Checklist

- [ ] Understand ProseMirror architecture
- [ ] Set up ProseMirror in development branch
- [ ] Create base schema with standard nodes
- [ ] Build conversion function (BlockNote → ProseMirror)
- [ ] Migrate InlineMath component
- [ ] Migrate CodeBlock component
- [ ] Create React hooks for editor management
- [ ] Replace BlockNote in one editor instance
- [ ] Test thoroughly
- [ ] Migrate remaining editor instances
- [ ] Remove BlockNote dependencies
- [ ] Update documentation

### 6.3 Estimated Timeline

- **Learning ProseMirror:** 1 week
- **Setting up foundation:** 1 week
- **Migrating components:** 2 weeks
- **Testing & refinement:** 1 week
- **Total:** ~5 weeks for full migration

---

## 7. Code Examples: Side-by-Side Comparison

### 7.1 Initialization

**BlockNote (Current):**
```typescript
const editor = useCreateBlockNote({
  schema: customSchema,
  initialContent: page?.content?.blocks,
});

return <BlockNoteView editor={editor} theme={theme} />;
```

**ProseMirror (Proposed):**
```typescript
const { editorRef, editorState, dispatch } = useProseMirror({
  schema: prosemirrorSchema,
  initialContent: convertBlockNoteToProseMirror(page?.content),
  plugins: [history(), keymap(baseKeymap), mathPlugin]
});

return <div ref={editorRef} className="prosemirror-editor" />;
```

### 7.2 Inserting Content

**BlockNote:**
```typescript
editor.insertInlineContent([
  { type: 'inlineMath', props: { latex: 'x^2' } }
]);
```

**ProseMirror:**
```typescript
const mathNode = schema.nodes.mathInline.create({ latex: 'x^2' });
const tr = editorState.tr.replaceSelectionWith(mathNode);
dispatch(tr);
```

### 7.3 Saving Content

**BlockNote:**
```typescript
const blocks = editor.document;
await savePage({ content: { blocks } });
```

**ProseMirror:**
```typescript
const doc = editorState.doc.toJSON();
await savePage({ content: doc });
```

---

## Conclusion

You're currently using BlockNote as a high-level abstraction over ProseMirror. While this provides quick development, it limits your flexibility. Migrating to ProseMirror directly will give you:

1. **Full control** over the editing experience
2. **Better performance** (no conversion overhead)
3. **Access to ProseMirror ecosystem** (plugins, extensions)
4. **Customizability** for advanced features

The migration is **moderately complex** due to your custom components (especially CodeBlock), but it's **definitely feasible** and will give you the flexibility you're looking for.

**Recommendation:** Start with a hybrid approach - use ProseMirror for new features while gradually migrating existing BlockNote code. This reduces risk and allows you to learn ProseMirror incrementally.

