'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import type { Folder, Page, WorkspaceItem, ViewMode, Paper } from '@/app/types/workspace';
import * as workspaceAPI from '@/app/lib/api/workspace';
import { createClient } from '@/app/lib/supabase/client';
import { foldersCache, pagesCache, pendingSync, generateTempId, isTempId, clearAllCache } from '@/app/lib/cache/localStorageCache';

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
  createFolder: (name: string, icon?: string, color?: string, description?: string, parentId?: string) => Promise<Folder>;
  updateFolder: (folderId: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  
  // Actions - Pages
  createPage: (title: string, folderId?: string, icon?: string) => Promise<Page>;
  updatePage: (pageId: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  movePageToFolder: (pageId: string, folderId: string | null) => Promise<void>;
  
  // Actions - Papers
  createPaper: (metadata: Record<string, unknown>, source: string, type: 'doi' | 'arxiv' | 'pdf', file?: File) => Promise<Paper>;
  updatePaperStatus: (paperId: string, status: string, data?: Record<string, unknown>) => Promise<void>;
  deletePaper: (paperId: string) => Promise<void>;
  reparsePaper: (paperId: string) => Promise<void>;
  
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

// Query keys for React Query
const QUERY_KEYS = {
  folders: (userId: string) => ['folders', userId],
  pages: (userId: string) => ['pages', userId],
  workspaceItems: (userId: string) => ['workspaceItems', userId],
} as const;

export function WorkspaceProvider({ 
  children, 
  sidebarOpen, 
  setSidebarOpen 
}: { 
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Navigation state
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('workspace');
  
  // Track if user is actively editing (to pause real-time updates)
  const [isEditing, setIsEditing] = useState(false);
  const editingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // REACT QUERY HOOKS - Smart caching and automatic deduplication
  // ============================================================================

  // Track if local cache has been checked (to prevent showing welcome message before cache is loaded)
  const [isCacheChecked, setIsCacheChecked] = useState(false);

  // Local cache state for guest users
  const [localFolders, setLocalFolders] = useState<Folder[]>(() => {
    // Synchronously read from localStorage on initial render
    if (typeof window !== 'undefined') {
      return foldersCache.get();
    }
    return [];
  });
  const [localPages, setLocalPages] = useState<Page[]>(() => {
    if (typeof window !== 'undefined') {
      return pagesCache.get();
    }
    return [];
  });

  // Check local cache on mount and mark as checked
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Re-read cache to ensure we have the latest data
      setLocalFolders(foldersCache.get());
      setLocalPages(pagesCache.get());
      // Mark cache as checked after a microtask to ensure state is updated
      Promise.resolve().then(() => {
        setIsCacheChecked(true);
      });
    } else {
      // On server, mark as checked immediately (no cache to check)
      setIsCacheChecked(true);
    }
  }, []);

  // CRITICAL: Clear localStorage when user logs in or switches accounts
  // This prevents data leakage between different user accounts
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // User just logged in or switched accounts
      // Clear all local cache to prevent cross-account data contamination
      const cachedFolders = foldersCache.get();
      const cachedPages = pagesCache.get();
      
      // Only clear if there's cached data (prevents unnecessary operations)
      if (cachedFolders.length > 0 || cachedPages.length > 0) {
        console.warn('User logged in - clearing guest data to prevent leakage');
        clearAllCache();
        setLocalFolders([]);
        setLocalPages([]);
      }
    } else if (!user && typeof window !== 'undefined') {
      // User logged out - reload guest data
      setLocalFolders(foldersCache.get());
      setLocalPages(pagesCache.get());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Track user.id to detect account switches

  // Fetch folders with React Query (only when user is logged in)
  const { 
    data: serverFolders = [], 
    isLoading: foldersLoading,
    error: foldersError 
  } = useQuery({
    queryKey: QUERY_KEYS.folders(user?.id || ''),
    queryFn: () => workspaceAPI.getFolders(user!.id),
    enabled: !!user,
  });

  // Fetch pages with React Query (only when user is logged in)
  const { 
    data: serverPages = [], 
    isLoading: pagesLoading,
    error: pagesError 
  } = useQuery({
    queryKey: QUERY_KEYS.pages(user?.id || ''),
    queryFn: () => workspaceAPI.getPages(user!.id),
    enabled: !!user,
  });

  // Merge server data with local cache
  // SECURITY: Only merge server data when logged in
  // Guest data should NEVER appear when user is authenticated
  const folders = user 
    ? serverFolders // Only show server data, don't merge with local cache
    : localFolders; // Only show local cache for guests
  
  const pages = user
    ? serverPages // Only show server data, don't merge with local cache
    : localPages; // Only show local cache for guests

  // Fetch workspace items with React Query
  const { 
    data: workspaceItems = [], 
    isLoading: workspaceItemsLoading,
    error: workspaceItemsError 
  } = useQuery({
    queryKey: QUERY_KEYS.workspaceItems(user?.id || ''),
    queryFn: () => workspaceAPI.getWorkspaceItems(user!.id),
    enabled: !!user,
  });

  // Combined loading and error states
  // For guest users, also wait for cache to be checked before showing content
  const loading = foldersLoading || pagesLoading || workspaceItemsLoading || (!user && !isCacheChecked);
  const error = foldersError || pagesError || workspaceItemsError 
    ? 'Failed to load workspace data' 
    : null;

  // Refresh workspace data by invalidating queries
  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(user.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user.id) }),
    ]);
  }, [user, queryClient]);

  // Subscribe to real-time updates with optimized debouncing
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
        // Invalidate queries instead of manual refresh - React Query handles the rest
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(user.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user.id) });
      }, 2000); // Increased from 300ms to 2 seconds - batch multiple updates
    };

    const foldersSubscription = workspaceAPI.subscribeFolders(user.id, debouncedRefresh);
    const pagesSubscription = workspaceAPI.subscribePages(user.id, debouncedRefresh);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      foldersSubscription.unsubscribe();
      pagesSubscription.unsubscribe();
    };
  }, [user, queryClient, isEditing]);

  // Pause real-time updates when tab is hidden (save bandwidth and battery)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, pause updates
        setIsEditing(true);
      } else {
        // Tab is visible again, resume updates and refresh
        setIsEditing(false);
        refreshWorkspace();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshWorkspace]);

  // ============================================================================
  // FOLDER MUTATIONS - Optimistic updates with automatic rollback on error
  // ============================================================================

  const createFolderMutation = useMutation({
    mutationFn: ({ 
      userId, 
      name, 
      icon, 
      color, 
      description, 
      parentId 
    }: { 
      userId: string; 
      name: string; 
      icon?: string; 
      color?: string; 
      description?: string; 
      parentId?: string; 
    }) => workspaceAPI.createFolder(userId, name, icon, color, description, parentId),
    onSuccess: (newFolder) => {
      // Optimistically update cache
      queryClient.setQueryData<Folder[]>(
        QUERY_KEYS.folders(user!.id),
        (old = []) => [...old, newFolder]
      );
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user!.id) });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ folderId, updates }: { folderId: string; updates: Partial<Folder> }) =>
      workspaceAPI.updateFolder(folderId, updates),
    onMutate: async ({ folderId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.folders(user!.id) });
      
      // Snapshot previous value
      const previousFolders = queryClient.getQueryData<Folder[]>(QUERY_KEYS.folders(user!.id));
      
      // Optimistically update
      queryClient.setQueryData<Folder[]>(
        QUERY_KEYS.folders(user!.id),
        (old = []) => old.map(f => f.id === folderId ? { ...f, ...updates } : f)
      );
      
      return { previousFolders };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFolders) {
        queryClient.setQueryData(QUERY_KEYS.folders(user!.id), context.previousFolders);
      }
    },
    onSuccess: (updatedFolder) => {
      // Update current folder if it's the one being updated
      if (currentFolder?.id === updatedFolder.id) {
        setCurrentFolder(updatedFolder);
      }
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => workspaceAPI.deleteFolder(folderId),
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.folders(user!.id) });
      
      const previousFolders = queryClient.getQueryData<Folder[]>(QUERY_KEYS.folders(user!.id));
      
      // Optimistically remove
      queryClient.setQueryData<Folder[]>(
        QUERY_KEYS.folders(user!.id),
        (old = []) => old.filter(f => f.id !== folderId)
      );
      
      return { previousFolders };
    },
    onError: (err, folderId, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(QUERY_KEYS.folders(user!.id), context.previousFolders);
      }
    },
    onSuccess: (_, folderId) => {
      // If viewing this folder, go back to workspace
      if (currentFolder?.id === folderId) {
        goToWorkspace();
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user!.id) });
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ folderId, targetFolderId }: { folderId: string; targetFolderId: string | null }) =>
      workspaceAPI.moveFolderToFolder(folderId, targetFolderId),
    onMutate: async ({ folderId, targetFolderId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.folders(user!.id) });
      
      const previousFolders = queryClient.getQueryData<Folder[]>(QUERY_KEYS.folders(user!.id));
      
      // Optimistically update
      queryClient.setQueryData<Folder[]>(
        QUERY_KEYS.folders(user!.id),
        (old = []) => old.map(f => 
          f.id === folderId ? { ...f, parent_folder_id: targetFolderId || undefined } : f
        )
      );
      
      return { previousFolders };
    },
    onError: (err, variables, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(QUERY_KEYS.folders(user!.id), context.previousFolders);
      }
    },
  });

  // ============================================================================
  // PAGE MUTATIONS - Optimistic updates with automatic rollback on error
  // ============================================================================

  const createPageMutation = useMutation({
    mutationFn: ({ 
      userId, 
      title, 
      folderId, 
      icon 
    }: { 
      userId: string; 
      title: string; 
      folderId?: string; 
      icon?: string; 
    }) => workspaceAPI.createPage(userId, title, folderId, icon),
    onSuccess: (newPage) => {
      queryClient.setQueryData<Page[]>(
        QUERY_KEYS.pages(user!.id),
        (old = []) => [...old, newPage]
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user!.id) });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, updates }: { pageId: string; updates: Partial<Page> }) =>
      workspaceAPI.updatePage(pageId, updates),
    onMutate: async ({ pageId, updates }) => {
      // Mark as editing to pause real-time updates
      setIsEditing(true);
      if (editingTimerRef.current) clearTimeout(editingTimerRef.current);
      
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.pages(user!.id) });
      
      const previousPages = queryClient.getQueryData<Page[]>(QUERY_KEYS.pages(user!.id));
      
      // Optimistically update
      queryClient.setQueryData<Page[]>(
        QUERY_KEYS.pages(user!.id),
        (old = []) => old.map(p => p.id === pageId ? { ...p, ...updates } : p)
      );
      
      // Update current page if it's the one being updated
      if (currentPage?.id === pageId) {
        setCurrentPage({ ...currentPage, ...updates } as Page);
      }
      
      return { previousPages };
    },
    onError: (err, variables, context) => {
      setIsEditing(false);
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.pages(user!.id), context.previousPages);
      }
    },
    onSettled: () => {
      // Resume updates after 2 seconds of no editing
      editingTimerRef.current = setTimeout(() => {
        setIsEditing(false);
      }, 2000);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => workspaceAPI.deletePage(pageId),
    onMutate: async (pageId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.pages(user!.id) });
      
      const previousPages = queryClient.getQueryData<Page[]>(QUERY_KEYS.pages(user!.id));
      
      // Optimistically remove
      queryClient.setQueryData<Page[]>(
        QUERY_KEYS.pages(user!.id),
        (old = []) => old.filter(p => p.id !== pageId)
      );
      
      return { previousPages };
    },
    onError: (err, pageId, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.pages(user!.id), context.previousPages);
      }
    },
    onSuccess: (_, pageId) => {
      // If viewing this page, go back
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user!.id) });
    },
  });

  const movePageMutation = useMutation({
    mutationFn: ({ pageId, folderId }: { pageId: string; folderId: string | null }) =>
      workspaceAPI.movePageToFolder(pageId, folderId),
    onMutate: async ({ pageId, folderId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.pages(user!.id) });
      
      const previousPages = queryClient.getQueryData<Page[]>(QUERY_KEYS.pages(user!.id));
      
      // Optimistically update
      queryClient.setQueryData<Page[]>(
        QUERY_KEYS.pages(user!.id),
        (old = []) => old.map(p => 
          p.id === pageId ? { ...p, folder_id: folderId || undefined } : p
        )
      );
      
      return { previousPages };
    },
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.pages(user!.id), context.previousPages);
      }
    },
  });

  // ============================================================================
  // PUBLIC API - Wrapper functions for mutations
  // ============================================================================

  const createFolder = async (
    name: string,
    icon?: string,
    color?: string,
    description?: string,
    parentId?: string
  ): Promise<Folder> => {
    if (!user) {
      // Guest user: save to local cache
      const tempId = generateTempId();
      const newFolder: Folder = {
        id: tempId,
        user_id: '',
        name,
        icon: icon || '📁',
        color: color || '#6B7280',
        description: description || '',
        parent_folder_id: parentId,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
      };
      
      foldersCache.add(newFolder);
      setLocalFolders(foldersCache.get());
      pendingSync.add({
        type: 'create',
        entityType: 'folder',
        entityId: tempId,
        data: newFolder,
        timestamp: Date.now(),
      });
      
      return newFolder;
    }
    
    return createFolderMutation.mutateAsync({ userId: user.id, name, icon, color, description, parentId });
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    if (!user || isTempId(folderId)) {
      // Guest user or updating local item: save to cache
      const cachedFolders = foldersCache.get();
      const folderIndex = cachedFolders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        const updatedFolder = { ...cachedFolders[folderIndex], ...updates, updated_at: new Date().toISOString(), last_edited_at: new Date().toISOString() };
        foldersCache.update(folderId, updatedFolder);
        setLocalFolders(foldersCache.get());
        
        if (!user) {
          pendingSync.add({
            type: 'update',
            entityType: 'folder',
            entityId: folderId,
            data: updatedFolder,
            timestamp: Date.now(),
          });
        }
      }
      return;
    }
    
    await updateFolderMutation.mutateAsync({ folderId, updates });
  };

  const deleteFolder = async (folderId: string) => {
    if (!user || isTempId(folderId)) {
      // Guest user or deleting local item: remove from cache
      foldersCache.remove(folderId);
      setLocalFolders(foldersCache.get());
      
      if (!user) {
        pendingSync.add({
          type: 'delete',
          entityType: 'folder',
          entityId: folderId,
          timestamp: Date.now(),
        });
      }
      return;
    }
    
    await deleteFolderMutation.mutateAsync(folderId);
  };

  const createPage = async (
    title: string,
    folderId?: string,
    icon?: string
  ): Promise<Page> => {
    if (!user) {
      // Guest user: save to local cache
      const tempId = generateTempId();
      const newPage: Page = {
        id: tempId,
        user_id: '',
        title: title || 'Untitled Page',
        icon: icon || '📝',
        folder_id: folderId,
        content: { blocks: [] },
        position: 0,
        is_default: false,
        is_favorited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
      };
      
      pagesCache.add(newPage);
      setLocalPages(pagesCache.get());
      pendingSync.add({
        type: 'create',
        entityType: 'page',
        entityId: tempId,
        data: newPage,
        timestamp: Date.now(),
      });
      
      return newPage;
    }
    
    return createPageMutation.mutateAsync({ userId: user.id, title, folderId, icon });
  };

  const updatePage = async (pageId: string, updates: Partial<Page>) => {
    if (!user || isTempId(pageId)) {
      // Guest user or updating local item: save to cache
      const cachedPages = pagesCache.get();
      const pageIndex = cachedPages.findIndex(p => p.id === pageId);
      if (pageIndex !== -1) {
        const updatedPage = { ...cachedPages[pageIndex], ...updates, updated_at: new Date().toISOString(), last_edited_at: new Date().toISOString() };
        pagesCache.update(pageId, updatedPage);
        setLocalPages(pagesCache.get());
        
        if (!user) {
          pendingSync.add({
            type: 'update',
            entityType: 'page',
            entityId: pageId,
            data: updatedPage,
            timestamp: Date.now(),
          });
        }
      }
      return;
    }
    
    await updatePageMutation.mutateAsync({ pageId, updates });
  };

  const deletePage = async (pageId: string) => {
    if (!user || isTempId(pageId)) {
      // Guest user or deleting local item: remove from cache
      pagesCache.remove(pageId);
      setLocalPages(pagesCache.get());
      
      if (!user) {
        pendingSync.add({
          type: 'delete',
          entityType: 'page',
          entityId: pageId,
          timestamp: Date.now(),
        });
      }
      return;
    }
    
    await deletePageMutation.mutateAsync(pageId);
  };

  const movePageToFolder = async (pageId: string, folderId: string | null) => {
    if (!user || isTempId(pageId)) {
      // Guest user or moving local item: update cache
      const pages = pagesCache.get();
      const updatedPages = pages.map(p => 
        p.id === pageId ? { ...p, folder_id: folderId || undefined } : p
      );
      pagesCache.set(updatedPages);
      setLocalPages(updatedPages);
      
      if (!user) {
        // Find the updated page to add to pending sync
        const updatedPage = updatedPages.find(p => p.id === pageId);
        if (updatedPage) {
          pendingSync.add({
            type: 'update',
            entityType: 'page',
            entityId: pageId,
            data: updatedPage,
            timestamp: Date.now(),
          });
        }
      }
      return;
    }
    
    await movePageMutation.mutateAsync({ pageId, folderId });
  };

  const moveFolderToFolder = async (folderId: string, targetFolderId: string | null) => {
    await moveFolderMutation.mutateAsync({ folderId, targetFolderId });
  };

  // ============================================================================
  // PAPER MANAGEMENT FUNCTIONS
  // ============================================================================

  const createPaper = async (metadata: Record<string, unknown>, source: string, type: 'doi' | 'arxiv' | 'pdf', file?: File): Promise<Paper> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const supabase = createClient();
      
      // 1. Upload PDF file if provided
      let pdfPath: string | undefined;
      if (file && type === 'pdf') {
        const { uploadPDF } = await import('@/app/lib/api/paperStorage');
        pdfPath = await uploadPDF(file, user.id, `temp-${Date.now()}`);
      }
      
      // 2. Create paper record in database
      const { data: paper, error: createError } = await supabase
        .from('notebooks')
        .insert({
          user_id: user.id,
          title: (metadata.title as string) || 'Untitled Paper',
          content: { blocks: [] },
          icon: '📄',
          position: 0,
          is_default: false,
          is_favorited: false,
          item_type: 'paper',
          paper_metadata: metadata,
          paper_source: source,
          paper_status: 'queued',
          pdf_path: pdfPath
        })
        .select()
        .single();
      
      if (createError || !paper) {
        console.error('Failed to create paper record:', createError); // Debug logging
        throw new Error('Failed to create paper record');
      }
      
      // 3. Call process API to start parsing
      try {
        await fetch('/api/papers/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            value: source,
            paperId: paper.id
          })
        });
      } catch (processError) {
        console.error('Failed to start processing:', processError);
        // Paper is created, but processing failed - will show error status
      }
      
      // 4. Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) });
      
      return paper as Paper;
    } catch (error) {
      console.error('Failed to create paper:', error);
      throw error;
    }
  };

  const updatePaperStatus = async (paperId: string, status: string, data?: Record<string, unknown>) => {
    try {
      // TODO: Implement actual paper status update via API
      console.log('Updating paper status:', { paperId, status, data });
    } catch (error) {
      console.error('Failed to update paper status:', error);
      throw error;
    }
  };

  const deletePaper = async (paperId: string) => {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete paper');
      }
      
      // Invalidate queries to refresh UI
      if (user) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) });
      }
    } catch (error) {
      console.error('Failed to delete paper:', error);
      throw error;
    }
  };

  const reparsePaper = async (paperId: string) => {
    try {
      const response = await fetch(`/api/papers/${paperId}/reparse`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to re-parse paper');
      }
      
      // Invalidate queries to refresh UI
      if (user) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) });
      }
    } catch (error) {
      console.error('Failed to re-parse paper:', error);
      throw error;
    }
  };

  // ============================================================================
  // DRAG & DROP UTILITIES
  // ============================================================================

  const calculateFolderDepth = (folderId: string, targetParentId?: string | null): number => {
    let depth = 0;
    let currentId = targetParentId !== undefined ? targetParentId : null;
    
    while (currentId) {
      depth++;
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      currentId = folder.parent_folder_id || null;
      
      if (depth > 10) break;
    }
    
    const getMaxChildDepth = (parentId: string): number => {
      const childFolders = folders.filter(f => f.parent_folder_id === parentId);
      if (childFolders.length === 0) return 0;
      
      return 1 + Math.max(...childFolders.map(f => getMaxChildDepth(f.id)));
    };
    
    const childDepth = getMaxChildDepth(folderId);
    return depth + childDepth;
  };

  const canDropItem = (
    dragType: 'folder' | 'page',
    dragId: string,
    targetType: 'folder' | 'page',
    targetId: string
  ): boolean => {
    if (dragId === targetId) return false;
    if (dragType === 'page' && targetType === 'page') return false;
    if (targetType === 'page') return false;
    
    if (dragType === 'folder') {
      let checkId: string | undefined = targetId;
      while (checkId) {
        if (checkId === dragId) return false;
        const folder = folders.find(f => f.id === checkId);
        checkId = folder?.parent_folder_id || undefined;
      }
      
      const newDepth = calculateFolderDepth(dragId, targetId);
      if (newDepth >= 3) return false;
    }
    
    // Page can be dropped into folders
    if (dragType === 'page' && targetType === 'folder') {
      return true;
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
  // SECURITY NOTE: LOCAL DATA SYNC DISABLED
  // ============================================================================
  // Previously, we synced localStorage data to the server when users logged in.
  // This was REMOVED due to a critical security vulnerability:
  // - localStorage is shared across all accounts on the same browser
  // - Guest data could leak into logged-in accounts
  // - Account A's data could appear in Account B
  // 
  // DECISION: When users log in, their localStorage is cleared immediately.
  // Guest users must manually transfer data before logging in.
  // This prevents cross-account data contamination.
  // ============================================================================

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: WorkspaceContextType = {
    // Data from React Query
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
    
    // Actions - Papers
    createPaper,
    updatePaperStatus,
    deletePaper,
    reparsePaper,
    
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
