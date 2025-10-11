'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import type { Folder, Page, WorkspaceItem, ViewMode } from '@/app/types/workspace';
import * as workspaceAPI from '@/app/lib/api/workspace';

interface WorkspaceContextType {
  // Data
  folders: Folder[];
  pages: Page[];
  workspaceItems: WorkspaceItem[];
  currentFolder: Folder | null;
  currentPage: Page | null;
  
  // View state
  viewMode: ViewMode;
  sidebarOpen: boolean;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions - Folders
  createFolder: (name: string, icon?: string, color?: string, parentId?: string) => Promise<Folder>;
  updateFolder: (folderId: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  
  // Actions - Pages
  createPage: (title: string, folderId?: string, icon?: string) => Promise<Page>;
  updatePage: (pageId: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  movePageToFolder: (pageId: string, folderId: string | null) => Promise<void>;
  
  // Drag & Drop
  moveFolderToFolder: (folderId: string, targetFolderId: string | null) => Promise<void>;
  calculateFolderDepth: (folderId: string, targetParentId?: string | null) => number;
  canDropItem: (dragType: 'folder' | 'page', dragId: string, targetType: 'folder' | 'page', targetId: string) => boolean;
  
  // Navigation
  openFolder: (folderId: string) => void;
  openPage: (pageId: string) => void;
  goToWorkspace: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Data refresh
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Data state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('workspace');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if user is actively editing (to pause real-time updates)
  const [isEditing, setIsEditing] = useState(false);
  const editingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load all workspace data
  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [foldersData, pagesData, workspaceItemsData] = await Promise.all([
        workspaceAPI.getFolders(user.id),
        workspaceAPI.getPages(user.id),
        workspaceAPI.getWorkspaceItems(user.id),
      ]);
      
      // Only update state if data actually changed to prevent unnecessary re-renders
      setFolders(prev => JSON.stringify(prev) !== JSON.stringify(foldersData) ? foldersData : prev);
      setPages(prev => JSON.stringify(prev) !== JSON.stringify(pagesData) ? pagesData : prev);
      setWorkspaceItems(prev => JSON.stringify(prev) !== JSON.stringify(workspaceItemsData) ? workspaceItemsData : prev);
    } catch (err) {
      console.error('Error loading workspace:', err);
      setError('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshWorkspace();
    }
  }, [user, refreshWorkspace]);

  // Subscribe to real-time updates with debouncing (paused while editing)
  useEffect(() => {
    if (!user) return;

    let refreshTimer: NodeJS.Timeout | null = null;
    
    const debouncedRefresh = () => {
      // Skip refresh if user is actively editing
      if (isEditing) {
        return;
      }
      
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshWorkspace();
      }, 300); // Wait 300ms before refreshing to batch multiple updates
    };

