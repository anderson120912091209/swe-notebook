# 筆記保存系統完整分析 (End-to-End Note Saving System Analysis)

## 📋 目錄 (Table of Contents)

1. [UI/編輯器層](#1-uieditor-layer)
2. [狀態管理](#2-state-management)
3. [保存觸發機制](#3-save-trigger-mechanism)
4. [網絡請求層](#4-network-layer)
5. [後端處理](#5-backend-processing)
6. [數據庫層](#6-database-layer)
7. [衝突解決與並發](#7-conflict-resolution)
8. [自動保存 vs 手動保存](#8-autosave-vs-manual-save)
9. [離線持久化](#9-offline-persistence)
10. [擴展點與修改指南](#10-extension-points)

---

## 1. UI/編輯器層 (UI/Editor Layer)

### 主要組件

**文件位置：**
- `mathy/app/components/workspace components/Pages/PageEditor.tsx` (全頁面編輯器)
- `mathy/app/components/workspace components/Pages/PageEditorModal.tsx` (模態編輯器)

### 編輯器實現

**使用的編輯器框架：** BlockNote (基於 ProseMirror)

```typescript
// PageEditor.tsx, line 189-192
const editor = useCreateBlockNote({
  schema: customSchema,
  initialContent: getInitialContent(),
});
```

**關鍵代碼：**
```typescript
// PageEditor.tsx, line 417-431
<BlockNoteView
  editor={editor}
  theme={theme}
  onChange={handleContentChange}  // ← 保存觸發點
  className="..."
>
```

### 編輯器狀態存儲

**狀態管理方式：** 
- **本地組件狀態**：BlockNote 編輯器內部管理文檔狀態
- **React Context**：通過 `WorkspaceContext` 管理頁面元數據（title, folder_id 等）
- **React Query**：管理服務器狀態和緩存

**狀態層次：**
1. **BlockNote 內部狀態** (`editor.document`) - 編輯器當前內容
2. **組件本地狀態** (`useState`) - UI 狀態（isSaving, title）
3. **Context 狀態** (`WorkspaceContext`) - 頁面列表、當前頁面
4. **React Query 緩存** - 服務器數據緩存

---

## 2. 狀態管理 (State Management)

### 狀態管理架構

**主要技術棧：**
- **React Context API** (`WorkspaceContext.tsx`)
- **React Query (TanStack Query)** - 服務器狀態管理
- **本地 useState** - 組件級 UI 狀態

**文件位置：**
- `mathy/app/contexts/WorkspaceContext.tsx` (主狀態管理)
- `mathy/app/lib/react-query/QueryProvider.tsx` (React Query 配置)

### React Query 配置

```typescript
// QueryProvider.tsx, line 11-32
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,        // 2分鐘內數據被認為是新鮮的
      gcTime: 5 * 60 * 1000,            // 5分鐘後垃圾回收
      retry: 1,                         // 失敗重試1次
      refetchOnWindowFocus: false,      // 窗口聚焦時不自動刷新
      refetchOnMount: true,             // 掛載時僅在數據過期時刷新
      refetchOnReconnect: false,        // 重連時僅在數據過期時刷新
    },
    mutations: {
      retry: 1,                         // 變更操作失敗重試1次
    },
  },
})
```

### 樂觀更新 (Optimistic Updates)

**文件：** `WorkspaceContext.tsx`, line 354-391

```typescript
const updatePageMutation = useMutation({
  mutationFn: ({ pageId, updates }) => workspaceAPI.updatePage(pageId, updates),
  onMutate: async ({ pageId, updates }) => {
    // 1. 標記為編輯中，暫停實時更新
    setIsEditing(true);
    
    // 2. 取消正在進行的查詢
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.pages(user!.id) });
    
    // 3. 保存之前的狀態（用於錯誤回滾）
    const previousPages = queryClient.getQueryData<Page[]>(QUERY_KEYS.pages(user!.id));
    
    // 4. 樂觀更新本地緩存
    queryClient.setQueryData<Page[]>(
      QUERY_KEYS.pages(user!.id),
      (old = []) => old.map(p => p.id === pageId ? { ...p, ...updates } : p)
    );
    
    return { previousPages };
  },
  onError: (err, variables, context) => {
    // 錯誤時回滾到之前的狀態
    if (context?.previousPages) {
      queryClient.setQueryData(QUERY_KEYS.pages(user!.id), context.previousPages);
    }
  },
  onSettled: () => {
    // 2秒後恢復實時更新
    editingTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 2000);
  },
});
```

---

## 3. 保存觸發機制 (Save Trigger Mechanism)

### 內容保存觸發

**文件：** `PageEditor.tsx`, line 195-231

**觸發方式：** **防抖 (Debounce)** - 用戶停止輸入 1 秒後自動保存

```typescript
// Auto-save content with debouncing
const handleContentChange = useCallback(async () => {
  if (!page) return;
  
  try {
    const blocks = editor.document;  // ← 獲取 BlockNote 文檔
    
    // 驗證 blocks 結構
    if (!blocks || !Array.isArray(blocks)) {
      console.warn('Invalid blocks structure, skipping save');
      return;
    }
    
    const content = { blocks };  // 包裝為數據庫格式
    
    // 清除之前的定時器
    if (contentSaveTimerRef.current) {
      clearTimeout(contentSaveTimerRef.current);
    }
    
    setIsSaving(true);
    
    // 設置新定時器：1秒無輸入後保存
    contentSaveTimerRef.current = setTimeout(async () => {
      try {
        await updatePage(pageId, { content });
      } catch (error) {
        console.error('Failed to save content:', error);
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 1000);  // ← 防抖時間：1000ms
  } catch (error) {
    console.error('Error in handleContentChange:', error);
    setIsSaving(false);
  }
}, [editor, page, pageId, updatePage]);
```

**觸發流程：**
```
用戶輸入
  ↓
BlockNote onChange 事件
  ↓
handleContentChange() 被調用
  ↓
清除舊定時器
  ↓
設置新定時器（1秒後執行）
  ↓
[如果用戶繼續輸入，重複上述步驟]
  ↓
1秒無輸入後
  ↓
執行保存
```

### 標題保存觸發

**文件：** `PageEditor.tsx`, line 233-252

**觸發方式：** **防抖 (Debounce)** - 用戶停止輸入 500ms 後自動保存

```typescript
const handleTitleChange = useCallback(async (newTitle: string) => {
  setTitle(newTitle);
  
  if (!page) return;
  
  // 清除之前的定時器
  if (titleSaveTimerRef.current) {
    clearTimeout(titleSaveTimerRef.current);
  }
  
  // 設置新定時器：500ms 無輸入後保存
  titleSaveTimerRef.current = setTimeout(async () => {
    try {
      await updatePage(pageId, { title: newTitle });
    } catch (error) {
      console.error('Failed to save title:', error);
    }
  }, 500);  // ← 防抖時間：500ms（比內容保存更快）
}, [page, pageId, updatePage]);
```

### 保存狀態指示

**文件：** `PageEditor.tsx`, line 320-328

```typescript
const rightHeaderContent = (
  <>
    {isSaving && (
      <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
        Saving...
      </span>
    )}
  </>
);
```

---

## 4. 網絡請求層 (Network Layer)

### API 函數

**文件位置：** `mathy/app/lib/api/workspace.ts`

**主要函數：** `updatePage()`

```typescript
// workspace.ts, line 160-173
export async function updatePage(
  pageId: string,
  updates: Partial<Omit<Page, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Page> {
  const { data, error } = await supabase
    .from('notebooks')           // ← 表名
    .update(updates)             // ← 更新操作
    .eq('id', pageId)            // ← WHERE 條件
    .select()                     // ← 返回更新後的數據
    .single();                   // ← 返回單條記錄

  if (error) throw error;
  return data;
}
```

### HTTP 請求詳情

**使用的技術：** Supabase Client (基於 PostgREST)

**HTTP 方法：** `PATCH` (通過 Supabase `.update()`)

**端點：** 
- Supabase REST API: `{SUPABASE_URL}/rest/v1/notebooks?id=eq.{pageId}`
- 實際上是 Supabase 自動生成的 RESTful API

**請求頭：**
```
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/json
apikey: {SUPABASE_ANON_KEY}
Prefer: return=representation
```

**請求體格式：**
```json
{
  "content": {
    "blocks": [
      {
        "id": "block-id",
        "type": "paragraph",
        "content": "..."
      }
    ]
  },
  "title": "Page Title"  // 可選，僅在更新標題時包含
}
```

### Supabase 客戶端配置

**文件：** `mathy/app/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 錯誤處理

**錯誤處理策略：**

1. **API 層錯誤處理：**
```typescript
// workspace.ts
if (error) throw error;  // 直接拋出錯誤
```

2. **組件層錯誤處理：**
```typescript
// PageEditor.tsx
try {
  await updatePage(pageId, { content });
} catch (error) {
  console.error('Failed to save content:', error);
  // 錯誤被記錄，但不阻止用戶繼續編輯
}
```

3. **React Query 錯誤處理：**
```typescript
// WorkspaceContext.tsx
onError: (err, variables, context) => {
  setIsEditing(false);
  // 回滾樂觀更新
  if (context?.previousPages) {
    queryClient.setQueryData(QUERY_KEYS.pages(user!.id), context.previousPages);
  }
}
```

**重試機制：**
- React Query 配置：`retry: 1` (失敗後重試 1 次)
- 無自定義重試邏輯

---

## 5. 後端處理 (Backend Processing)

### 架構說明

**重要：** 此應用使用 **Supabase** 作為 Backend-as-a-Service (BaaS)，**沒有傳統的 API 路由或控制器**。

**後端邏輯位置：**
1. **數據庫觸發器 (Database Triggers)** - 自動更新時間戳
2. **Row Level Security (RLS) 策略** - 權限控制
3. **PostgreSQL 函數** - 數據處理邏輯

### 數據庫觸發器

**文件：** `mathy/sql-migrations/supabase-folders-migration.sql`, line 104-118

```sql
-- 自動更新 last_edited_at 和 updated_at
CREATE OR REPLACE FUNCTION public.handle_notebook_edit()
RETURNS TRIGGER AS $$
BEGIN
  new.last_edited_at = NOW();
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_last_edited_at_notebooks
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW 
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
  EXECUTE FUNCTION public.handle_notebook_edit();
```

**觸發條件：** 當 `content` 或 `title` 字段發生變化時自動執行

### 權限驗證 (RLS)

**文件：** `mathy/sql-migrations/supabase-migration.sql`

```sql
-- 啟用 Row Level Security
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的筆記
CREATE POLICY "Users can view own notebooks"
  ON public.notebooks FOR SELECT
  USING (auth.uid() = user_id);

-- 用戶只能更新自己的筆記
CREATE POLICY "Users can update own notebooks"
  ON public.notebooks FOR UPDATE
  USING (auth.uid() = user_id);
```

**驗證流程：**
1. Supabase 自動從 JWT token 中提取 `auth.uid()`
2. RLS 策略檢查 `user_id` 是否匹配
3. 只有匹配的記錄才能被更新

### 數據序列化

**內容格式：** JSONB (PostgreSQL 的 JSON 二進制格式)

**序列化位置：** 
- **客戶端：** BlockNote 自動將文檔轉換為 blocks 數組
- **傳輸：** JSON 格式通過 HTTP 傳輸
- **存儲：** PostgreSQL 自動將 JSON 存儲為 JSONB

**數據結構：**
```typescript
{
  blocks: [
    {
      id: string,
      type: string,  // 'paragraph', 'heading', 'bulletListItem', etc.
      content: Array<InlineContent>,
      props?: Record<string, any>
    }
  ]
}
```

---

## 6. 數據庫層 (Database Layer)

### 數據庫表結構

**表名：** `notebooks`

**主要字段：**
```sql
CREATE TABLE public.notebooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  content JSONB DEFAULT '{"blocks": []}'::jsonb,  -- ← 筆記內容
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  icon TEXT,
  position INTEGER DEFAULT 0,
  is_favorited BOOLEAN DEFAULT false,
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 數據庫寫入操作

**操作類型：** `UPDATE` (更新現有記錄)

**SQL 等價語句：**
```sql
UPDATE notebooks
SET 
  content = '{"blocks": [...]}'::jsonb,
  last_edited_at = NOW(),
  updated_at = NOW()
WHERE id = '{pageId}'
  AND user_id = auth.uid();  -- RLS 自動添加此條件
```

**寫入模式：** 
- **不是 INSERT** - 頁面創建時才使用 INSERT
- **不是 UPSERT** - 使用標準 UPDATE
- **不是版本控制** - 直接覆蓋，無歷史記錄

### 時間戳管理

**自動更新機制：**

1. **數據庫觸發器自動更新：**
   - `last_edited_at` - 內容或標題變化時更新
   - `updated_at` - 任何更新時更新

2. **觸發器邏輯：**
```sql
-- 僅在內容或標題實際變化時更新
WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
```

---

## 7. 衝突解決與並發 (Conflict Resolution & Concurrency)

### 當前實現

**衝突解決策略：** **最後寫入獲勝 (Last Write Wins)**

**沒有實現：**
- ❌ 文檔版本號
- ❌ `updatedAt` 比較檢查
- ❌ 服務器端合併
- ❌ CRDT/OT (協作編輯)
- ❌ 衝突檢測

### 並發處理

**實時同步機制：**

**文件：** `WorkspaceContext.tsx`, line 162-191

```typescript
// 訂閱實時更新（防抖 2 秒）
useEffect(() => {
  if (!user) return;

  let refreshTimer: NodeJS.Timeout | null = null;
  
  const debouncedRefresh = () => {
    // 跳過刷新如果用戶正在編輯
    if (isEditing) {
      return;
    }
    
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      // 使查詢失效，觸發重新獲取
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) });
    }, 2000);  // 2秒防抖
  };

  // 訂閱數據庫變化
  const foldersSubscription = workspaceAPI.subscribeFolders(user.id, debouncedRefresh);
  const pagesSubscription = workspaceAPI.subscribePages(user.id, debouncedRefresh);

  return () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    foldersSubscription.unsubscribe();
    pagesSubscription.unsubscribe();
  };
}, [user, queryClient, isEditing]);
```

**實時訂閱實現：**

**文件：** `workspace.ts`, line 267-284

```typescript
export function subscribePages(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel('pages-changes')
    .on(
      'postgres_changes',
      {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'notebooks',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}
```

**並發保護機制：**

1. **編輯狀態標記：**
   - 用戶編輯時設置 `isEditing = true`
   - 暫停實時更新，避免衝突
   - 2秒無編輯後恢復更新

2. **樂觀更新：**
   - 立即更新 UI
   - 如果失敗則回滾

### 潛在問題

**多設備/多標籤頁衝突：**
- 如果用戶在兩個設備上同時編輯同一頁面
- 最後保存的會覆蓋之前的更改
- **無衝突檢測或合併機制**

---

## 8. 自動保存 vs 手動保存 (Autosave vs Manual Save)

### 當前實現

**只有自動保存，沒有手動保存按鈕**

### 自動保存配置

| 項目 | 內容保存 | 標題保存 |
|------|---------|---------|
| **防抖時間** | 1000ms (1秒) | 500ms (0.5秒) |
| **觸發條件** | `onChange` 事件 | `onChange` 事件 |
| **端點** | 相同 (`updatePage`) | 相同 (`updatePage`) |
| **Payload** | `{ content: { blocks } }` | `{ title: string }` |
| **錯誤處理** | 記錄錯誤，不阻止編輯 | 記錄錯誤，不阻止編輯 |
| **UX 反饋** | "Saving..." 指示器 | 無單獨指示器 |

### 保存流程對比

**內容保存：**
```
用戶輸入 → onChange → 防抖 1秒 → updatePage({ content })
```

**標題保存：**
```
用戶輸入 → onChange → 防抖 0.5秒 → updatePage({ title })
```

**相同點：**
- 使用相同的 API 函數 (`updatePage`)
- 使用相同的數據庫表 (`notebooks`)
- 使用相同的錯誤處理邏輯

**不同點：**
- 防抖時間不同（標題更快）
- Payload 不同（只包含變化的字段）

---

## 9. 離線持久化 (Offline Persistence)

### 當前實現

**❌ 沒有實現離線持久化**

**沒有使用：**
- ❌ localStorage
- ❌ IndexedDB
- ❌ Service Worker 緩存
- ❌ 離線隊列

### 離線行為

**如果用戶離線：**
1. Supabase 請求會失敗
2. 錯誤被記錄到控制台
3. **用戶的更改會丟失**（沒有本地緩存）
4. 用戶可以繼續編輯，但無法保存

### 實時同步恢復

**當用戶重新上線：**
- React Query 會自動重試失敗的請求（如果配置了 `retry`）
- 實時訂閱會自動重新連接
- 但離線期間的更改不會被保存

---

## 10. 擴展點與修改指南 (Extension Points)

### 修改保存頻率

**文件：** `PageEditor.tsx`

**內容保存頻率：**
```typescript
// Line 218: 修改 1000 為你想要的毫秒數
contentSaveTimerRef.current = setTimeout(async () => {
  await updatePage(pageId, { content });
}, 1000);  // ← 修改這裡
```

**標題保存頻率：**
```typescript
// Line 245: 修改 500 為你想要的毫秒數
titleSaveTimerRef.current = setTimeout(async () => {
  await updatePage(pageId, { title: newTitle });
}, 500);  // ← 修改這裡
```

### 添加額外元數據到保存 Payload

**步驟 1：** 修改 API 函數類型定義

**文件：** `mathy/app/types/workspace.ts`

```typescript
export interface Page {
  // ... 現有字段
  cursor_position?: number;      // 新增
  editor_mode?: string;          // 新增
}
```

**步驟 2：** 修改保存邏輯

**文件：** `PageEditor.tsx`, line 218

```typescript
contentSaveTimerRef.current = setTimeout(async () => {
  const selection = window.getSelection();
  const cursorPosition = selection?.anchorOffset || 0;
  
  await updatePage(pageId, { 
    content,
    cursor_position: cursorPosition,  // 新增
    editor_mode: 'default'            // 新增
  });
}, 1000);
```

**步驟 3：** 更新數據庫 schema（如果需要）

**文件：** 創建新的 migration 文件

```sql
ALTER TABLE public.notebooks 
  ADD COLUMN IF NOT EXISTS cursor_position INTEGER,
  ADD COLUMN IF NOT EXISTS editor_mode TEXT;
```

### 添加版本歷史/快照

**步驟 1：** 創建版本歷史表

**新文件：** `mathy/sql-migrations/supabase-version-history-migration.sql`

```sql
CREATE TABLE IF NOT EXISTS public.notebook_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS notebook_versions_notebook_id_idx 
  ON public.notebook_versions(notebook_id, created_at DESC);
```

**步驟 2：** 創建觸發器自動保存版本

```sql
CREATE OR REPLACE FUNCTION public.save_notebook_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notebook_versions (notebook_id, content, title, created_by)
  VALUES (NEW.id, NEW.content, NEW.title, NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER save_version_on_update
  AFTER UPDATE ON public.notebooks
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
  EXECUTE FUNCTION public.save_notebook_version();
```

**步驟 3：** 添加 API 函數獲取版本歷史

**文件：** `workspace.ts`

```typescript
export async function getNotebookVersions(notebookId: string) {
  const { data, error } = await supabase
    .from('notebook_versions')
    .select('*')
    .eq('notebook_id', notebookId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### 添加手動保存按鈕

**文件：** `PageEditor.tsx`

**步驟 1：** 添加立即保存函數

```typescript
const handleManualSave = useCallback(async () => {
  if (!page) return;
  
  setIsSaving(true);
  
  try {
    const blocks = editor.document;
    const content = { blocks };
    
    // 清除自動保存定時器
    if (contentSaveTimerRef.current) {
      clearTimeout(contentSaveTimerRef.current);
    }
    
    // 立即保存
    await updatePage(pageId, { content });
    
    // 顯示成功提示
    console.log('Saved successfully');
  } catch (error) {
    console.error('Failed to save:', error);
  } finally {
    setIsSaving(false);
  }
}, [editor, page, pageId, updatePage]);
```

**步驟 2：** 添加保存按鈕到 UI

```typescript
// 在 rightHeaderContent 中添加
const rightHeaderContent = (
  <>
    <button
      onClick={handleManualSave}
      disabled={isSaving}
      className="px-3 py-1.5 rounded-md text-sm"
    >
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  </>
);
```

### 添加衝突檢測

**文件：** `workspace.ts`

```typescript
export async function updatePageWithConflictCheck(
  pageId: string,
  updates: Partial<Page>,
  expectedUpdatedAt: string  // 客戶端期望的 updated_at
): Promise<Page> {
  // 先獲取當前版本
  const { data: currentPage, error: fetchError } = await supabase
    .from('notebooks')
    .select('updated_at')
    .eq('id', pageId)
    .single();

  if (fetchError) throw fetchError;

  // 檢查衝突
  if (currentPage.updated_at !== expectedUpdatedAt) {
    throw new Error('CONFLICT: Page was modified by another user');
  }

  // 執行更新
  return updatePage(pageId, updates);
}
```

**在組件中使用：**

```typescript
// PageEditor.tsx
const handleContentChange = useCallback(async () => {
  // ... 現有邏輯
  
  contentSaveTimerRef.current = setTimeout(async () => {
    try {
      await updatePageWithConflictCheck(
        pageId, 
        { content },
        page.updated_at  // 傳入當前頁面的 updated_at
      );
    } catch (error) {
      if (error.message === 'CONFLICT: Page was modified by another user') {
        // 處理衝突：提示用戶或合併更改
        alert('This page was modified elsewhere. Please refresh.');
      } else {
        console.error('Failed to save content:', error);
      }
    }
  }, 1000);
}, [editor, page, pageId]);
```

### 添加離線支持

**步驟 1：** 安裝 IndexedDB 庫

```bash
npm install idb
```

**步驟 2：** 創建離線存儲服務

**新文件：** `mathy/app/lib/offline-storage.ts`

```typescript
import { openDB, DBSchema } from 'idb';

interface NotebooksDB extends DBSchema {
  pendingUpdates: {
    key: string;
    value: {
      pageId: string;
      updates: Partial<Page>;
      timestamp: number;
    };
  };
}

const dbPromise = openDB<NotebooksDB>('notebooks-offline', 1, {
  upgrade(db) {
    db.createObjectStore('pendingUpdates', { keyPath: 'pageId' });
  },
});

export async function saveOffline(pageId: string, updates: Partial<Page>) {
  const db = await dbPromise;
  await db.put('pendingUpdates', {
    pageId,
    updates,
    timestamp: Date.now(),
  });
}

export async function syncOfflineChanges() {
  const db = await dbPromise;
  const pending = await db.getAll('pendingUpdates');
  
  for (const item of pending) {
    try {
      await updatePage(item.pageId, item.updates);
      await db.delete('pendingUpdates', item.pageId);
    } catch (error) {
      console.error('Failed to sync offline change:', error);
    }
  }
}
```

**步驟 3：** 在保存邏輯中使用

```typescript
// PageEditor.tsx
contentSaveTimerRef.current = setTimeout(async () => {
  try {
    if (navigator.onLine) {
      await updatePage(pageId, { content });
    } else {
      await saveOffline(pageId, { content });
    }
  } catch (error) {
    // 即使在線也保存到離線存儲作為備份
    await saveOffline(pageId, { content });
  }
}, 1000);
```

---

## 📊 總結 (Summary)

### 保存流程完整圖

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI Layer (PageEditor.tsx)                                │
│    - 用戶輸入觸發 BlockNote onChange                         │
│    - handleContentChange() 被調用                             │
│    - 防抖定時器設置（1秒）                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. State Management (WorkspaceContext.tsx)                  │
│    - updatePageMutation 執行                                 │
│    - 樂觀更新本地緩存                                         │
│    - 標記 isEditing = true                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. API Layer (workspace.ts)                                 │
│    - updatePage() 函數被調用                                 │
│    - Supabase client 構建請求                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Network (Supabase REST API)                              │
│    - PATCH /rest/v1/notebooks?id=eq.{pageId}                │
│    - 請求體: { content: { blocks: [...] } }                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend (Supabase + PostgreSQL)                          │
│    - RLS 策略驗證權限                                         │
│    - UPDATE 操作執行                                          │
│    - 觸發器自動更新時間戳                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Database (PostgreSQL)                                    │
│    - notebooks 表更新                                        │
│    - content (JSONB) 字段更新                                 │
│    - last_edited_at, updated_at 自動更新                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Real-time Sync (Supabase Realtime)                       │
│    - 數據庫變化觸發 postgres_changes 事件                     │
│    - 其他客戶端收到更新通知                                   │
│    - React Query 緩存失效，重新獲取數據                       │
└─────────────────────────────────────────────────────────────┘
```

### 關鍵文件索引

| 功能 | 文件路徑 | 關鍵函數/組件 |
|------|---------|--------------|
| **編輯器組件** | `app/components/workspace components/Pages/PageEditor.tsx` | `PageEditor`, `handleContentChange` |
| **狀態管理** | `app/contexts/WorkspaceContext.tsx` | `updatePageMutation`, `WorkspaceProvider` |
| **API 層** | `app/lib/api/workspace.ts` | `updatePage` |
| **Supabase 客戶端** | `app/lib/supabase/client.ts` | `createClient` |
| **React Query 配置** | `app/lib/react-query/QueryProvider.tsx` | `QueryClient` |
| **數據庫 Schema** | `sql-migrations/supabase-folders-migration.sql` | 觸發器、RLS 策略 |

### 性能優化點

1. ✅ **防抖** - 減少不必要的 API 調用
2. ✅ **樂觀更新** - 立即 UI 反饋
3. ✅ **React Query 緩存** - 減少重複請求
4. ✅ **實時訂閱防抖** - 批量處理更新
5. ✅ **編輯狀態暫停** - 避免編輯時衝突

### 改進建議

1. ⚠️ **添加衝突檢測** - 防止數據丟失
2. ⚠️ **離線支持** - 提升用戶體驗
3. ⚠️ **版本歷史** - 支持撤銷/恢復
4. ⚠️ **手動保存按鈕** - 給用戶更多控制
5. ⚠️ **更好的錯誤提示** - 用戶友好的錯誤信息

---

**文檔生成時間：** 2024年
**適用版本：** 當前代碼庫狀態

