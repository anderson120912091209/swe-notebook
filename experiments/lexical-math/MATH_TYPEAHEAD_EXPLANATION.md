# MathTypeaheadPlugin 完全解析 🎓

## 📖 整體概念：這是一個「智能提示插件」

想像你在用 ChatGPT 或 Google 搜尋，你打幾個字就會跳出建議選單對吧？這個插件做的就是同樣的事情，但是針對數學符號。

---

## 🎯 一個完整的流程範例

讓我用一個實際例子帶你走一遍：

### 場景：用戶想輸入「積分符號 (∫)」

1. **用戶打字**：在編輯器裡輸入 `"int"`
2. **插件偵測**：`checkForMathTrigger` 發現 "int" 是數學關鍵字
3. **顯示選單**：跳出下拉選單，顯示相關選項
4. **用戶選擇**：點選 "Integral (int)"
5. **執行動作**：`onSelectOption` 被觸發
6. **插入節點**：透過 `dispatchCommand` 告訴編輯器「我要插入積分符號」

---

## 🧩 程式碼結構拆解

### 1️⃣ **MATH_OPTIONS（第 30-45 行）** - 預設選單選項

```typescript
const MATH_OPTIONS = [
    new MathOption('Summation (sum)', 'sum'),  // 顯示：求和符號
    new MathOption('Integral (int)', 'int'),   // 顯示：積分符號
    // ... 更多選項
];
```

**理解方式**：
- 這就是你的「選單資料庫」
- 像是餐廳的菜單，列出了所有可以點的菜
- `title` = 給用戶看的名字（例如："Summation (sum)"）
- `key` = 程式內部用的代號（例如："sum"）

---

### 2️⃣ **checkForMathTrigger（第 59-119 行）** - 「偵測員」

這個函數的工作是：**隨時監聽用戶輸入，看看有沒有觸發關鍵字**

```typescript
const checkForMathTrigger = useCallback((text: string) => {
    // 1. 取得用戶輸入的最後一個單字
    //    例如："hello sum" → 取得 "sum"
    const lastWord = ...
    
    // 2. 檢查這個單字是不是數學關鍵字
    //    MATH_KEYWORDS = ['sum', 'int', 'frac', ...]
    const hasMatch = MATH_KEYWORDS.some(keyword => {
        // 完全匹配 或 部分匹配（用戶還在打字）
    });
    
    // 3. 如果匹配，告訴 Lexical：「嘿！該顯示選單了！」
    if (hasMatch) {
        return {
            leadOffset: ...,      // 選單要顯示在哪個位置
            matchingString: ...,  // 匹配到的文字
            replaceableString: ... // 要替換掉的文字
        };
    }
    
    return null; // 沒匹配到，不顯示選單
}, []);
```

**理解方式**：
- 像一個「警衛」，每當用戶打字就檢查一次
- 如果看到關鍵字（如 "sum", "int"），就舉手說：「有情況！」
- 回傳的物件告訴 Lexical：「在這裡顯示選單，替換這段文字」

**實際例子**：
```
用戶輸入："I want to calculate sum"
                  ↑
           最後一個字是 "sum"
           
checkForMathTrigger 執行：
→ 發現 "sum" 在 MATH_KEYWORDS 裡
→ 回傳 { leadOffset: 22, matchingString: "sum", ... }
→ Lexical 收到後，在第 22 個字元位置顯示選單
```

---

### 3️⃣ **options（第 121-162 行）** - 「篩選員」

這個函數的工作是：**根據用戶輸入，篩選並排序選單選項**

