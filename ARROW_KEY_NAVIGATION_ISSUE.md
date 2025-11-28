# Arrow Key Navigation Issue with Inline Math Content

## Problem Summary
When a user backtracks (moves left) with arrow keys after exiting an inline math block, the cursor **skips over** the inline math content instead of entering it for editing. The user wants the cursor to **enter the math block** when backtracking hits it.

## Current Behavior

### User Flow
1. User types `$` to trigger inline math block
2. User types math expression: `x^2 + y^2`
3. User presses `Enter` to exit math block
4. User types plain text: `This is some text`
5. User presses `←` (left arrow) to backtrack
6. **Problem**: Cursor skips over the math block `x^2 + y^2` and jumps to content before it
7. **Expected**: Cursor should enter the math block and switch to edit mode

## Root Cause Analysis

### Why It Happens

1. **BlockNote's Inline Content as Atomic Nodes**
   - BlockNote treats inline content (like our math block) as **atomic/inline nodes**
   - These nodes are rendered as single `<span>` elements with no internal text nodes
   - The browser's native arrow key navigation sees them as **non-navigable** elements

2. **No Text Nodes Inside**
   - The math wrapper `<span>` contains:
     - Either a `<MathLiveDisplay>` component (rendered math)
     - Or a placeholder text
   - There are **no actual text nodes** that the cursor can navigate into
   - The browser treats it as a single "character" and skips over it

3. **BlockNote's Navigation Logic**
   - BlockNote likely uses ProseMirror under the hood
   - ProseMirror's arrow key handling treats inline atomic nodes as single units
   - When moving left, it jumps from the position **after** the node to **before** the node
   - It doesn't provide a way to "enter" the node

4. **Current Implementation**
   - The math wrapper only has an `onClick` handler
   - No keyboard event handlers to intercept arrow keys
   - No mechanism to detect when cursor is adjacent to the math block

### Technical Details

**Current DOM Structure:**
```html
<span class="inline-math-wrapper">
  <!-- MathLiveDisplay renders math as SVG/HTML -->
  <!-- OR placeholder text -->
</span>
```

**BlockNote's View:**
- Sees inline math as a single inline node
- No internal structure for cursor navigation
- Arrow keys move between text nodes, skipping atomic nodes

**Browser's Selection API:**
- `Range.setStartBefore()` / `setStartAfter()` work on element boundaries
- But there's no "inside" position for atomic elements
- Cursor can only be before or after, not inside

---

## Proposed Strategies

### Strategy 1: Intercept Arrow Key Events on Editor Level

**Approach**: Add a global keyboard event listener on the BlockNote editor that detects when the cursor is about to hit an inline math block from the right.

**Implementation**:
```typescript
// In InlineMath.tsx or a wrapper component
useEffect(() => {
  const editorElement = document.querySelector('[contenteditable="true"]');
  if (!editorElement) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle left arrow key
    if (e.key !== 'ArrowLeft') return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const caretNode = range.startContainer;
    const caretOffset = range.startOffset;
    
    // Check if cursor is at the start of a text node
    if (caretNode.nodeType === Node.TEXT_NODE && caretOffset === 0) {
      // Find the previous sibling
      let previousSibling = caretNode.previousSibling;
      
      // Walk up the tree to find previous element
      if (!previousSibling) {
        let parent = caretNode.parentElement;
        while (parent && !previousSibling) {
          previousSibling = parent.previousSibling;
          parent = parent.parentElement;
        }
      }
      
      // Check if previous element is our math wrapper
      if (previousSibling && previousSibling.classList?.contains('inline-math-wrapper')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Enter edit mode
        setIsEditing(true);
      }
    }
  };

  editorElement.addEventListener('keydown', handleKeyDown, true); // Capture phase
  
  return () => {
    editorElement.removeEventListener('keydown', handleKeyDown, true);
  };
}, []);
```

**Pros**:
- Intercepts navigation before BlockNote handles it
- Can prevent default behavior
- Works for all math blocks on the page

**Cons**:
- Requires finding the correct math block instance
- Complex DOM traversal logic
- May interfere with BlockNote's own navigation
- Need to track which math block to edit

---

### Strategy 2: Monitor Selection Changes and Detect Adjacency

