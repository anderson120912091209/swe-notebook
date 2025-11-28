# MathfieldElement 類型錯誤分析

## 🔍 問題診斷

### 錯誤信息
```
Type error: Interface 'MathfieldElement' incorrectly extends interface 'HTMLElement'.
  Types of property 'blur' are incompatible.
    Type '(() => void) | undefined' is not assignable to type '() => void'.
      Type 'undefined' is not assignable to type '() => void'.
```

### 根本原因

**問題代碼**：
```typescript
interface MathfieldElement extends HTMLElement {
  value: string;
  readOnly?: boolean;
  focus?: () => void;  // ❌ 問題：HTMLElement 已經有 focus()，且是必需的
  blur?: () => void;   // ❌ 問題：HTMLElement 已經有 blur()，且是必需的
}
```

**為什麼會出錯？**

1. **HTMLElement 基類**：
   - `HTMLElement` 已經定義了 `focus(): void` 和 `blur(): void`
   - 這些方法是**必需的**（不是可選的）

2. **接口擴展規則**：
   - 當你擴展一個接口時，你不能將基類的**必需方法**重新定義為**可選方法**
   - TypeScript 不允許這種"放寬"約束

3. **類型不兼容**：
   - 基類：`blur(): void`（必需）
   - 子類：`blur?: () => void`（可選，可能是 `undefined`）
   - `undefined` 不能賦值給 `() => void`

## 🛠️ 解決方案

### 方案 1: 移除重複定義（推薦）

既然 `HTMLElement` 已經有 `focus()` 和 `blur()`，就不需要重新定義：

```typescript
interface MathfieldElement extends HTMLElement {
  value: string;
  readOnly?: boolean;
  // 移除 focus? 和 blur?，因為 HTMLElement 已經有這些方法
}
```

### 方案 2: 使用 Omit 排除基類方法

如果你想明確表示這些方法存在，可以使用 `Omit`：

```typescript
interface MathfieldElement extends Omit<HTMLElement, 'focus' | 'blur'> {
  value: string;
  readOnly?: boolean;
  focus: () => void;  // 明確定義為必需
  blur: () => void;   // 明確定義為必需
}
```

### 方案 3: 不擴展 HTMLElement（不推薦）

```typescript
interface MathfieldElement {
  value: string;
  readOnly?: boolean;
  focus?: () => void;
  blur?: () => void;
  // 需要手動添加所有 HTMLElement 的屬性和方法
}
```

## 📚 深入理解：TypeScript 接口擴展規則

### 規則 1: 不能放寬約束

```typescript
// ❌ 錯誤：不能將必需方法改為可選
interface Base {
  method(): void;  // 必需
}

interface Derived extends Base {
  method?(): void;  // 可選 - 錯誤！
}
```

### 規則 2: 可以收緊約束

```typescript
// ✅ 正確：可以將可選方法改為必需
interface Base {
  method?(): void;  // 可選
}

interface Derived extends Base {
  method(): void;  // 必需 - 正確！
}
```

### 規則 3: 可以覆蓋為更具體的類型

```typescript
// ✅ 正確：可以覆蓋為更具體的返回類型
interface Base {
  getValue(): string;
}

interface Derived extends Base {
  getValue(): 'specific-string';  // 更具體 - 正確！
}
```

## 🔍 檢查實際的 MathfieldElement

從代碼庫搜索結果：

1. **MathLive 源代碼** (`mathlive/src/public/mathfield-element.ts`):
   ```typescript
   export class MathfieldElement extends HTMLElement {
     focus(): void { ... }  // 必需
     blur(): void { ... }   // 必需
   }
   ```

2. **類型定義文件** (`mathy/app/types/mathfield.d.ts`):
   ```typescript
   declare class MathfieldElement extends HTMLElement {
     focus(): void;  // 必需
     blur(): void;   // 必需
   }
   ```

**結論**：`focus()` 和 `blur()` 在實際實現中都是**必需的**，不應該定義為可選。

## ✅ 修復步驟

1. **移除 `focus?` 和 `blur?`** 從 `MathLiveDisplay.tsx`
2. **檢查 `MathLiveInput.tsx`** 是否有同樣的問題
3. **確保一致性**：所有 `MathfieldElement` 的定義都應該一致

## 🎯 最佳實踐

1. **不要重複定義基類已有的方法**，除非：
   - 需要改變方法簽名
   - 需要添加額外的類型約束

2. **使用 `Omit` 當你需要排除某些基類成員**：
   ```typescript
   interface MyElement extends Omit<HTMLElement, 'someMethod'> {
     someMethod: () => string;  // 不同的返回類型
   }
   ```

3. **檢查實際實現**：確保類型定義與實際代碼一致

---

**關鍵學習點**：在 TypeScript 中，當擴展接口時，不能將基類的必需方法重新定義為可選方法。這違反了里氏替換原則（Liskov Substitution Principle）。

