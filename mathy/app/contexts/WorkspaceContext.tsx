'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import type { Folder, Page, Canvas, WorkspaceItem, ViewMode, Paper } from '@/app/types/workspace';
import * as workspaceAPI from '@/app/lib/api/workspace';
import { createClient } from '@/app/lib/supabase/client';

interface WorkspaceContextType {
  // Data
  folders: Folder[];
  pages: Page[];
  canvas: Canvas[];
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
  
  // Actions - Canvas
  createCanvas: (title: string, folderId?: string, icon?: string) => Promise<Canvas>;
  updateCanvas: (canvasId: string, updates: Partial<Canvas>) => Promise<void>;
  deleteCanvas: (canvasId: string) => Promise<void>;
  moveCanvasToFolder: (canvasId: string, folderId: string | null) => Promise<void>;
  
  // Actions - Papers
  createPaper: (metadata: Record<string, unknown>, source: string, type: 'doi' | 'arxiv' | 'pdf', file?: File) => Promise<Paper>;
  updatePaperStatus: (paperId: string, status: string, data?: Record<string, unknown>) => Promise<void>;
  deletePaper: (paperId: string) => Promise<void>;
  reparsePaper: (paperId: string) => Promise<void>;
  
  // Drag & Drop
  moveFolderToFolder: (folderId: string, targetFolderId: string | null) => Promise<void>;
  calculateFolderDepth: (folderId: string, targetParentId?: string | null) => number;
  canDropItem: (dragType: 'folder' | 'page' | 'canvas', dragId: string, targetType: 'folder' | 'page' | 'canvas', targetId: string) => boolean;
  
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
  canvas: (userId: string) => ['canvas', userId],
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

  // Fetch folders with React Query
  const { 
    data: folders = [], 
    isLoading: foldersLoading,
    error: foldersError 
  } = useQuery({
    queryKey: QUERY_KEYS.folders(user?.id || ''),
    queryFn: () => workspaceAPI.getFolders(user!.id),
    enabled: !!user,
  });

  // Fetch pages with React Query
  const { 
    data: pages = [], 
    isLoading: pagesLoading,
    error: pagesError 
  } = useQuery({
    queryKey: QUERY_KEYS.pages(user?.id || ''),
    queryFn: () => workspaceAPI.getPages(user!.id),
    enabled: !!user,
  });

  // Fetch canvas with React Query
  const { 
    data: canvas = [], 
    isLoading: canvasLoading,
    error: canvasError 
  } = useQuery({
    queryKey: QUERY_KEYS.canvas(user?.id || ''),
    queryFn: () => workspaceAPI.getCanvas(user!.id),
    enabled: !!user,
  });

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
  const loading = foldersLoading || pagesLoading || canvasLoading || workspaceItemsLoading;
  const error = foldersError || pagesError || canvasError || workspaceItemsError 
    ? 'Failed to load workspace data' 
    : null;

