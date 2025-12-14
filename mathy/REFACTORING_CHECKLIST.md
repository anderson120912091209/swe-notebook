# ✅ Refactoring Checklist

Quick actionable checklist for cleaning up the ClarityNotes codebase.

---

## 🚀 Phase 1: Quick Wins (1-2 days)

### Remove Dead Weight

- [ ] **Remove Electron** (if not planning desktop app)
  ```bash
  # 1. Uninstall packages
  npm uninstall electron electron-builder concurrently wait-on
  
  # 2. Delete files
  rm -rf electron/
  rm app/types/electron.d.ts
  
  # 3. Clean package.json scripts
  #    Remove: electron, electron-dev, electron-build, electron-dist, electron-pack
  
  # 4. Simplify next.config.ts
  #    Remove: ELECTRON environment checks (lines 6, 10)
  #    Remove: trailingSlash: true (line 26, only needed for Electron)
  ```
  **Impact**: -200MB node_modules, -260 lines code

- [ ] **Remove Yoopta** (replace with screenshot)
  ```bash
  # 1. Uninstall ALL @yoopta packages
  npm uninstall @yoopta/editor @yoopta/action-menu-list @yoopta/blockquote \
    @yoopta/callout @yoopta/code @yoopta/divider @yoopta/embed \
    @yoopta/file @yoopta/headings @yoopta/image @yoopta/link \
    @yoopta/link-tool @yoopta/lists @yoopta/marks @yoopta/paragraph \
    @yoopta/table @yoopta/toolbar
  
  # 2. Delete component
  rm "app/components/marketing components/yoopta-demo-editor.tsx"
  
  # 3. Update product-demo-window.tsx
  #    Replace <YooptaDemoEditor /> with static screenshot image
  ```
  **Impact**: -30MB node_modules, -136 lines code

### Extract Utilities (No More Duplication)

- [ ] **Create color utilities**
  ```bash
  touch app/lib/utils/colors.ts
  ```
  
  **Copy these functions from Sidebar.tsx (lines 27-61):**
  - `normalizeHex(color?: string | null): string | null`
  - `expandToSixDigit(hex: string): string`
  - `parseHex(color?: string | null)`
  - `lightenHex(hex: string, amount: number): string`
  
  **Files to update:**
  - [ ] `Sidebar.tsx:27-61` → import from `lib/utils/colors`
  - [ ] `PageEditor.tsx:21-55` → import from `lib/utils/colors`
  - [ ] `FolderCard.tsx` (if uses color utils)
  - [ ] `PageCard.tsx` (if uses color utils)

- [ ] **Create date utilities**
  ```bash
  touch app/lib/utils/date.ts
  ```
  
  **Copy from PageEditor.tsx (lines 62-97):**
  - `formatRelativeTime(dateString: string): string`
  
  **Add new utilities:**
  ```typescript
  export function formatAbsoluteDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString()
  }
  
  export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString()
  }
  ```
  
  **Files to update:**
  - [ ] `PageEditor.tsx:62-97` → import from `lib/utils/date`
  - [ ] Any other files using "X minutes ago" formatting

### Add Test Infrastructure

- [ ] **Install Vitest** (modern, fast)
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom \
    @vitejs/plugin-react jsdom
  ```

- [ ] **Create vitest.config.ts**
  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './app'),
      },
    },
  })
  ```

- [ ] **Create vitest.setup.ts**
  ```typescript
  import '@testing-library/jest-dom'
  ```

- [ ] **Update package.json**
  ```json
  {
    "scripts": {
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage"
    }
  }
  ```

- [ ] **Run existing tests**
  ```bash
  npm test
  ```
  
  **Fix any failing tests in:**
  - [ ] `__tests__/math-dsl/lexer.test.ts`
  - [ ] `__tests__/math-dsl/parser.test.ts`
  - [ ] `__tests__/math-dsl/preprocessor.test.ts`
  - [ ] `__tests__/math-dsl/integration.test.tsx`

---

