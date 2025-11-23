# Math Node UI Design Guide 🎨

## 📐 How to Design UI and Position Nested Editors for Math Types

This guide explains how to design the layout and positioning of nested editors for different math types, using **summation (Σ)** as the primary example.

---

## 🏗️ Current Structure: Summation Node

### Visual Layout
```
┌─────────────────────────────────────┐
│  [upperLimit]  ← Small editor (top) │
│       Σ        ← Symbol (center)    │
│  [lowerLimit]  ← Small editor (bot) │
│  [operand]     ← Main editor (right)│
└─────────────────────────────────────┘
```

### Current Code (Lines 209-226)
```typescript
{mathType === 'sum' && (
    <div className="flex flex-col items-center mr-1">
        <NestedEditor
            initialEditor={upperLimit}
            className="text-xs mb-0.5 text-center"
            placeholder=" "
            nextEditor={operand}
        />
        <span className="text-2xl leading-none">Σ</span>
        <NestedEditor
            initialEditor={lowerLimit}
            className="text-xs mx-2 text-center"
            placeholder=" "
            nextEditor={upperLimit}
        />
    </div>
)}
{(mathType === 'sum' || mathType === 'int') && (
    <NestedEditor
        initialEditor={operand}
        className="text-base ml-1"
        placeholder="Expression"
    />
)}
```

---

## 🎯 Design Principles

### 1. **Mathematical Convention**
Follow standard mathematical notation:
- **Summation**: Limits above/below, expression to the right
- **Integral**: Bounds above/below, integrand to the right
- **Fraction**: Numerator above, denominator below
- **Square Root**: Symbol on left, expression under the radical

### 2. **Visual Hierarchy**
- **Symbol size**: Large enough to be recognizable (text-2xl to text-3xl)
- **Editor sizes**: Limits are smaller (text-xs), operands are normal (text-base)
- **Spacing**: Use margin/padding to create clear separation

### 3. **Alignment**
- Use Flexbox (`flex`, `flex-col`, `items-center`, `justify-center`)
- Align symbols vertically centered with their limits
- Keep operands aligned with the symbol's baseline

---

## 🛠️ Customization Options

### Option 1: **Vertical Stack (Current - Standard)**
```typescript
{mathType === 'sum' && (
    <div className="flex flex-col items-center mr-1">
        {/* Upper limit */}
        <NestedEditor
            initialEditor={upperLimit}
            className="text-xs mb-0.5 text-center"
            placeholder="n"
        />
        {/* Symbol */}
        <span className="text-2xl leading-none">Σ</span>
        {/* Lower limit */}
        <NestedEditor
            initialEditor={lowerLimit}
            className="text-xs mt-0.5 text-center"
            placeholder="i=0"
        />
    </div>
)}
{/* Operand to the right */}
<NestedEditor
    initialEditor={operand}
    className="text-base ml-1"
    placeholder="x_i"
/>
```

**Layout:**
```
    n
    Σ
  i=0  [x_i]
```

---

### Option 2: **Compact Inline (Space-Saving)**
```typescript
{mathType === 'sum' && (
    <div className="flex items-baseline mr-1">
        {/* Stack limits on left */}
        <div className="flex flex-col justify-center mr-1">
            <NestedEditor
                initialEditor={upperLimit}
                className="text-[10px] mb-0 leading-none"
                placeholder="n"
            />
            <NestedEditor
                initialEditor={lowerLimit}
                className="text-[10px] mt-0 leading-none"
                placeholder="i=0"
            />
        </div>
        {/* Symbol */}
        <span className="text-xl leading-none">Σ</span>
        {/* Operand */}
        <NestedEditor
            initialEditor={operand}
            className="text-base ml-1"
            placeholder="x_i"
        />
    </div>
)}
```

**Layout:**
```
n    Σ [x_i]
i=0
```

---