```typescript
const options = useMemo(() => {
    if (!queryString) {
        // 沒有輸入任何東西 → 顯示全部選項
        return MATH_OPTIONS;
    }
    
    const query = queryString.toLowerCase(); // "sUm" → "sum"
    
    // 第一步：過濾（filter）
    return MATH_OPTIONS
        .filter((option) => {
            // 精確匹配 → 最優先
            if (keyLower === query) return true;
            
            // 標題包含查詢 → 第二優先
            if (titleLower.includes(query)) return true;
            
            // 關鍵字開頭匹配 → 第三優先
            if (keyLower.startsWith(query)) return true;
            
            // 包含查詢 → 第四優先
            if (keyLower.includes(query)) return true;
        })
        // 第二步：排序（sort）
        .sort((a, b) => {
            // 精確匹配的排最前面
            // 然後是開頭匹配的
            // 最後按字母順序
        });
}, [queryString]);
```

**理解方式**：
- 像是「圖書館員」，你告訴他關鍵字，他幫你找相關的書
- `filter` = 移除不相關的選項
- `sort` = 把最相關的排在最前面

**實際例子**：
```
用戶輸入："s"（只打了一個 s）

options 執行：
→ 過濾：找到所有 key 或 title 包含 "s" 的
  - "sum" (key 開頭是 s) ✓
  - "sqrt" (key 開頭是 s) ✓
  - "sigma" (key 開頭是 s) ✓
  - "omega" (key 不包含 s) ✗

→ 排序：按字母順序
  1. sigma
  2. sqrt  
  3. sum

顯示的選單：
  • Sigma (sigma)
  • Square Root (sqrt)
  • Summation (sum)
```

---

### 4️⃣ **onSelectOption（第 164-197 行）** - 「執行員」

這個函數的工作是：**當用戶選擇選單項目後，執行插入動作**

```typescript
const onSelectOption = useCallback((
    selectedOption: MathOption,    // 用戶選了哪個選項
    nodeToReplace: TextNode | null, // 要替換掉的文字節點
    closeMenu: () => void          // 關閉選單的函數
) => {
    editor.update(() => {  // 進入編輯器的「更新模式」
        // 1. 移除用戶剛才打的關鍵字（如 "sum"）
        if (nodeToReplace) {
            nodeToReplace.remove();
        }
        
        // 2. 檢查是不是希臘字母
        const greekMap = {
            alpha: 'α',
            beta: 'β',
            // ...
        };
        
        if (greekMap[selectedOption.key]) {
            // 是希臘字母 → 直接插入文字節點
            const textNode = new TextNode(greekMap[selectedOption.key]);
            $insertNodes([textNode]);
        } else {
            // 不是希臘字母 → 發送指令，插入數學節點
            editor.dispatchCommand(
                INSERT_MATH_COMMAND,  // 指令名稱
                selectedOption.key    // 參數：'sum', 'int', 'frac' 等
            );
        }
        
        // 3. 關閉選單
        closeMenu();
    });
}, [editor]);
```

**理解方式**：
- 這是「實際動手的工人」
- `editor.update()` = 進入編輯器的「編輯模式」，可以修改內容
- `nodeToReplace.remove()` = 把用戶剛才打的關鍵字刪掉（因為要被數學符號取代）
- `dispatchCommand` = 告訴編輯器：「我要插入一個數學符號！」

**兩個分支的差異**：

```
情況 1：用戶選了 "Alpha (alpha)"
→ greekMap['alpha'] 存在 → 'α'
→ 直接插入文字 'α'（簡單！）

情況 2：用戶選了 "Summation (sum)"
→ greekMap['sum'] 不存在
→ 發送 INSERT_MATH_COMMAND 指令
→ MathPlugin 收到指令，創建 MathNode（複雜的數學節點）
→ 插入 MathNode
```

為什麼要分兩種情況？
- **希臘字母** = 只是一個符號，用 `TextNode` 就夠了（簡單）
- **數學運算** = 需要複雜的結構（如分數有分子分母），用 `MathNode`（複雜）

---

### 5️⃣ **return（第 199-244 行）** - 「渲染員」

這部分負責：**實際畫出選單的 UI**