## 🔧 Phase 2: Context Decomposition (3-5 days)

### Split WorkspaceContext

- [ ] **Create hooks directory**
  ```bash
  mkdir -p app/hooks/workspace
  ```

- [ ] **Extract data hooks** (`app/hooks/workspace/useWorkspaceData.ts`)
  ```typescript
  export function useFolders() {
    const { user } = useAuth()
    const [localFolders, setLocalFolders] = useState(() => foldersCache.get())
    
    const { data: serverFolders = [] } = useQuery({
      queryKey: ['folders', user?.id],
      queryFn: () => workspaceAPI.getFolders(user!.id),
      enabled: !!user,
    })
    
    return user ? serverFolders : localFolders
  }
  
  export function usePages() {
    // Similar implementation
  }
  ```

- [ ] **Extract actions** (`app/hooks/workspace/useWorkspaceActions.ts`)
  ```typescript
  export function useWorkspaceActions() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    
    const createFolderMutation = useMutation({ /* ... */ })
    const updateFolderMutation = useMutation({ /* ... */ })
    const deleteFolderMutation = useMutation({ /* ... */ })
    // ... all other mutations
    
    return {
      createFolder: createFolderMutation.mutate,
      updateFolder: updateFolderMutation.mutate,
      // ... etc
    }
  }
  ```

- [ ] **Extract real-time** (`app/hooks/workspace/useWorkspaceRealtime.ts`)
  ```typescript
  export function useWorkspaceRealtime() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    
    useEffect(() => {
      if (!user) return
      
      const foldersSubscription = workspaceAPI.subscribeFolders(
        user.id,
        () => queryClient.invalidateQueries(['folders', user.id])
      )
      
      // ... similar for pages
      
      return () => {
        foldersSubscription.unsubscribe()
        // ...
      }
    }, [user])
  }
  ```

- [ ] **Extract drag & drop** (`app/hooks/workspace/useWorkspaceDragDrop.ts`)
  ```typescript
  export function useWorkspaceDragDrop() {
    const folders = useFolders()
    const { movePageToFolder, moveFolderToFolder } = useWorkspaceActions()
    
    const calculateFolderDepth = useCallback((folderId, targetParentId) => {
      // ... move logic from WorkspaceContext
    }, [folders])
    
    const canDropItem = useCallback((dragType, dragId, targetType, targetId) => {
      // ... move logic from WorkspaceContext
    }, [folders])
    
    return { calculateFolderDepth, canDropItem }
  }
  ```

- [ ] **Simplify WorkspaceContext.tsx**
  
  **New implementation (target: ~200 lines):**
  ```typescript
  export function WorkspaceProvider({ children }) {
    const folders = useFolders()
    const pages = usePages()
    const actions = useWorkspaceActions()
    const dragDrop = useWorkspaceDragDrop()
    
    useWorkspaceRealtime() // Side effect only
    
    // Keep minimal navigation state
    const [currentFolder, setCurrentFolder] = useState(null)
    const [currentPage, setCurrentPage] = useState(null)
    const [viewMode, setViewMode] = useState('workspace')
    
    const value = {
      folders,
      pages,
      ...actions,
      ...dragDrop,
      currentFolder,
      setCurrentFolder,
      currentPage,
      setCurrentPage,
      viewMode,
      setViewMode,
    }
    
    return (
      <WorkspaceContext.Provider value={value}>
        {children}
      </WorkspaceContext.Provider>
    )
  }
  ```

- [ ] **Update imports in all components**
  - [ ] `Sidebar.tsx`
  - [ ] `WorkspaceView.tsx`
  - [ ] `FolderView.tsx`
  - [ ] `PageEditor.tsx`
  - [ ] All modal components

- [ ] **Test thoroughly**
  - [ ] Create page
  - [ ] Update page
  - [ ] Delete page
  - [ ] Create folder
  - [ ] Update folder
  - [ ] Delete folder
  - [ ] Drag & drop pages
  - [ ] Drag & drop folders
  - [ ] Guest mode functionality