### Option 3: **Professional Math Notation (LaTeX-style)**
```typescript
{mathType === 'sum' && (
    <div className="inline-flex items-baseline mr-1">
        {/* Limits positioned absolutely */}
        <div className="relative inline-block">
            {/* Upper limit - positioned above */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <NestedEditor
                    initialEditor={upperLimit}
                    className="text-[9px] leading-none min-w-[8px]"
                    placeholder="n"
                />
            </div>
            {/* Symbol */}
            <span className="text-2xl leading-none relative">Σ</span>
            {/* Lower limit - positioned below */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <NestedEditor
                    initialEditor={lowerLimit}
                    className="text-[9px] leading-none min-w-[8px]"
                    placeholder="i=0"
                />
            </div>
        </div>
        {/* Operand */}
        <NestedEditor
            initialEditor={operand}
            className="text-base ml-2"
            placeholder="x_i"
        />
    </div>
)}
```

**Layout:**
```
    n
    Σ  [x_i]
  i=0
```

---

### Option 4: **Modern Minimalist (Clean Borders)**
```typescript
{mathType === 'sum' && (
    <div className="inline-flex items-center gap-1 mr-1">
        {/* Limits in a compact box */}
        <div className="flex flex-col items-center border border-gray-600 rounded px-1 py-0.5">
            <NestedEditor
                initialEditor={upperLimit}
                className="text-[10px] leading-tight min-w-[12px]"
                placeholder="n"
            />
            <div className="w-full h-px bg-gray-600 my-0.5"></div>
            <NestedEditor
                initialEditor={lowerLimit}
                className="text-[10px] leading-tight min-w-[12px]"
                placeholder="i=0"
            />
        </div>
        {/* Symbol */}
        <span className="text-2xl">Σ</span>
        {/* Operand */}
        <NestedEditor
            initialEditor={operand}
            className="text-base"
            placeholder="x_i"
        />
    </div>
)}
```

**Layout:**
```
┌─┐
│n│ Σ [x_i]
│─│
│i│
└─┘
```

---

## 📏 Key CSS Classes for Positioning

### Flexbox Layouts
```typescript
// Vertical stack
className="flex flex-col items-center"

// Horizontal row
className="flex items-center"

// Baseline alignment (for inline math)
className="flex items-baseline"

// Centered content
className="flex items-center justify-center"
```

### Spacing
```typescript
// Margin between elements
className="mr-1"  // margin-right
className="ml-1"  // margin-left
className="mb-0.5" // margin-bottom
className="mt-0.5" // margin-top

// Gap (modern approach)
className="gap-1"  // gap between flex children
```

### Text Sizing
```typescript
className="text-xs"      // 12px - for limits
className="text-sm"       // 14px - for small text
className="text-base"     // 16px - for operands
className="text-xl"       // 20px - for medium symbols
className="text-2xl"      // 24px - for large symbols
className="text-3xl"      // 30px - for very large symbols
```

### Positioning
```typescript
// Absolute positioning (for precise placement)
className="absolute -top-3 left-1/2 -translate-x-1/2"

// Relative positioning (for containing absolute children)
className="relative"
```

---

## 🎨 Styling Nested Editors

### Border Styles
```typescript
// Dotted border (current)
className="border border-dotted border-gray-700"

// Solid border
className="border border-solid border-gray-600"

// No border (clean look)
className="border-0"

// Rounded corners
className="rounded-md"
```

### Size Constraints
```typescript
// Minimum width/height
className="min-w-[20px] min-h-[20px]"

// Maximum width
className="max-w-[100px]"

// Fixed width
className="w-12"
```

---

## 🔄 Navigation Flow

The `nextEditor` prop controls tab/enter navigation:

```typescript
<NestedEditor
    initialEditor={lowerLimit}
    nextEditor={upperLimit}  // Tab/Enter → goes to upperLimit
/>
<NestedEditor
    initialEditor={upperLimit}
    nextEditor={operand}     // Tab/Enter → goes to operand
/>
<NestedEditor
    initialEditor={operand}
    // No nextEditor → Tab/Enter exits math node
/>
```