**Approach**: Use `Selection` API to monitor cursor position changes and detect when cursor becomes adjacent to a math block.

**Implementation**:
```typescript
useEffect(() => {
  const mathElement = mathWrapperRef.current;
  if (!mathElement) return;

  const checkSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const caretNode = range.startContainer;
    const caretOffset = range.startOffset;
    
    // Check if cursor is immediately after math block
    if (caretNode.nodeType === Node.TEXT_NODE) {
      // Check if math element is the previous sibling
      let node: Node | null = caretNode;
      while (node && node !== mathElement) {
        if (node.previousSibling === mathElement) {
          // Cursor is right after math block
          // Check if user is moving left (would hit math block)
          // This is tricky - we need to track previous position
          break;
        }
        node = node.parentElement;
      }
    }
  };

  document.addEventListener('selectionchange', checkSelection);
  
  return () => {
    document.removeEventListener('selectionchange', checkSelection);
  };
}, []);
```

**Pros**:
- Can detect cursor position relative to math block
- Works with any navigation method (arrow keys, mouse, etc.)

**Cons**:
- `selectionchange` fires frequently (performance concern)
- Hard to detect direction of movement
- Need to track previous position to know if moving left
- Complex logic to determine "about to hit"

---

### Strategy 3: Add Zero-Width Text Node Before Math Block

**Approach**: Insert a zero-width space or text node before the math block that the cursor can land on, then detect when cursor is on that node.

**Implementation**:
```typescript
const InlineMathRenderer = (props) => {
  const markerRef = useRef<Text | null>(null);
  
  useEffect(() => {
    if (!isEditing && mathWrapperRef.current) {
      // Insert zero-width space before math block
      const marker = document.createTextNode('\u200B'); // Zero-width space
      mathWrapperRef.current.parentNode?.insertBefore(marker, mathWrapperRef.current);
      markerRef.current = marker;
      
      // Monitor when cursor is on this marker
      const checkSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        if (range.startContainer === marker && range.startOffset === 0) {
          // Cursor is on the marker - enter edit mode
          setIsEditing(true);
        }
      };
      
      document.addEventListener('selectionchange', checkSelection);
      
      return () => {
        document.removeEventListener('selectionchange', checkSelection);
        marker?.remove();
      };
    }
  }, [isEditing]);
  
  // ... rest of component
};
```

**Pros**:
- Provides a "landing spot" for the cursor
- Can detect when cursor is on the marker
- Works with native browser navigation

**Cons**:
- Modifies DOM structure (may break BlockNote)
- Zero-width space might cause issues
- Need to clean up markers
- May interfere with BlockNote's content model

---

### Strategy 4: Use MutationObserver to Track Cursor Position

**Approach**: Use MutationObserver combined with selection monitoring to detect when cursor moves adjacent to math block.

**Implementation**:
```typescript
useEffect(() => {
  const mathElement = mathWrapperRef.current;
  if (!mathElement || isEditing) return;

  let previousPosition: { node: Node; offset: number } | null = null;

  const trackSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const currentPosition = {
      node: range.startContainer,
      offset: range.startOffset,
    };

    // Check if moving left and about to hit math block
    if (previousPosition) {
      // Determine if moving left (simplified - would need more logic)
      const isMovingLeft = /* complex logic */;
      
      if (isMovingLeft) {
        // Check if math block is next
        const isAdjacentToMath = /* check adjacency */;
        
        if (isAdjacentToMath) {
          setIsEditing(true);
        }
      }
    }

    previousPosition = currentPosition;
  };

  document.addEventListener('selectionchange', trackSelection);
  
  return () => {
    document.removeEventListener('selectionchange', trackSelection);
  };
}, [isEditing]);
```

**Pros**:
- Can track cursor movement direction
- Works with any navigation method

**Cons**:
- Complex logic to determine direction
- Performance concerns with frequent events
- Hard to reliably detect "about to hit"

---

### Strategy 5: Intercept Arrow Key with Capture Phase + Position Check

**Approach**: Use capture phase event listener on document to intercept left arrow key, check if cursor is about to hit math block, and prevent default if so.