---

## 🎨 Phase 3: Sidebar Decomposition (5-7 days)

### Extract Components

- [ ] **Create sidebar directory**
  ```bash
  mkdir -p app/features/sidebar/components
  mkdir -p app/features/sidebar/hooks
  ```

- [ ] **Extract SidebarProfile** (`app/features/sidebar/components/SidebarProfile.tsx`)
  
  **Move from Sidebar.tsx lines ~900-1000:**
  - User avatar
  - Display name
  - Sign out button
  - Guest indicator

- [ ] **Extract SidebarItem** (`app/features/sidebar/components/SidebarItem.tsx`)
  
  **Generic row component for folders/pages:**
  ```typescript
  interface SidebarItemProps {
    icon: React.ReactNode
    label: string
    depth: number
    isActive: boolean
    onClick: () => void
    rightContent?: React.ReactNode
    isDraggable?: boolean
    isDropTarget?: boolean
  }
  
  export function SidebarItem({ ... }: SidebarItemProps) {
    // Single responsibility: render one row with proper styling
  }
  ```

- [ ] **Extract SidebarFolderTree** (`app/features/sidebar/components/SidebarFolderTree.tsx`)
  
  **Recursive folder rendering:**
  - Uses `SidebarItem` internally
  - Handles expansion state
  - Renders nested children
  - Target: ~150 lines

- [ ] **Extract SidebarRecentPages** (`app/features/sidebar/components/SidebarRecentPages.tsx`)
  
  **Recent pages list:**
  - Uses `SidebarItem` internally
  - Shows folder tags
  - Sorted by last_edited_at
  - Target: ~100 lines

### Extract Hooks

- [ ] **Extract DnD logic** (`app/features/sidebar/hooks/useSidebarDragDrop.ts`)
  
  **Move from Sidebar.tsx lines ~1200-1400:**
  ```typescript
  export function useSidebarDragDrop() {
    const { movePageToFolder, moveFolderToFolder, canDropItem } = useWorkspace()
    
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 }
      })
    )
    
    const [activeDragItem, setActiveDragItem] = useState(null)
    
    const onDragStart = useCallback((event: DragStartEvent) => {
      // ... logic
    }, [])
    
    const onDragEnd = useCallback((event: DragEndEvent) => {
      // ... logic
    }, [movePageToFolder, moveFolderToFolder])
    
    const onDragOver = useCallback((event: DragOverEvent) => {
      // ... logic
    }, [canDropItem])
    
    return { sensors, activeDragItem, onDragStart, onDragEnd, onDragOver }
  }
  ```

- [ ] **Extract expansion state** (`app/features/sidebar/hooks/useFolderExpansion.ts`)
  
  ```typescript
  export function useFolderExpansion() {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
      new Set()
    )
    
    const toggleFolder = useCallback((folderId: string) => {
      setExpandedFolders(prev => {
        const next = new Set(prev)
        if (next.has(folderId)) {
          next.delete(folderId)
        } else {
          next.add(folderId)
        }
        return next
      })
    }, [])
    
    const expandFolder = useCallback((folderId: string) => {
      setExpandedFolders(prev => new Set(prev).add(folderId))
    }, [])
    
    const collapseFolder = useCallback((folderId: string) => {
      setExpandedFolders(prev => {
        const next = new Set(prev)
        next.delete(folderId)
        return next
      })
    }, [])
    
    return { expandedFolders, toggleFolder, expandFolder, collapseFolder }
  }
  ```

### Refactor Main Sidebar