    const foldersSubscription = workspaceAPI.subscribeFolders(user.id, debouncedRefresh);
    const pagesSubscription = workspaceAPI.subscribePages(user.id, debouncedRefresh);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      foldersSubscription.unsubscribe();
      pagesSubscription.unsubscribe();
    };
  }, [user, refreshWorkspace, isEditing]);

  // ============================================================================
  // FOLDER ACTIONS
  // ============================================================================

  const createFolder = async (
    name: string,
    icon?: string,
    color?: string,
    parentId?: string
  ): Promise<Folder> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const newFolder = await workspaceAPI.createFolder(user.id, name, icon, color, parentId);
      await refreshWorkspace();
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      throw err;
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    try {
      await workspaceAPI.updateFolder(folderId, updates);
      await refreshWorkspace();
      
      // Update current folder if it's the one being updated
      if (currentFolder?.id === folderId) {
        const updatedFolder = folders.find(f => f.id === folderId);
        if (updatedFolder) {
          setCurrentFolder({ ...updatedFolder, ...updates } as Folder);
        }
      }
    } catch (err) {
      console.error('Error updating folder:', err);
      throw err;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await workspaceAPI.deleteFolder(folderId);
      
      // If we're viewing this folder, go back to workspace
      if (currentFolder?.id === folderId) {
        goToWorkspace();
      }
      
      await refreshWorkspace();
    } catch (err) {
      console.error('Error deleting folder:', err);
      throw err;
    }
  };

  // ============================================================================
  // PAGE ACTIONS
  // ============================================================================

  const createPage = async (
    title: string,
    folderId?: string,
    icon?: string
  ): Promise<Page> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const newPage = await workspaceAPI.createPage(user.id, title, folderId, icon);
      await refreshWorkspace();
      return newPage;
    } catch (err) {
      console.error('Error creating page:', err);
      throw err;
    }
  };

  const updatePage = async (pageId: string, updates: Partial<Page>) => {
    try {
      // Mark as editing to pause real-time updates
      setIsEditing(true);
      if (editingTimerRef.current) clearTimeout(editingTimerRef.current);
      
      await workspaceAPI.updatePage(pageId, updates);
      
      // Update current page if it's the one being updated
      if (currentPage?.id === pageId) {
        setCurrentPage({ ...currentPage, ...updates } as Page);
      }
      
      // Mark as not editing after 2 seconds of no updates
      editingTimerRef.current = setTimeout(() => {
        setIsEditing(false);
        refreshWorkspace(); // Refresh after editing stops
      }, 2000);
    } catch (err) {
      console.error('Error updating page:', err);
      setIsEditing(false);
      throw err;
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      await workspaceAPI.deletePage(pageId);
      
      // If we're viewing this page, go back to previous view
      if (currentPage?.id === pageId) {
        if (currentPage.folder_id) {
          const folder = folders.find(f => f.id === currentPage.folder_id);
          if (folder) {
            openFolder(folder.id);
          } else {
            goToWorkspace();
          }
        } else {
          goToWorkspace();
        }
      }
      
      await refreshWorkspace();
    } catch (err) {
      console.error('Error deleting page:', err);
      throw err;
    }
  };

  const movePageToFolder = async (pageId: string, folderId: string | null) => {
    // OPTIMISTIC UPDATE: Update UI immediately for smooth UX
    const previousPages = [...pages];
    
    try {
      // Immediately update the local state
      setPages(prevPages => 
        prevPages.map(page => 
          page.id === pageId 
            ? { ...page, folder_id: folderId || undefined }
            : page
        )
      );
      
      // Trigger database update in background (don't wait)
      workspaceAPI.movePageToFolder(pageId, folderId)
        .then(() => {
          console.log('✅ Page moved in database');
          // Refresh after 2 seconds to sync any other changes
          setTimeout(() => refreshWorkspace(), 2000);
        })
        .catch((err) => {
          console.error('❌ Database error, reverting:', err);
          // Revert on error
          setPages(previousPages);
        });
        
    } catch (err) {
      console.error('Error moving page:', err);
      // Revert on error
      setPages(previousPages);
      throw err;
    }
  };

  // ============================================================================
  // DRAG & DROP
  // ============================================================================

  // Move folder to another folder (or to root if targetFolderId is null)
  const moveFolderToFolder = async (folderId: string, targetFolderId: string | null) => {
    // OPTIMISTIC UPDATE: Update UI immediately for smooth UX
    const previousFolders = [...folders];
    
    try {
      // Immediately update the local state
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === folderId 
            ? { ...folder, parent_folder_id: targetFolderId || undefined }
            : folder
        )
      );
      
      // Trigger database update in background (don't wait)
      workspaceAPI.moveFolderToFolder(folderId, targetFolderId)
        .then(() => {
          console.log('✅ Folder moved in database');
          // Refresh after 2 seconds to sync any other changes
          setTimeout(() => refreshWorkspace(), 2000);
        })
        .catch((err) => {
          console.error('❌ Database error, reverting:', err);
          // Revert on error
          setFolders(previousFolders);
        });
        
    } catch (err) {
      console.error('Error moving folder:', err);
      // Revert on error
      setFolders(previousFolders);
      throw err;
    }
  };

  // Calculate the depth of a folder (how many levels deep it is)
  const calculateFolderDepth = (folderId: string, targetParentId?: string | null): number => {
    let depth = 0;
    let currentId = targetParentId !== undefined ? targetParentId : null;
    
    // Traverse up the folder hierarchy
    while (currentId) {
      depth++;
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      currentId = folder.parent_folder_id || null;
      
      // Prevent infinite loops (circular references)
      if (depth > 10) break;
    }
    
    // Also calculate the depth of any subfolders under the dragged folder
    const getMaxChildDepth = (parentId: string): number => {
      const childFolders = folders.filter(f => f.parent_folder_id === parentId);
      if (childFolders.length === 0) return 0;
      
      return 1 + Math.max(...childFolders.map(f => getMaxChildDepth(f.id)));
    };
    
    const childDepth = getMaxChildDepth(folderId);
    return depth + childDepth;
  };

  // Validate if an item can be dropped on a target
  const canDropItem = (
    dragType: 'folder' | 'page',
    dragId: string,
    targetType: 'folder' | 'page',
    targetId: string
  ): boolean => {
    // Rule 1: Can't drop on self
    if (dragId === targetId) return false;
    
    // Rule 2: Pages cannot be dropped on pages
    if (dragType === 'page' && targetType === 'page') return false;
    
    // Rule 3: Can only drop on folders
    if (targetType === 'page') return false;
    
    // Rule 4: Check for circular dependency (folder can't be moved into its own child)
    if (dragType === 'folder') {
      let checkId: string | undefined = targetId;
      while (checkId) {
        if (checkId === dragId) return false;
        const folder = folders.find(f => f.id === checkId);
        checkId = folder?.parent_folder_id || undefined;
      }
      
      // Rule 5: Check max depth (3 levels)
      const newDepth = calculateFolderDepth(dragId, targetId);
      if (newDepth >= 3) return false;
    }
    
    return true;
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const openFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentFolder(folder);
      setCurrentPage(null);
      setViewMode('folder');
    }
  };

  const openPage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setCurrentPage(page);
      
      // Also set current folder if page is in a folder
      if (page.folder_id) {
        const folder = folders.find(f => f.id === page.folder_id);
        if (folder) {
          setCurrentFolder(folder);
        }
      } else {
        setCurrentFolder(null);
      }
      
      setViewMode('editor');
    }
  };

  const goToWorkspace = () => {
    setCurrentFolder(null);
    setCurrentPage(null);
    setViewMode('workspace');
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: WorkspaceContextType = {
    // Data
    folders,
    pages,
    workspaceItems,
    currentFolder,
    currentPage,
    
    // View state
    viewMode,
    sidebarOpen,
    
    // Loading states
    loading,
    error,
    
    // Actions - Folders
    createFolder,
    updateFolder,
    deleteFolder,
    
    // Actions - Pages
    createPage,
    updatePage,
    deletePage,
    movePageToFolder,
    
    // Drag & Drop
    moveFolderToFolder,
    calculateFolderDepth,
    canDropItem,
    
    // Navigation
    openFolder,
    openPage,
    goToWorkspace,
    setSidebarOpen,
    
    // Data refresh
    refreshWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