**Implementation**:
```typescript
useEffect(() => {
  if (isEditing) return; // Don't intercept when already editing

  const mathElement = mathWrapperRef.current;
  if (!mathElement) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle left arrow
    if (e.key !== 'ArrowLeft' || e.shiftKey || e.ctrlKey || e.metaKey) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Check if cursor is at the start of a text node (or right after math block)
    if (range.collapsed) {
      // Get the position right before math block
      const beforeMath = document.createRange();
      beforeMath.setStartBefore(mathElement);
      beforeMath.collapse(true);
      
      // Check if cursor is at this position
      const cursorAtBeforeMath = 
        range.startContainer === beforeMath.startContainer &&
        range.startOffset === beforeMath.startOffset;
      
      // Or check if cursor is immediately after math block
      const afterMath = document.createRange();
      afterMath.setStartAfter(mathElement);
      afterMath.collapse(true);
      
      const cursorAtAfterMath = 
        range.startContainer === afterMath.startContainer &&
        range.startOffset === afterMath.startOffset;
      
      // If cursor is right after math block and user presses left arrow
      if (cursorAtAfterMath) {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        return;
      }
    }
  };

  // Use capture phase to intercept before BlockNote
  document.addEventListener('keydown', handleKeyDown, true);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
  };
}, [isEditing]);
```

**Pros**:
- Intercepts before BlockNote handles it
- Can prevent default navigation
- Direct check of cursor position
- Works for specific math block instance

**Cons**:
- Need to check position accurately
- May need to handle edge cases
- Could interfere with other navigation

---

### Strategy 6: Make Math Block "Editable" with Zero-Width Content

**Approach**: Add a zero-width text node inside the math wrapper that the cursor can navigate into, then detect when cursor enters it.

**Implementation**:
```typescript
return (
  <span
    ref={mathWrapperRef}
    className="inline-math-wrapper"
    contentEditable={false} // Prevent direct editing
    suppressContentEditableWarning
  >
    {/* Zero-width space that cursor can land on */}
    <span style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>
      {'\u200B'}
    </span>
    {latex.trim() ? (
      <MathLiveDisplay value={latex} />
    ) : (
      <span>math</span>
    )}
  </span>
);
```

Then detect when cursor is on the zero-width space.

**Pros**:
- Provides navigable content
- Cursor can "enter" the element

**Cons**:
- May break BlockNote's content model
- Zero-width content might cause issues
- Complex to detect cursor on invisible content

---

## Recommended Solution: Hybrid Approach

Combine **Strategy 5 (Intercept Arrow Key)** with **Strategy 2 (Selection Monitoring)**:

1. **Primary**: Intercept left arrow key when cursor is immediately after math block
2. **Fallback**: Monitor selection changes to catch edge cases
3. **Detection**: Use Range API to check cursor position relative to math block

**Why This Works**:
- Intercepts navigation before BlockNote handles it
- Direct position checking is reliable
- Fallback catches cases where interception might miss
- Works for each math block instance independently

---

## Implementation Considerations

### Challenges

1. **Multiple Math Blocks**: Need to handle multiple math blocks on the page
   - Each block needs its own event listener
   - Or use a global listener that checks all blocks

2. **Cursor Position Detection**: Accurately detecting "right after math block"
   - Need to handle various DOM structures
   - Account for BlockNote's internal structure

3. **Event Timing**: When to intercept vs when to let BlockNote handle
   - Capture phase vs bubble phase
   - Preventing default at the right time

4. **State Management**: Tracking which math block to edit
   - When multiple blocks exist
   - Ensuring correct block enters edit mode

### Testing Scenarios

- [ ] Single math block in paragraph
- [ ] Multiple math blocks in same paragraph
- [ ] Math block at start of paragraph
- [ ] Math block at end of paragraph
- [ ] Math block in middle of text
- [ ] Backtracking from different positions
- [ ] Forward tracking (should not trigger)
- [ ] With other inline content (links, etc.)
- [ ] With keyboard modifiers (Shift, Ctrl, etc.)

---

## Next Steps

1. **Implement Strategy 5** as primary solution
2. **Add Strategy 2** as fallback
3. **Test thoroughly** with various scenarios
4. **Handle edge cases** (multiple blocks, modifiers, etc.)
5. **Optimize performance** (debounce selection monitoring)