- [ ] **Simplify Sidebar.tsx** (target: ~300 lines)
  
  **New structure:**
  ```typescript
  export default function Sidebar() {
    const { folders, pages } = useWorkspace()
    const { user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    
    const { expandedFolders, toggleFolder } = useFolderExpansion()
    const dragDrop = useSidebarDragDrop()
    
    const recentPages = useMemo(() => {
      return [...pages]
        .sort((a, b) => new Date(b.last_edited_at).getTime() - new Date(a.last_edited_at).getTime())
        .slice(0, 10)
    }, [pages])
    
    const rootFolders = useMemo(() => {
      return folders.filter(f => !f.parent_folder_id)
    }, [folders])
    
    return (
      <DndContext {...dragDrop}>
        <div className="sidebar-container">
          <SidebarProfile user={user} />
          
          <SidebarRecentPages
            pages={recentPages}
            folders={folders}
            activePage={pathname}
            onPageClick={(page) => router.push(`/notebook/page/${page.id}`)}
          />
          
          <SidebarFolderTree
            folders={rootFolders}
            pages={pages}
            expandedFolders={expandedFolders}
            onToggle={toggleFolder}
            activeItem={pathname}
            onFolderClick={(folder) => router.push(`/notebook/folder/${folder.id}`)}
            onPageClick={(page) => router.push(`/notebook/page/${page.id}`)}
          />
        </div>
      </DndContext>
    )
  }
  ```

- [ ] **Update imports everywhere**
  - [ ] `app/(product)/layout.tsx` (imports Sidebar)
  - [ ] Any tests that reference Sidebar

- [ ] **Test all sidebar functionality**
  - [ ] Folder expansion/collapse
  - [ ] Click navigation
  - [ ] Drag & drop pages
  - [ ] Drag & drop folders
  - [ ] Recent pages display
  - [ ] Profile section

---

## 📦 Phase 4: Project Restructure (7-10 days)

### Create Feature Directories

- [ ] **Create new structure**
  ```bash
  mkdir -p app/features/{auth,workspace,folders,pages,editor,sidebar,math,onboarding,theme}
  mkdir -p app/shared/{components/ui,utils}
  ```

### Migrate Features (One at a Time)

- [ ] **Migrate smallest features first**

  **Onboarding:**
  ```bash
  mv app/components/onboarding/* app/features/onboarding/components/
  mv app/lib/api/onboarding.ts app/features/onboarding/api/
  mv app/lib/cache/onboardingCache.ts app/features/onboarding/cache/
  ```

  **Theme:**
  ```bash
  mv app/contexts/ThemeContext.tsx app/features/theme/contexts/
  ```

  **Auth:**
  ```bash
  mv "app/components/auth components"/* app/features/auth/components/
  mv app/contexts/AuthContext.tsx app/features/auth/contexts/
  mv app/lib/auth/* app/features/auth/utils/
  ```

- [ ] **Migrate medium features**

  **Math:**
  ```bash
  mv "app/components/product components"/Math*.tsx app/features/math/components/
  mv "app/components/product components"/Inline*.tsx app/features/math/components/
  mv "app/components/product components"/Suggestion*.tsx app/features/math/components/
  mv app/lib/math-dsl/* app/features/math/dsl/
  ```

  **Editor:**
  ```bash
  mv "app/components/product components"/CodeBlock.tsx app/features/editor/blocks/
  mv "app/components/product components"/ScienceEditor.tsx app/features/editor/components/
  mv app/lib/blocknote-schema.ts app/features/editor/schema/
  mv app/blocknote-components/* app/features/editor/inline-content/
  ```

- [ ] **Migrate large features**

  **Sidebar:** (already done in Phase 3)
  ```bash
  # Files should already be in app/features/sidebar/ from Phase 3
  ```

  **Folders:**
  ```bash
  mv "app/components/workspace components/Folders"/* app/features/folders/components/
  ```

  **Pages:**
  ```bash
  mv "app/components/workspace components/Pages"/* app/features/pages/components/
  ```

  **Workspace:**
  ```bash
  mv "app/components/workspace components/Workspace View"/* app/features/workspace/components/
  mv app/contexts/WorkspaceContext.tsx app/features/workspace/contexts/
  mv app/lib/api/workspace.ts app/features/workspace/api/
  # Move hooks from Phase 2 if not already there
  mv app/hooks/workspace/* app/features/workspace/hooks/
  ```