  // Refresh workspace data by invalidating queries
  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(user.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages(user.id) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.canvas(user.id) }),
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
  // CANVAS MUTATIONS - Optimistic updates with automatic rollback on error
  // ============================================================================

  const createCanvasMutation = useMutation({
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
    }) => workspaceAPI.createCanvas(userId, title, icon, undefined, folderId),
    onSuccess: (newCanvas) => {
      queryClient.setQueryData<Canvas[]>(
        QUERY_KEYS.canvas(user!.id),
        (old = []) => [...old, newCanvas]
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user!.id) });
    },
  });

  const updateCanvasMutation = useMutation({
    mutationFn: ({ canvasId, updates }: { canvasId: string; updates: Partial<Canvas> }) =>
      workspaceAPI.updateCanvas(canvasId, updates),
    onMutate: async ({ canvasId, updates }) => {
      // Mark as editing to pause real-time updates
      setIsEditing(true);
      if (editingTimerRef.current) clearTimeout(editingTimerRef.current);
      
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.canvas(user!.id) });
      
      const previousCanvas = queryClient.getQueryData<Canvas[]>(QUERY_KEYS.canvas(user!.id));
      
      // Optimistically update
      queryClient.setQueryData<Canvas[]>(
        QUERY_KEYS.canvas(user!.id),
        (old = []) => old.map(c => c.id === canvasId ? { ...c, ...updates } : c)
      );
      
      return { previousCanvas };
    },
    onError: (err, variables, context) => {
      setIsEditing(false);
      if (context?.previousCanvas) {
        queryClient.setQueryData(QUERY_KEYS.canvas(user!.id), context.previousCanvas);
      }
    },
    onSettled: () => {
      // Resume updates after 2 seconds of no editing
      editingTimerRef.current = setTimeout(() => {
        setIsEditing(false);
      }, 2000);
    },
  });

  const deleteCanvasMutation = useMutation({
    mutationFn: (canvasId: string) => workspaceAPI.deleteCanvas(canvasId),
    onMutate: async (canvasId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.canvas(user!.id) });
      
      const previousCanvas = queryClient.getQueryData<Canvas[]>(QUERY_KEYS.canvas(user!.id));
      
      // Optimistically remove
      queryClient.setQueryData<Canvas[]>(
        QUERY_KEYS.canvas(user!.id),
        (old = []) => old.filter(c => c.id !== canvasId)
      );
      
      return { previousCanvas };
    },
    onError: (err, canvasId, context) => {
      if (context?.previousCanvas) {
        queryClient.setQueryData(QUERY_KEYS.canvas(user!.id), context.previousCanvas);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceItems(user!.id) });
    },
  });

  const moveCanvasMutation = useMutation({
    mutationFn: ({ canvasId, folderId }: { canvasId: string; folderId: string | null }) =>
      workspaceAPI.updateCanvas(canvasId, { folder_id: folderId || undefined }),
    onMutate: async ({ canvasId, folderId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.canvas(user!.id) });
      
      const previousCanvas = queryClient.getQueryData<Canvas[]>(QUERY_KEYS.canvas(user!.id));
      
      // Optimistically update
      queryClient.setQueryData<Canvas[]>(
        QUERY_KEYS.canvas(user!.id),
        (old = []) => old.map(c => 
          c.id === canvasId ? { ...c, folder_id: folderId || undefined } : c
        )
      );
      
      return { previousCanvas };
    },
    onError: (err, variables, context) => {
      if (context?.previousCanvas) {
        queryClient.setQueryData(QUERY_KEYS.canvas(user!.id), context.previousCanvas);
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
    if (!user) throw new Error('User not authenticated');
    return createFolderMutation.mutateAsync({ userId: user.id, name, icon, color, description, parentId });
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    await updateFolderMutation.mutateAsync({ folderId, updates });
  };

  const deleteFolder = async (folderId: string) => {
    await deleteFolderMutation.mutateAsync(folderId);
  };

  const createPage = async (
    title: string,
    folderId?: string,
    icon?: string
  ): Promise<Page> => {
    if (!user) throw new Error('User not authenticated');
    return createPageMutation.mutateAsync({ userId: user.id, title, folderId, icon });
  };

  const updatePage = async (pageId: string, updates: Partial<Page>) => {
    await updatePageMutation.mutateAsync({ pageId, updates });
  };

  const deletePage = async (pageId: string) => {
    await deletePageMutation.mutateAsync(pageId);
  };

  const movePageToFolder = async (pageId: string, folderId: string | null) => {
    await movePageMutation.mutateAsync({ pageId, folderId });
  };

  const createCanvas = async (
    title: string,
    folderId?: string,
    icon?: string
  ): Promise<Canvas> => {
    if (!user) throw new Error('User not authenticated');
    return createCanvasMutation.mutateAsync({ userId: user.id, title, folderId, icon });
  };

  const updateCanvas = async (canvasId: string, updates: Partial<Canvas>) => {
    await updateCanvasMutation.mutateAsync({ canvasId, updates });
  };

  const deleteCanvas = async (canvasId: string) => {
    await deleteCanvasMutation.mutateAsync(canvasId);
  };

  const moveCanvasToFolder = async (canvasId: string, folderId: string | null) => {
    await moveCanvasMutation.mutateAsync({ canvasId, folderId });
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
  // CONTEXT VALUE
  // ============================================================================

  const value: WorkspaceContextType = {
    // Data from React Query
    folders,
    pages,
    canvas,
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
    
    // Actions - Canvas
    createCanvas,
    updateCanvas,
    deleteCanvas,
    moveCanvasToFolder,
    
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
