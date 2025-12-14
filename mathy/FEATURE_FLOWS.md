# 🔄 ClarityNotes Feature Flows - Visual Guide

Quick reference for understanding how each feature works end-to-end.

---

## 🎯 Core User Flows

### 1. Create & Edit Page (Notebook)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "New Page" button                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ CreatePageModal.tsx                                              │
│  ├─ Title input                                                 │
│  ├─ Folder selector (optional)                                  │
│  └─ Icon picker                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ Submit
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ WorkspaceContext.createPage(title, folderId, icon)             │
│                                                                  │
│  IF user is authenticated:                                      │
│  ├─ workspaceAPI.createPage(userId, title, folderId, icon)     │
│  ├─ → Supabase INSERT into "notebooks" table                   │
│  ├─ → Returns new page object                                  │
│  └─ React Query cache update (optimistic)                      │
│                                                                  │
│  IF user is guest:                                              │
│  ├─ Generate temp ID (temp_xxxxx)                              │
│  ├─ Save to localStorage.folders                               │
│  └─ Update localPages state                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Router.push('/notebook/page/[pageId]')                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PageEditor.tsx renders                                          │
│                                                                  │
│  1. Find page in WorkspaceContext.pages                        │
│  2. Initialize BlockNote editor:                               │
│     ├─ customSchema (with math support)                        │
│     ├─ initialContent = page.content.blocks                    │
│     └─ useCreateBlockNote hook                                 │
│                                                                  │
│  3. Set up auto-save:                                          │
│     ├─ editor.onChange → debounce 1000ms                       │
│     └─ updatePage(pageId, { content })                        │
│                                                                  │
│  4. Render UI:                                                  │
│     ├─ Breadcrumb (Workspace / Folder / Page)                 │
│     ├─ Title input (auto-save 500ms)                          │
│     ├─ BlockNoteView editor                                    │
│     └─ Save indicator ("Saving..." / "Saved")                  │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER TYPES: "The formula is $x^2$"                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ "$" triggers CustomSuggestionMenu                               │
│  ├─ Shows "Inline Math" option                                 │
│  └─ User selects → inserts inlineMath block                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ InlineMath.tsx renders                                          │
│  ├─ MathLive editor for input                                  │
│  ├─ Live LaTeX preview                                         │
│  └─ Saves as: { type: 'inlineMath', props: { latex: 'x^2' } } │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Auto-save triggers (1s after last keystroke)                   │
│  ├─ Extract editor.document (all blocks)                       │
│  ├─ updatePage(pageId, { content: { blocks } })               │
│  └─ Supabase UPDATE "notebooks" table                          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Entry: `app/(product)/notebook/page.tsx`
- Modal: `components/workspace components/Pages/CreatePageModal.tsx`
- Editor: `components/workspace components/Pages/PageEditor.tsx`
- Context: `contexts/WorkspaceContext.tsx:384-449`
- API: `lib/api/workspace.ts:135-158`
- Schema: `lib/blocknote-schema.ts`
- Math: `components/product components/InlineMath.tsx`

---