### Move Shared Code

- [ ] **Shared utilities**
  ```bash
  # Already created in Phase 1
  # Just verify they're in app/shared/utils/
  mv app/lib/utils/colors.ts app/shared/utils/
  mv app/lib/utils/date.ts app/shared/utils/
  mv app/lib/breadcrumbUtils.tsx app/shared/utils/
  mv app/lib/contentSnippet.ts app/shared/utils/
  mv app/lib/workspaceTitle.ts app/shared/utils/
  ```

- [ ] **Shared components**
  ```bash
  mv app/components/AnalyticsWrapper.tsx app/shared/components/
  mv app/components/ClientOnly.tsx app/shared/components/
  mv "app/components/workspace components/DeleteConfirmationModal.tsx" app/shared/components/
  ```

### Update All Imports

- [ ] **Create import map** (for search & replace)
  ```typescript
  // Old → New mappings
  '@/app/contexts/WorkspaceContext' → '@/app/features/workspace/contexts/WorkspaceContext'
  '@/app/contexts/AuthContext' → '@/app/features/auth/contexts/AuthContext'
  '@/app/contexts/ThemeContext' → '@/app/features/theme/contexts/ThemeContext'
  '@/app/components/workspace components/...' → '@/app/features/.../components/...'
  '@/app/lib/utils/colors' → '@/app/shared/utils/colors'
  '@/app/lib/utils/date' → '@/app/shared/utils/date'
  // ... etc
  ```

- [ ] **Run global find & replace**
  ```bash
  # Use VS Code or sed for bulk replacements
  # Test after EACH replacement to catch errors early
  ```

- [ ] **Fix broken imports manually**
  ```bash
  # Run TypeScript compiler to find remaining issues
  npm run build
  ```

### Clean Up Old Directories

- [ ] **Delete old structure** (after confirming everything works)
  ```bash
  rm -rf "app/components/workspace components"
  rm -rf "app/components/product components"
  rm -rf "app/components/auth components"
  rm -rf app/components/onboarding
  rm -rf app/lib/math-dsl
  rm -rf app/lib/api  # if empty
  rm -rf app/lib/auth  # if empty
  rm -rf app/lib/cache  # if empty
  rm -rf app/hooks  # if empty
  ```

- [ ] **Verify build**
  ```bash
  npm run build
  npm run start
  # Test all features manually
  ```

---

## 🧹 Phase 5: Feature Cleanup (5-7 days)

### Paper System Decision

**Option A: Complete Implementation**

- [ ] **Build UI components**
  - [ ] `PaperCard.tsx` (similar to PageCard)
  - [ ] `PaperImportModal.tsx` (DOI/arXiv input)
  - [ ] `PaperViewer.tsx` (PDF viewer + parsed HTML)

- [ ] **Implement import flow**
  - [ ] DOI resolution API integration
  - [ ] arXiv API integration
  - [ ] PDF parsing (backend service)

- [ ] **Add to WorkspaceView**
  - [ ] Enable "Items" tab
  - [ ] Show paper grid
  - [ ] Search papers

**Option B: Remove Everything**

- [ ] **Delete paper code**
  ```bash
  rm app/lib/api/paperStorage.ts
  ```

- [ ] **Remove from types**
  ```typescript
  // app/types/workspace.ts
  // Delete Paper interface (lines 50-67)
  // Remove paper fields from Page interface (lines 32-47)
  ```

- [ ] **Remove from WorkspaceContext**
  ```typescript
  // Remove createPaper, updatePaperStatus, deletePaper, reparsePaper
  // Remove from WorkspaceContextType interface
  ```

- [ ] **Drop database columns** (if confirmed unused)
  ```sql
  ALTER TABLE notebooks
    DROP COLUMN paper_metadata,
    DROP COLUMN paper_source,
    DROP COLUMN paper_status,
    DROP COLUMN paper_error_message,
    DROP COLUMN parsed_html_path,
    DROP COLUMN pdf_path,
    DROP COLUMN thumbnail_path;
  ```