**Recommended flow for sum:**
1. `lowerLimit` → `upperLimit` → `operand` → exit
2. Or: `upperLimit` → `lowerLimit` → `operand` → exit

---

## 💡 Design Examples for Other Math Types

### Integral (∫)
```typescript
{mathType === 'int' && (
    <div className="flex items-center mr-1">
        {/* Symbol */}
        <span className="text-3xl italic">∫</span>
        {/* Bounds stacked to the right */}
        <div className="flex flex-col -ml-2">
            <NestedEditor
                initialEditor={upperLimit}
                className="text-xs mb-2"
                placeholder="b"
            />
            <NestedEditor
                initialEditor={lowerLimit}
                className="text-xs mt-2"
                placeholder="a"
            />
        </div>
        {/* Integrand */}
        <NestedEditor
            initialEditor={operand}
            className="text-base ml-1"
            placeholder="f(x) dx"
        />
    </div>
)}
```

### Fraction
```typescript
{mathType === 'frac' && (
    <div className="flex flex-col items-center mx-1">
        {/* Numerator */}
        <NestedEditor
            initialEditor={upperLimit}
            className="text-sm text-center border-b border-gray-400 px-1"
            placeholder="num"
        />
        {/* Denominator */}
        <NestedEditor
            initialEditor={lowerLimit}
            className="text-sm text-center px-1"
            placeholder="den"
        />
    </div>
)}
```

### Square Root
```typescript
{mathType === 'sqrt' && (
    <div className="flex items-center mx-1">
        {/* Symbol */}
        <span className="text-2xl">√</span>
        {/* Expression with overline */}
        <div className="border-t border-gray-400 pt-0.5 px-1">
            <NestedEditor
                initialEditor={operand}
                className="text-base"
                placeholder="x"
            />
        </div>
    </div>
)}
```

---

## 🚀 Advanced: Responsive & Dynamic Sizing

### Dynamic Symbol Size Based on Content
```typescript
const symbolSize = useMemo(() => {
    // Make symbol larger if limits are long
    const upperText = getEditorText(upperLimit);
    const lowerText = getEditorText(lowerLimit);
    const maxLength = Math.max(upperText.length, lowerText.length);
    
    if (maxLength > 5) return 'text-3xl';
    if (maxLength > 3) return 'text-2xl';
    return 'text-xl';
}, [upperLimit, lowerLimit]);

<span className={`${symbolSize} leading-none`}>Σ</span>
```

### Adaptive Spacing
```typescript
const spacing = useMemo(() => {
    const hasUpper = getEditorText(upperLimit).length > 0;
    const hasLower = getEditorText(lowerLimit).length > 0;
    
    if (hasUpper && hasLower) return 'mb-1 mt-1';
    if (hasUpper) return 'mb-1';
    if (hasLower) return 'mt-1';
    return 'mb-0.5 mt-0.5';
}, [upperLimit, lowerLimit]);
```

---

## ✅ Best Practices

1. **Consistency**: Use similar patterns across math types
2. **Accessibility**: Ensure editors are large enough to click (min 20px)
3. **Visual Feedback**: Show borders when editing, hide when not
4. **Responsive**: Test with different content lengths
5. **Mathematical Accuracy**: Follow standard notation conventions
6. **User Experience**: Logical navigation flow (top → bottom → right)

---

## 🎯 Quick Reference: Sum Layout Options

| Style | Code Pattern | Use Case |
|-------|-------------|----------|
| **Standard** | `flex-col items-center` | Most common, readable |
| **Compact** | `flex items-baseline` | Space-constrained |
| **Professional** | `absolute` positioning | LaTeX-style precision |
| **Minimalist** | Bordered box | Modern UI |

Choose based on your design goals! 🎨


