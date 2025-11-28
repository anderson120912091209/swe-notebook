# @ts-expect-error 未使用錯誤分析

## 🔍 問題診斷

### 錯誤信息
```
Type error: Unused '@ts-expect-error' directive.

  129 |         // @ts-expect-error - KaTeX is loaded dynamically
      |         ^
  130 |         if (window.katex) {
```

### 根本原因

**問題**：`@ts-expect-error` 指令被標記為"未使用"，因為實際上沒有類型錯誤。

**為什麼會這樣？**

1. **類型定義已存在**：
   - 在 `mathy/app/types/window.d.ts` 中已經定義了：
     ```typescript
     declare global {
       interface Window {
         katex: typeof katex;
       }
     }
     ```

2. **TypeScript 現在知道類型**：
   - 因為有了類型定義，`window.katex` 現在有正確的類型
   - TypeScript 不再報告類型錯誤
   - 所以 `@ts-expect-error` 指令變得多餘

3. **@ts-expect-error vs @ts-ignore**：
   - `@ts-expect-error`：期望有錯誤，如果沒有錯誤會報警
   - `@ts-ignore`：忽略錯誤，即使沒有錯誤也不會報警

## 🛠️ 解決方案

### 方案 1: 移除 @ts-expect-error（推薦）

既然類型已經定義，就不需要這個指令了：

```typescript
// ❌ 之前
// @ts-expect-error - KaTeX is loaded dynamically
if (window.katex) {
  // @ts-expect-error - KaTeX is loaded dynamically
  const html = window.katex.renderToString(latex, {
    throwOnError: false,
    displayMode: false,
  });
}

// ✅ 現在
if (window.katex) {
  const html = window.katex.renderToString(latex, {
    throwOnError: false,
    displayMode: false,
  });
}
```

### 方案 2: 改為 @ts-ignore（不推薦）

如果你真的想保留註釋，可以使用 `@ts-ignore`：

```typescript
// @ts-ignore - KaTeX is loaded dynamically
if (window.katex) {
  // ...
}
```

**不推薦的原因**：
- 類型已經正確定義，不需要忽略
- `@ts-ignore` 會隱藏真正的錯誤

### 方案 3: 添加類型檢查（最安全）

如果 KaTeX 可能不存在，添加類型守衛：

```typescript
if (window.katex && typeof window.katex.renderToString === 'function') {
  const html = window.katex.renderToString(latex, {
    throwOnError: false,
    displayMode: false,
  });
}
```

## 📚 深入理解：TypeScript 指令

### @ts-expect-error

**用途**：期望下一行有類型錯誤，如果沒有錯誤會報警。

**使用場景**：
- 你知道有類型錯誤，但暫時無法修復
- 你想確保當類型錯誤修復後，這個指令會被移除

**示例**：
```typescript
// @ts-expect-error - 這個函數還沒有類型定義
someUntypedFunction();

// 如果 someUntypedFunction 後來有了類型定義，
// TypeScript 會報警："Unused '@ts-expect-error' directive"
```

### @ts-ignore

**用途**：忽略下一行的類型錯誤，即使沒有錯誤也不會報警。

**使用場景**：
- 你確定代碼是正確的，但 TypeScript 無法推斷類型
- 你不想被提醒類型錯誤已修復

**示例**：
```typescript
// @ts-ignore - 這個函數還沒有類型定義
someUntypedFunction();

// 即使 someUntypedFunction 後來有了類型定義，
// TypeScript 也不會報警
```

### 何時使用哪個？

| 情況 | 使用 | 原因 |
|------|------|------|
| 暫時的類型問題 | `@ts-expect-error` | 當問題修復後會提醒你移除 |
| 永久的類型問題 | `@ts-ignore` | 不會在問題修復後提醒 |
| 類型已正確定義 | 都不需要 | 直接使用，無需指令 |

## 🔍 檢查類型定義

查看 `mathy/app/types/window.d.ts`：

```typescript
import type katex from 'katex';

declare global {
  interface Window {
    katex: typeof katex;  // ✅ 類型已定義
  }
}
```

這意味著：
- `window.katex` 有正確的類型
- `window.katex.renderToString` 有正確的類型
- 不需要任何類型忽略指令

## ✅ 修復步驟

1. **移除所有 `@ts-expect-error` 指令**（關於 `window.katex`）
2. **驗證類型正確性**：確保代碼仍然編譯通過
3. **檢查其他文件**：確保沒有類似的問題

## 🎯 最佳實踐

1. **優先定義類型**：而不是使用 `@ts-expect-error` 或 `@ts-ignore`
2. **使用 `@ts-expect-error`**：當你期望錯誤會被修復時
3. **避免 `@ts-ignore`**：除非你真的確定類型定義無法修復
4. **定期檢查**：移除不再需要的類型忽略指令

---

**關鍵學習點**：當你添加了類型定義後，之前使用的 `@ts-expect-error` 指令會變成"未使用"，因為 TypeScript 現在知道正確的類型了。這是好事！意味著你的類型定義工作正常。