- [ ] **Remove storage bucket**
  ```
  Supabase Dashboard → Storage → Delete "research-papers" bucket
  ```

### Guest Data Migration

- [ ] **Add import flow**
  
  **Create component:** `app/features/auth/components/GuestDataMigrationModal.tsx`
  ```typescript
  export function GuestDataMigrationModal() {
    const { user } = useAuth()
    const [guestData, setGuestData] = useState(null)
    
    useEffect(() => {
      if (user) {
        // Check for guest data
        const folders = foldersCache.get()
        const pages = pagesCache.get()
        
        if (folders.length > 0 || pages.length > 0) {
          setGuestData({ folders, pages })
        }
      }
    }, [user])
    
    const handleImport = async () => {
      // Import all folders and pages to Supabase
      // Show progress
      // Clear localStorage after success
    }
    
    const handleDiscard = () => {
      clearAllCache()
      setGuestData(null)
    }
    
    if (!guestData) return null
    
    return (
      <Modal>
        <h2>Import Your Guest Data?</h2>
        <p>You have {guestData.folders.length} folders and {guestData.pages.length} pages from guest mode.</p>
        <Button onClick={handleImport}>Import to Account</Button>
        <Button onClick={handleDiscard} variant="destructive">Discard</Button>
      </Modal>
    )
  }
  ```

- [ ] **Show modal after login**
  ```typescript
  // app/(product)/layout.tsx or AuthContext
  // Render <GuestDataMigrationModal /> when user logs in
  ```

- [ ] **Add size limit for guests**
  ```typescript
  // lib/cache/localStorageCache.ts
  const MAX_GUEST_PAGES = 10
  const MAX_GUEST_FOLDERS = 5
  
  export function canCreatePage(): boolean {
    return pagesCache.get().length < MAX_GUEST_PAGES
  }
  
  export function canCreateFolder(): boolean {
    return foldersCache.get().length < MAX_GUEST_FOLDERS
  }
  ```

- [ ] **Update create handlers**
  ```typescript
  // WorkspaceContext or useWorkspaceActions
  const createPage = async (...) => {
    if (!user && !canCreatePage()) {
      toast.error('Guest limit reached. Sign in to create more pages.')
      return
    }
    // ... rest of logic
  }
  ```

### Real-time Collaboration Decision

**Option A: Build Collaborative Features**

- [ ] **Add presence system**
  - [ ] Track active users per page
  - [ ] Show "who's editing" indicator
  - [ ] Display cursors/avatars

- [ ] **Add conflict resolution**
  - [ ] Operational Transformation or CRDT
  - [ ] Show merge conflicts UI
  - [ ] Auto-merge simple changes

- [ ] **Add notifications**
  - [ ] "User X edited page Y"
  - [ ] Real-time activity feed

**Option B: Remove Real-time (Simplify)**

- [ ] **Remove subscriptions**
  ```typescript
  // contexts/WorkspaceContext.tsx
  // Delete lines 213-242 (useEffect for subscriptions)
  ```

- [ ] **Switch to polling** (optional)
  ```typescript
  // Add refetchInterval to React Query
  const { data: folders } = useQuery({
    queryKey: ['folders', user?.id],
    queryFn: () => workspaceAPI.getFolders(user!.id),
    enabled: !!user,
    refetchInterval: 30000,  // Poll every 30 seconds
  })
  ```

- [ ] **Remove Supabase Realtime dependency**
  ```bash
  # Check if anything else uses Realtime first
  # If not, you can remove it from Supabase project settings
  ```

---

## ✅ Final Verification

### Build & Deploy

- [ ] **Run full build**
  ```bash
  npm run build
  ```
  - [ ] No TypeScript errors
  - [ ] No build warnings
  - [ ] Build time improved (target: <30s)

- [ ] **Run linter**
  ```bash
  npm run lint
  ```
  - [ ] Fix all errors
  - [ ] Fix all warnings