### 2. Folder Hierarchy & Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "New Folder" button                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ CreateFolderModal.tsx                                            │
│  ├─ Name input (max 25 chars)                                  │
│  ├─ Icon picker                                                 │
│  ├─ Color picker                                                │
│  ├─ Description (optional)                                      │
│  └─ Parent folder selector (for nesting)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │ Submit
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ WorkspaceContext.createFolder(name, icon, color, desc, parent) │
│                                                                  │
│  IF user is authenticated:                                      │
│  ├─ workspaceAPI.createFolder(...)                             │
│  ├─ → Supabase INSERT into "folders" table                     │
│  │    {                                                         │
│  │      name: "My Folder",                                     │
│  │      parent_folder_id: parentId || null,  ← hierarchy      │
│  │      color: "#6B7280",                                      │
│  │      position: 0                           ← sort order     │
│  │    }                                                         │
│  └─ React Query cache update                                   │
│                                                                  │
│  IF user is guest:                                              │
│  └─ Save to localStorage.folders                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar.tsx re-renders (subscribes to folders state)           │
│                                                                  │
│  1. Build folder tree structure:                               │
│     const buildTree = (parentId) => {                          │
│       return folders.filter(f => f.parent_folder_id === parentId)│
│         .map(folder => ({                                       │
│           ...folder,                                            │
│           children: buildTree(folder.id),  ← recursive         │
│           depth: calculateDepth(folder.id)                     │
│         }))                                                     │
│     }                                                           │
│                                                                  │
│  2. Render recursive tree:                                      │
│     Root folders (parent_folder_id = null)                     │
│     ├─ Folder A (depth: 0)                                     │
│     │   ├─ Folder B (depth: 1)                                 │
│     │   │   └─ Page 1                                          │
│     │   └─ Page 2                                              │
│     └─ Folder C (depth: 0)                                     │
│         └─ Folder D (depth: 1)                                 │
│                                                                  │
│  3. Apply indentation:                                          │
│     marginLeft = depth * INDENT_SIZE (12px)                    │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click on "Folder A"                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Router.push('/notebook/folder/[folderId]')                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ FolderView.tsx renders                                          │
│                                                                  │
│  1. Find folder: folders.find(f => f.id === folderId)         │
│  2. Get pages in folder: pages.filter(p => p.folder_id === id)│
│  3. Get child folders: folders.filter(f => f.parent === id)    │
│  4. Render:                                                     │
│     ├─ Breadcrumb: Workspace / Folder A                        │
│     ├─ Folder header (name, description, color)                │
│     ├─ Child folders grid                                      │
│     └─ Pages grid                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Modal: `components/workspace components/Folders/CreateFolderModal.tsx`
- Sidebar: `components/workspace components/Workspace View/Sidebar.tsx:400-600`
- View: `components/workspace components/Workspace View/FolderView.tsx`
- Context: `contexts/WorkspaceContext.tsx:267-353`
- API: `lib/api/workspace.ts:23-52`

---

### 3. Drag & Drop (Reorganize Pages/Folders)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Drag "Page 1" from Sidebar                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar.tsx - DndContext.onDragStart                            │
│                                                                  │
│  setActiveDragItem({                                            │
│    type: 'page',           ← from data attribute               │
│    id: page.id,                                                 │
│    depth: 1                                                     │
│  })                                                             │
│                                                                  │
│  setIsDragging(true)       ← visual feedback                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Hover over "Folder A"                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar.tsx - DndContext.onDragOver                             │
│                                                                  │
│  const canDrop = WorkspaceContext.canDropItem(                 │
│    dragType: 'page',                                            │
│    dragId: 'page-123',                                          │
│    targetType: 'folder',                                        │
│    targetId: 'folder-456'                                       │
│  )                                                              │
│                                                                  │
│  Validation checks:                                             │
│  ├─ ✅ Can drop page into folder                               │
│  ├─ ❌ Can't drop folder into itself                           │
│  ├─ ❌ Can't drop folder into descendant                       │
│  └─ ❌ Can't exceed max depth (5 levels)                       │
│                                                                  │
│  IF canDrop:                                                    │
│    Show blue border on target folder                           │
│  ELSE:                                                          │
│    Show red border + disable drop                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Release mouse (drop)                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar.tsx - DndContext.onDragEnd                              │
│                                                                  │
│  const { active, over } = event                                │
│                                                                  │
│  IF dragging page → dropped on folder:                         │
│    WorkspaceContext.movePageToFolder(page.id, folder.id)      │
│                                                                  │
│  IF dragging folder → dropped on folder:                       │
│    WorkspaceContext.moveFolderToFolder(folderId, parentId)     │
│                                                                  │
│  IF dragging page → dropped on workspace:                      │
│    WorkspaceContext.movePageToFolder(page.id, null)           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ WorkspaceContext.movePageToFolder(pageId, folderId)            │
│                                                                  │
│  1. Optimistic Update (instant UI change):                     │
│     queryClient.setQueryData(                                  │
│       ['pages', userId],                                        │
│       pages.map(p =>                                            │
│         p.id === pageId                                         │
│           ? { ...p, folder_id: folderId }                       │
│           : p                                                   │
│       )                                                         │
│     )                                                           │
│                                                                  │
│  2. API Call:                                                   │
│     workspaceAPI.movePageToFolder(pageId, folderId)            │
│     → Supabase UPDATE "notebooks"                              │
│        SET folder_id = folderId                                │
│        WHERE id = pageId                                       │
│                                                                  │
│  3. On Success:                                                 │
│     Invalidate queries to ensure sync                          │
│                                                                  │
│  4. On Error:                                                   │
│     Rollback optimistic update                                 │
│     Show error toast                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- DnD Setup: `Sidebar.tsx:1100-1200` (DndContext, sensors)
- Drag Handlers: `Sidebar.tsx:1200-1400` (onDragStart, onDragOver, onDragEnd)
- Validation: `contexts/WorkspaceContext.tsx:752-821` (canDropItem, calculateFolderDepth)
- API: `lib/api/workspace.ts:183-197` (movePageToFolder)

