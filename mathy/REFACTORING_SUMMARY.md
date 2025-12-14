# ClarityNotes Codebase Refactoring Review

## 1. Executive Summary
The ClarityNotes codebase is built on a solid modern stack (Next.js 15, React 19, Supabase, TanStack Query). It implements complex features like a nested file system, drag-and-drop organization, and a rich text editor.

However, as is common with rapid feature development, several key components (specifically `Sidebar.tsx` and `WorkspaceContext.tsx`) have grown into "God Objects," handling too many responsibilities. This makes maintenance difficult, increases the risk of regressions, and impacts performance.

**Primary Goals of Refactoring:**
1.  **Decouple Monoliths:** Break down `Sidebar.tsx` and `WorkspaceContext.tsx`.
2.  **Enhance Reusability:** Extract repeated logic (color parsing, layout helpers) into shared utilities.
3.  **Standardize Architecture:** Move towards a feature-based folder structure.
4.  **Optimize Performance:** Refine re-rendering triggers and data fetching strategies.

---

## 2. Architecture & State Management

### Current State
*   **`WorkspaceContext.tsx`**: Currently acts as a catch-all for global state. It manages user authentication, data fetching (React Query), optimistic updates, local storage caching (for guest users), and cross-component actions (create/delete/move).
*   **Data Flow**: Mixing React Query for server state and manual `localStorage` management for guest state within the same context creates complex conditional logic (`if (!user) ... else ...`).

### Recommendations

#### Split the Monolithic Context
Instead of a single `WorkspaceProvider`, split the logic into focused hooks or smaller contexts.

*   **`useWorkspaceData` Hook**:
    *   Create custom hooks that abstract the "Guest vs. User" logic.
    *   *Example:* `useFolders()` should automatically decide whether to pull from React Query or LocalStorage internally, without the UI components knowing.
*   **Encapsulate Mutations**:
    *   Move `createFolder`, `movePage`, etc., into a dedicated `useWorkspaceActions` hook.
    *   This separates *reading* data from *modifying* data, preventing unnecessary re-renders in components that only need to display lists.

#### Refine Caching Strategy
The logic for checking `isCacheChecked` and clearing cache on logout in `useEffect` is fragile.
*   **Unified Query Layer**: Consider using a client-side database wrapper (like RxDB or a simple wrapper around Dexie.js) that mimics the Supabase API. This would allow you to use the *same* React Query hooks for both Guest and Auth modes, just swapping the "fetcher" function.

---

## 3. Component Structure & Modularity

### The `Sidebar.tsx` Monolith (~1450 lines)
This file is critically large. It handles:
1.  Recursive rendering of the file tree.
2.  Complex Drag & Drop logic (Dnd-Kit sensors, collision, event handling).
3.  UI state (expanded folders, hover states).
4.  Profile and navigation rendering.

**Refactoring Plan:**
1.  **Extract `SidebarItem`**: Create a dedicated component for the folder/page row. This handles the hover effects, indentation calculations, and icon rendering.
2.  **Extract `SidebarTree`**: Isolate the recursive rendering logic.
3.  **Extract Drag Logic**: Move `onDragEnd`, `onDragOver`, and sensor configuration into a `useSidebarDragDrop` hook.
4.  **Extract Sub-sections**: `SidebarProfile`, `SidebarNavigation` (Home header), and `SidebarActions` (New Page/Folder) should be their own functional components.

### `PageEditor.tsx` & Duplicate Logic
*   **Color Utilities**: `normalizeHex`, `expandToSixDigit`, `parseHex`, and `lightenHex` appear in both `Sidebar.tsx` and `PageEditor.tsx`.
    *   **Action**: Move these to `app/lib/utils/colors.ts`.
*   **Time Formatting**: `formatRelativeTime` is defined locally.
    *   **Action**: Move to `app/lib/utils/date.ts`.

---

## 4. Project Organization

The current structure is deeply nested and uses spaces in folder names, which is unconventional in web development.

**Current:**
```
app/components/workspace components/Workspace View/Sidebar.tsx
```

**Recommended (Feature-Driven):**
```
app/
  features/
    sidebar/
      components/
        Sidebar.tsx
        SidebarItem.tsx
        SidebarProfile.tsx
      hooks/
        useSidebarDragDrop.ts
    editor/
      components/
        PageEditor.tsx
        EditorToolbar.tsx
    workspace/
      components/
        WorkspaceView.tsx
        WorkspaceLayout.tsx
  shared/
    components/
      ui/ (Buttons, Modals, Cards)
    utils/
      colors.ts
      date.ts
```
*Rationale*: Grouping by feature makes it easier to locate related files and understand the boundaries of each module.

---

## 5. Styling & Design System

### Current State
*   `globals.css` contains a mix of Tailwind directives, custom CSS variables, and specific overrides for libraries (BlockNote, MathLive).
*   Inline styles are used frequently for dynamic values (colors, indentation).

### Recommendations
1.  **CSS Modules or Tailwind Components**: For complex overrides (like the BlockNote styling in `globals.css`), consider extracting them into a reusable CSS module or a tailored Tailwind plugin/component layer if they grow larger.
2.  **Design Tokens**: You are correctly using CSS variables for themes (`--background`, `--foreground`). Ensure standard spacing (indentation size) is also a variable or constant to avoid magic numbers like `12px` in rendering logic.
3.  **Glassmorphism Standardization**: The "premium" look relies on specific RGBA values. Extract these into Tailwind utility classes (e.g., `.glass-panel`, `.glass-border`) to ensure consistency across the Sidebar and Cards.

---

## 6. Actionable Refactoring Roadmap

### Phase 1: Low-Hanging Fruit (Safe & High Impact)
1.  [ ] **Extract Utilities**: Create `app/lib/utils/colors.ts` and `app/lib/utils/date.ts`. Replace local functions in `Sidebar.tsx` and `PageEditor.tsx`.
2.  [ ] **Fix Directory Naming**: Rename `workspace components` to `workspace-components` or `workspace` to avoid spaces in paths.

### Phase 2: Component Decomposition
3.  [ ] **Sidebar Decomposition**:
    *   Create `SidebarItem.tsx` (Prop interface: `item`, `depth`, `isActive`, `onToggle`).
    *   Create `SidebarProfile.tsx`.
    *   Move these new components out of the main file.
4.  [ ] **Drag & Drop Hook**: Extract the heavy `DndContext` handlers from Sidebar into `useSidebarDnD.ts`.

### Phase 3: Architecture & Context
5.  [ ] **Split WorkspaceContext**:
    *   Analyze usage patterns.
    *   Create `useFolders` and `usePages` hooks that internally use the main context or separate contexts.
    *   Move mutation logic (API calls) into a separate `actions.ts` or hook to declutter the provider.

### Phase 4: Performance Checking
6.  [ ] **Memoization Check**: Ensure `SidebarItem` is wrapped in `React.memo` (it currently is, which is good). Ensure the `props` passed to it (like functions) are stable (`useCallback`).
7.  [ ] **Virtualization (Optional)**: If users are expected to have hundreds of pages, consider using `react-window` for the Sidebar list instead of simple recursion.

## Conclusion
Your codebase is functional and visually polished. The main technical debt lies in the "code organization" and "component size" categories. Tackling the **Sidebar** decomposition first will give you the biggest immediate win in code readability and maintainability.