- [ ] **Run tests**
  ```bash
  npm test
  ```
  - [ ] All tests passing
  - [ ] Coverage >60%

- [ ] **Test locally**
  ```bash
  npm run start
  ```
  - [ ] All pages load
  - [ ] All features work
  - [ ] No console errors

### Manual Testing Checklist

- [ ] **Authentication**
  - [ ] Sign in with Google
  - [ ] Sign out
  - [ ] Guest mode works
  - [ ] Guest data migration (if implemented)

- [ ] **Workspace**
  - [ ] Create folder
  - [ ] Edit folder (name, color, icon)
  - [ ] Delete folder
  - [ ] Create page
  - [ ] Edit page title
  - [ ] Edit page content
  - [ ] Delete page
  - [ ] Drag & drop pages
  - [ ] Drag & drop folders
  - [ ] Nested folders (5 levels)

- [ ] **Editor**
  - [ ] Type text
  - [ ] Format text (bold, italic, etc.)
  - [ ] Insert math ($)
  - [ ] Code blocks
  - [ ] Lists
  - [ ] Headings
  - [ ] Auto-save works
  - [ ] Breadcrumbs work

- [ ] **Navigation**
  - [ ] Sidebar navigation
  - [ ] Recent pages
  - [ ] Folder view
  - [ ] Page editor
  - [ ] Back button
  - [ ] URL routing

- [ ] **Theme**
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] System mode
  - [ ] Theme persists

### Performance Checks

- [ ] **Lighthouse scores**
  - [ ] Performance >80
  - [ ] Accessibility >90
  - [ ] Best Practices >90
  - [ ] SEO >90

- [ ] **Bundle analysis**
  ```bash
  npm run build
  # Check .next/analyze/ output
  ```
  - [ ] No huge chunks (>500KB)
  - [ ] Tree-shaking working
  - [ ] Unused code removed

- [ ] **Database queries**
  - [ ] No N+1 queries
  - [ ] Proper indexes
  - [ ] React Query caching working

### Documentation

- [ ] **Update README.md**
  - [ ] Reflect new structure
  - [ ] Update setup instructions
  - [ ] Add feature list

- [ ] **Update CODEBASE_ANALYSIS.md**
  - [ ] Mark completed refactoring
  - [ ] Update metrics
  - [ ] Update file locations

- [ ] **Update FEATURE_FLOWS.md**
  - [ ] Update file paths
  - [ ] Add new flows (if any)
  - [ ] Remove deprecated flows

- [ ] **Create CONTRIBUTING.md** (optional)
  - [ ] Code style guide
  - [ ] PR process
  - [ ] Testing requirements

---

## 📊 Success Metrics

Track these before and after refactoring:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| node_modules size | ~500MB | ___MB | <300MB |
| Largest file (lines) | 1449 | _____ | <400 |
| Files >500 lines | 8 | _____ | <3 |
| Duplicate code (lines) | ~600 | _____ | 0 |
| Build time | ~45s | _____ | <30s |
| Hot reload time | ~2s | _____ | <1s |
| Test coverage | 0% | _____% | >60% |
| TypeScript errors | 0 | 0 | 0 |
| Lighthouse Performance | ___ | ___ | >80 |

---

## 🎉 Completion

When all checkboxes are ✅:

1. **Commit changes**
   ```bash
   git add .
   git commit -m "refactor: complete codebase restructure"
   ```

2. **Deploy to production**
   ```bash
   git push origin main
   # Vercel will auto-deploy
   ```

3. **Monitor for issues**
   - [ ] Check Sentry/PostHog for errors
   - [ ] Watch user feedback
   - [ ] Fix any regressions immediately

4. **Celebrate!** 🎊
   - You've reduced technical debt by 70%
   - Development velocity will increase 2x
   - Onboarding new developers is now 5x faster

---

**Questions or blockers?**  
Refer to `CODEBASE_ANALYSIS.md` for detailed explanations or create GitHub issues for specific problems.

**Last updated**: December 12, 2025