**Validation Logic:**
```typescript
canDropItem(dragType, dragId, targetType, targetId) {
  // Can't drop on self
  if (dragId === targetId) return false;

  // Can drop page anywhere
  if (dragType === 'page') return true;

  // Folder → Folder: check if target is descendant
  if (dragType === 'folder' && targetType === 'folder') {
    const isDescendant = checkIfDescendant(dragId, targetId);
    if (isDescendant) return false;

    // Check depth limit
    const newDepth = calculateFolderDepth(dragId, targetId);
    if (newDepth > 5) return false;
  }

  return true;
}
```

---

### 4. Authentication & Guest Mode

```
┌─────────────────────────────────────────────────────────────────┐
│ App loads → AuthContext.tsx initializes                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ useEffect: Check Supabase session                               │
│                                                                  │
│  const { data } = await supabase.auth.getSession()             │
│                                                                  │
│  IF session exists:                                             │
│    setUser(session.user)  → authenticated mode                 │
│  ELSE:                                                          │
│    setUser(null)          → guest mode                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ├─────────────────┬─────────────────┐
                     │                 │                 │
                   user              null              null
                     │                 │                 │
                     ▼                 ▼                 ▼
    ┌────────────────────┐  ┌────────────────┐  ┌──────────────┐
    │ AUTHENTICATED MODE │  │   GUEST MODE   │  │ GUEST CREATES│
    └────────────────────┘  └────────────────┘  │  CONTENT     │
             │                       │           └──────┬───────┘
             │                       │                  │
             ▼                       ▼                  ▼
┌────────────────────────┐  ┌──────────────────────────────────────┐
│ WorkspaceContext       │  │ WorkspaceContext                     │
│                        │  │                                      │
│ const folders =        │  │ const folders = localFolders        │
│   useQuery({           │  │ const pages = localPages            │
│     queryKey: [        │  │                                      │
│       'folders',       │  │ On create/update/delete:             │
│       user.id          │  │  ├─ Update local state               │
│       ],               │  │  ├─ Save to localStorage             │
│     queryFn: () =>     │  │  └─ No API calls                    │
│       workspaceAPI     │  │                                      │
│       .getFolders(     │  │ localStorage structure:             │
│         user.id)       │  │  {                                   │
│   })                   │  │    folders: [                        │
│                        │  │      {                               │
│ On create/update:      │  │        id: 'temp_abc123',           │
│  ├─ Optimistic update  │  │        name: 'My Folder',           │
│  ├─ API call           │  │        ...                           │
│  └─ Invalidate query   │  │      }                               │
│                        │  │    ],                                │
│ Real-time sync:        │  │    pages: [...]                     │
│  ├─ Subscribe to       │  │  }                                   │
│  │   Postgres changes  │  │                                      │
│  └─ Auto-refresh       │  │ ⚠️ No real-time sync                │
└────────────────────────┘  └──────────────────────────────────────┘
             │                       │
             │                       │
             │    USER SIGNS IN      │
             │   ◄───────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ AuthContext detects user change (login)                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ WorkspaceContext.useEffect (monitors user.id)                   │
│                                                                  │
│  useEffect(() => {                                              │
│    if (user && typeof window !== 'undefined') {                │
│      // ⚠️ SECURITY: Clear guest data to prevent leakage       │
│      const cachedFolders = foldersCache.get()                  │
│      const cachedPages = pagesCache.get()                      │
│                                                                  │
│      if (cachedFolders.length > 0 || cachedPages.length > 0) { │
│        console.warn('Clearing guest data after login')         │
│        clearAllCache()                                          │
│        setLocalFolders([])                                      │
│        setLocalPages([])                                        │
│      }                                                          │
│    }                                                            │
│  }, [user?.id])                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Switch to authenticated mode                                    │
│  ├─ Start fetching from Supabase                               │
│  ├─ Enable real-time sync                                      │
│  └─ Guest data is LOST (no migration)                          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Auth: `contexts/AuthContext.tsx`
- Workspace: `contexts/WorkspaceContext.tsx:129-149` (guest data clearing)
- Cache: `lib/cache/localStorageCache.ts`

**Current Issues:**
- ❌ Guest data is deleted on login (no migration offered)
- ❌ Duplicate logic for auth vs guest in every mutation
- ⚠️ No limit on guest data size (potential abuse)

---

### 5. Real-time Sync (Multi-tab/Multi-device)

```
┌─────────────────────────────────────────────────────────────────┐
│ User A opens app (Tab 1)                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ WorkspaceContext subscribes to Supabase Realtime               │
│                                                                  │
│  useEffect(() => {                                              │
│    if (!user) return                                            │
│                                                                  │
│    const foldersSubscription = supabase                         │
│      .channel('folders-changes')                                │
│      .on('postgres_changes', {                                  │
│        event: '*',              ← INSERT, UPDATE, DELETE        │
│        schema: 'public',                                        │
│        table: 'folders',                                        │
│        filter: `user_id=eq.${user.id}`                          │
│      }, debouncedRefresh)       ← callback                      │
│      .subscribe()                                               │
│                                                                  │
│    // Same for pages                                            │
│  }, [user])                                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ User A creates a page (Tab 1)                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ createPage() → Supabase INSERT                                  │
│                                                                  │
│  Supabase broadcasts Postgres change:                          │
│    {                                                            │
│      event: 'INSERT',                                           │
│      table: 'notebooks',                                        │
│      new: { id: 'page-123', title: 'New Page', ... }           │
│    }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Broadcast reaches all subscribed tabs/devices                  │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │  Tab 1   │    │  Tab 2   │    │ Device 2 │                 │
│  │ (author) │    │  (same)  │    │ (phone)  │                 │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘                 │
│       │               │               │                        │
│       ▼               ▼               ▼                        │
│  No refresh    Refresh trigger  Refresh trigger               │
│  (is editing)   after 2s        after 2s                       │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ debouncedRefresh() callback                                     │
│                                                                  │
│  const debouncedRefresh = () => {                              │
│    // Skip if user is typing (prevents UI disruption)          │
│    if (isEditing) return                                        │
│                                                                  │
│    // Debounce to batch multiple changes                       │
│    setTimeout(() => {                                           │
│      queryClient.invalidateQueries({                           │
│        queryKey: ['folders', user.id]                          │
│      })                                                         │
│      queryClient.invalidateQueries({                           │
│        queryKey: ['pages', user.id]                            │
│      })                                                         │
│    }, 2000)  ← 2 second debounce                               │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ React Query refetches data                                      │
│  ├─ Tab 2 UI updates with new page                             │
│  └─ Device 2 UI updates with new page                          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Subscription: `contexts/WorkspaceContext.tsx:213-242`
- API: `lib/api/workspace.ts:247-284` (subscribeFolders, subscribePages)

**Features:**
- ✅ Multi-tab sync (same device)
- ✅ Multi-device sync (same user)
- ✅ Debounced (2s) to batch updates
- ✅ Pauses during editing

**Limitations:**
- ❌ No presence indicators (who's online)
- ❌ No collaborative cursors
- ❌ Last write wins (no conflict resolution)
- ❌ Not marketed as collaboration feature

---

### 6. Math Rendering System

```
┌─────────────────────────────────────────────────────────────────┐
│ USER TYPES: "The formula is $"                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ BlockNote editor detects "$" trigger                            │
│                                                                  │
│  "$" is configured in blocknote-schema.ts as:                  │
│    - Trigger character for math suggestion menu                │
│    - Shows CustomSuggestionMenu                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ CustomSuggestionMenu.tsx renders                                │
│                                                                  │
│  Menu items from getMathMenuItems(editor):                     │
│  ┌──────────────────────────────────────────┐                  │
│  │ 𝑥  Inline Math                           │                  │
│  │    Insert inline math equation with      │                  │
│  │    live rendering                        │                  │
│  └──────────────────────────────────────────┘                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ User selects
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ onItemClick: Insert inline math content                         │
│                                                                  │
│  editor.insertInlineContent([                                   │
│    {                                                            │
│      type: 'inlineMath',                                        │
│      props: {                                                   │
│        latex: ' '  ← starts with space for cursor positioning  │
│      }                                                          │
│    }                                                            │
│  ])                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ InlineMath.tsx component renders                                │
│                                                                  │
│  const InlineMath = createReactInlineContentSpec({             │
│    type: 'inlineMath',                                          │
│    propSchema: {                                                │
│      latex: { default: '' }                                    │
│    },                                                           │
│    content: 'none',                                             │
│                                                                  │
│    render: (props) => {                                         │
│      const [mathfieldRef, setMathfieldRef] = useState(null)    │
│                                                                  │
│      useEffect(() => {                                          │
│        if (!mathfieldRef) {                                     │
│          // Create MathLive field (custom fork)                │
│          const mf = new MathfieldElement()                      │
│          mf.value = props.latex                                 │
│          mf.addEventListener('input', (e) => {                  │
│            props.updateProps({                                  │
│              latex: e.target.value  ← live update              │
│            })                                                   │
│          })                                                     │
│          setMathfieldRef(mf)                                    │
│        }                                                        │
│      }, [mathfieldRef])                                         │
│                                                                  │
│      return (                                                   │
│        <span                                                    │
│          ref={(el) => el?.appendChild(mathfieldRef)}           │
│          className="inline-math"                                │
│        />                                                       │
│      )                                                          │
│    }                                                            │
│  })                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER TYPES: "x^2 + \frac{1}{2}"                                │
│                                                                  │
│  MathLive renders live preview:                                │
│   x² + ½                                                        │
│                                                                  │
│  Saved as LaTeX in BlockNote JSON:                             │
│  {                                                              │
│    type: 'inlineMath',                                          │
│    props: {                                                     │
│      latex: 'x^2 + \\frac{1}{2}'                               │
│    }                                                            │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ On page reload / view mode                                      │
│                                                                  │
│  BlockNote parses content → finds inlineMath blocks             │
│  → Renders with KaTeX (faster, static rendering)               │
│                                                                  │
│  KaTeX CSS loaded in app/layout.tsx:                           │
│    <link rel="stylesheet"                                       │
│      href="https://cdn.jsdelivr.net/npm/katex@0.16.10/..."    │
│    />                                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Schema: `lib/blocknote-schema.ts:18-21, 24-46`
- Menu: `components/workspace components/Pages/CustomSuggestionMenu.tsx`
- Component: `components/product components/InlineMath.tsx`
- MathLive: `node_modules/@anderson120912091209/mathlive-custom`
- KaTeX: Loaded in `app/layout.tsx:31-35`

**Two Rendering Modes:**
1. **Edit Mode**: MathLive (interactive, live preview, heavier)
2. **View Mode**: KaTeX (static, fast, lightweight)

---

## 📊 Data Flow Summary

### State Management Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Sidebar  │  │Workspace │  │  Editor  │  │  Modals  │       │
│  │  .tsx    │  │ View.tsx │  │  .tsx    │  │  .tsx    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │               │
│       └─────────────┼─────────────┼─────────────┘               │
│                     │             │                             │
└─────────────────────┼─────────────┼─────────────────────────────┘
                      │             │
                      ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT LAYER                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ WorkspaceContext (hooks: useWorkspace)                 │    │
│  │  ├─ folders (from React Query or localStorage)         │    │
│  │  ├─ pages (from React Query or localStorage)           │    │
│  │  ├─ createFolder, updateFolder, deleteFolder           │    │
│  │  ├─ createPage, updatePage, deletePage                 │    │
│  │  ├─ movePageToFolder, moveFolderToFolder               │    │
│  │  └─ canDropItem, calculateFolderDepth                  │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│  ┌────────────────▼───────────────────────────────────────┐    │
│  │ AuthContext (hooks: useAuth)                           │    │
│  │  ├─ user (Supabase User object or null)               │    │
│  │  ├─ signIn, signOut                                    │    │
│  │  └─ loading state                                      │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│  ┌────────────────▼───────────────────────────────────────┐    │
│  │ ThemeContext (hooks: useTheme)                         │    │
│  │  ├─ theme ('light' | 'dark' | 'system')               │    │
│  │  └─ setTheme                                           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA FETCHING LAYER                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ TanStack Query (React Query)                           │    │
│  │  ├─ Caches server data                                 │    │
│  │  ├─ Optimistic updates                                 │    │
│  │  ├─ Automatic refetching                               │    │
│  │  └─ Deduplication                                      │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│  ┌────────────────▼───────────────────────────────────────┐    │
│  │ localStorage (guest mode fallback)                     │    │
│  │  ├─ foldersCache.get() / set()                         │    │
│  │  └─ pagesCache.get() / set()                           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ lib/api/workspace.ts                                   │    │
│  │  ├─ getFolders(userId)                                 │    │
│  │  ├─ getPages(userId)                                   │    │
│  │  ├─ createFolder(...)                                  │    │
│  │  ├─ createPage(...)                                    │    │
│  │  ├─ updateFolder(...)                                  │    │
│  │  ├─ updatePage(...)                                    │    │
│  │  ├─ subscribeFolders(userId, callback)                 │    │
│  │  └─ subscribePages(userId, callback)                   │    │
│  └────────────────┬───────────────────────────────────────┘    │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Supabase (PostgreSQL + Realtime + Storage + Auth)      │    │
│  │                                                         │    │
│  │ Tables:                                                 │    │
│  │  ├─ folders                                             │    │
│  │  │   ├─ id (uuid, PK)                                  │    │
│  │  │   ├─ user_id (uuid, FK)                             │    │
│  │  │   ├─ name (text)                                    │    │
│  │  │   ├─ parent_folder_id (uuid, nullable, FK to self)  │    │
│  │  │   ├─ color (text)                                   │    │
│  │  │   ├─ position (int)                                 │    │
│  │  │   └─ timestamps                                     │    │
│  │  │                                                      │    │
│  │  └─ notebooks (pages)                                  │    │
│  │      ├─ id (uuid, PK)                                  │    │
│  │      ├─ user_id (uuid, FK)                             │    │
│  │      ├─ folder_id (uuid, nullable, FK)                 │    │
│  │      ├─ title (text)                                   │    │
│  │      ├─ content (jsonb) ← BlockNote blocks             │    │
│  │      ├─ icon (text)                                    │    │
│  │      ├─ position (int)                                 │    │
│  │      └─ timestamps                                     │    │
│  │                                                         │    │
│  │ Realtime:                                               │    │
│  │  └─ Broadcasts INSERT/UPDATE/DELETE events             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Quick Reference

### Where is X implemented?

| Feature | File Location | Lines |
|---------|--------------|-------|
| **Page creation** | `WorkspaceContext.tsx` | 384-449 |
| **Page editing** | `PageEditor.tsx` | 1-609 |
| **Folder tree** | `Sidebar.tsx` | 400-900 |
| **Drag & drop** | `Sidebar.tsx` | 1200-1400 |
| **Math rendering** | `InlineMath.tsx` | 1-200 |
| **Auth login** | `AuthContext.tsx` | 1-100 |
| **Theme switching** | `ThemeContext.tsx` | 1-200 |
| **Real-time sync** | `WorkspaceContext.tsx` | 213-242 |
| **Guest mode** | `WorkspaceContext.tsx` | 97-149 |
| **Breadcrumbs** | `breadcrumbUtils.tsx` | 1-70 |

### Common User Actions → Code Path

| User Action | Entry Point | Key Functions |
|-------------|-------------|---------------|
| Create page | `SearchAndNewButtons` → `CreatePageModal` | `createPage()` |
| Edit page | Click page → `PageEditor` | `updatePage()`, auto-save |
| Move page to folder | Drag page → drop on folder | `movePageToFolder()` |
| Create folder | "New Folder" button → `CreateFolderModal` | `createFolder()` |
| Nest folder | Drag folder → drop on parent | `moveFolderToFolder()` |
| Insert math | Type "$" → select "Inline Math" | `insertInlineContent()` |
| Sign in | Login page → Google OAuth | `signInWithOAuth()` |
| Switch theme | Theme selector | `setTheme()` |

---

**Next Steps:**
- Read `CODEBASE_ANALYSIS.md` for refactoring recommendations
- Use this guide to navigate the codebase during development
- Update this document as you refactor features