```typescript
return (
    <LexicalTypeaheadMenuPlugin<MathOption>
        onQueryChange={setQueryString}  // 當用戶輸入改變時
        onSelectOption={onSelectOption}  // 當用戶選擇時
        triggerFn={checkForMathTrigger}  // 用來判斷要不要顯示選單
        options={options}                // 要顯示的選項列表
        menuRenderFn={(...) => {         // 如何畫出選單
            return ReactDOM.createPortal(
                <div className="...">
                    <ul>
                        {options.map((option, i) => (
                            <li onClick={...}>
                                {option.title}
                            </li>
                        ))}
                    </ul>
                </div>,
                anchorElementRef.current  // 選單要顯示在哪個位置
            );
        }}
    />
);
```

**理解方式**：
- `LexicalTypeaheadMenuPlugin` = Lexical 提供的「選單外框」
- `menuRenderFn` = 你定義「選單長什麼樣子」
- `ReactDOM.createPortal` = 把選單「傳送到」指定位置顯示

**為什麼用 Portal？**
- 選單可能需要顯示在編輯器的任何位置
- Portal 可以讓選單「跳脫」原本的 DOM 層級，顯示在最上層
- 這樣就不會被其他元素的 z-index 或 overflow 影響

---

## 🔄 完整流程圖

```
用戶打字 "sum"
    ↓
checkForMathTrigger 偵測到關鍵字
    ↓
回傳 { leadOffset: X, matchingString: "sum" }
    ↓
Lexical 知道要在位置 X 顯示選單
    ↓
options 函數篩選相關選項
    ↓
menuRenderFn 畫出選單 UI
    ↓
用戶點選 "Summation (sum)"
    ↓
onSelectOption 被觸發
    ↓
刪除 "sum" 文字
    ↓
dispatchCommand(INSERT_MATH_COMMAND, 'sum')
    ↓
MathPlugin 收到指令，插入 MathNode
    ↓
選單關閉，完成！
```

---

## 💡 關鍵設計概念

### 1. **關注點分離（Separation of Concerns）**

- `MathTypeaheadPlugin` = 負責「偵測」和「顯示選單」
- `MathPlugin` = 負責「定義指令」和「插入節點」
- 各司其職，不會混在一起

### 2. **使用 `useCallback` 和 `useMemo` 的原因**

```typescript
const checkForMathTrigger = useCallback(...)
const options = useMemo(...)
const onSelectOption = useCallback(...)
```

**為什麼？**
- 避免不必要的重新計算
- `useCallback` = 函數不會每次渲染都重新創建
- `useMemo` = 只有 `queryString` 改變時才重新計算選項
- 效能優化！

### 3. **為什麼用 `editor.update()`？**

Lexical 的編輯器是「不可變（immutable）」的，你不能直接修改：
```typescript
// ❌ 錯誤：不能直接改
editor.someProperty = newValue;

// ✅ 正確：必須在 update 裡面改
editor.update(() => {
    // 這裡才能修改編輯器內容
});
```

這確保了：
- 所有修改都有紀錄（可以 undo/redo）
- 狀態一致性
- 避免競態條件（race condition）

---

## 🎓 學習重點總結

1. **Typeahead = 自動完成功能**：監聽輸入，顯示建議
2. **觸發機制**：`checkForMathTrigger` 判斷是否顯示選單
3. **選項過濾**：`options` 根據輸入過濾和排序
4. **執行插入**：`onSelectOption` 處理用戶選擇
5. **指令系統**：用 `dispatchCommand` 來溝通不同插件

---

## 🚀 如果想擴展功能

### 加入新的數學符號：

1. 在 `MATH_OPTIONS` 新增：
```typescript
new MathOption('Limit (lim)', 'lim'),
```

2. 在 `MATH_KEYWORDS` 新增：
```typescript
'lim'
```

3. 在 `MathNode.tsx` 的 `MathSymbolType` 新增：
```typescript
type MathSymbolType = 'sum' | 'int' | ... | 'lim';
```

完成！選單就會自動包含新符號了。

---

希望這樣解釋清楚了！有任何問題隨時問我 👍
