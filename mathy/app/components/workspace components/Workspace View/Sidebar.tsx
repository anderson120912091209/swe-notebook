'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Tooltip } from "@heroui/react";
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { getWorkspaceTitle } from '@/app/lib/workspaceTitle';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import type { Folder, Page } from '@/app/types/workspace';

const FALLBACK_COLOR = '#9CC5FF';

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!/^#?[0-9a-f]{3,6}$/i.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function expandToSixDigit(hex: string): string {
  if (hex.length === 7) return hex.toUpperCase();
  const expanded = hex.slice(1).split('').map(c => c + c).join('');
  return `#${expanded.toUpperCase()}`;
}

function parseHex(color?: string | null) {
  const normalized = normalizeHex(color);
  if (!normalized) return null;
  const full = expandToSixDigit(normalized);
  const intValue = parseInt(full.slice(1), 16);
  return {
    hex: full,
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function lightenHex(hex: string, amount: number): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;

  const { r, g, b } = parsed;
  const lighten = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * amount));

  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}

// ============================================================================
// INDENTATION SYSTEM - Single source of truth for all objects
// ============================================================================
const INDENT_SIZE = 12; // Reduced for tighter nesting

/**
 * Get consistent indentation style for any object (folder, page, future objects)
 * @param depth - The nesting level (0 = root, 1 = first level, etc.)
 * @param isPage - Whether this is a page (pages get +1 depth automatically)
 * @returns Style object with marginLeft
 */
const getIndentStyle = (depth: number, isPage: boolean = false) => ({
  marginLeft: `${Math.max(depth + (isPage ? 1 : 0), 0) * INDENT_SIZE}px`,
});

/**
 * Get visual styling for depth-based hierarchy
 * @param depth - The nesting level
 * @returns Additional style properties for visual hierarchy
 */
const getDepthStyle = (depth: number) => ({
  // Subtle opacity change for deeper nesting (optional)
  opacity: depth > 2 ? 0.9 : 1,
  // Border radius decreases slightly with depth for visual hierarchy
  borderRadius: Math.max(6 - depth, 4),
});

// ============================================================================
// DRAGGABLE FOLDER ITEM
// ============================================================================
interface DraggableFolderProps {
  folder: Folder;
  isActive: boolean;
  isExpanded: boolean;
  isBeingDragged: boolean;
  isDropTarget: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClick: () => void;
  children?: React.ReactNode;
  pageCount: number;
  depth: number;
}

const DraggableFolder = React.memo(function DraggableFolder({
  folder,
  isActive,
  isExpanded,
  isBeingDragged,
  isDropTarget,
  onToggle,
  onClick,
  children,
  pageCount,
  depth,
}: DraggableFolderProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isBeingDragged ? 0.5 : 1,
    border: isOver ? '2px solid #3b82f6' : undefined,
  };

  // Combine refs
  const combinedRef = (element: HTMLButtonElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-md transition-colors
          ${isActive ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)]'}
          ${isDropTarget && isOver ? 'bg-[var(--active-bg)]' : ''}`}
        style={getIndentStyle(depth, false)}
      >
        {/* Toggle/Icon Button - Swaps between Folder and Chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (pageCount > 0) onToggle(e);
          }}
          className={`flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-md transition-colors
            ${pageCount > 0 ? 'hover:bg-[var(--hover-bg)] cursor-pointer' : 'cursor-default'}`}
          style={{ color: 'var(--foreground-muted)' }}
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            {/* Folder Icon - Default visible, hidden on hover if expandable */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200
              ${pageCount > 0 ? 'opacity-100 group-hover:opacity-0' : 'opacity-100'}`}
            >
              <svg fill={folder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>

            {/* Chevron - Default hidden, visible on hover if expandable */}
            {pageCount > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )}
          </div>
        </button>

        {/* Folder Name & Drag Handle */}
        <button
          ref={combinedRef}
          {...attributes}
          {...listeners}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`flex-1 flex items-center gap-2 min-w-0 text-sm text-left
            ${isActive ? 'font-medium' : ''}`}
          style={{
            ...style,
            color: 'var(--foreground)',
            cursor: isBeingDragged ? 'grabbing' : 'pointer',
            // Removed width calc since flex-1 handles it, and padding is now on parent
          }}
        >
          <span className="flex-1 truncate min-w-0 text-left" title={folder.name}>{folder.name}</span>
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {pageCount}
          </span>
        </button>
      </div>

      {/* Nested content (child folders and pages) */}
      {children}
    </div>
  );
});

// ============================================================================
// DRAGGABLE PAGE ITEM
// ============================================================================
interface DraggablePageProps {
  page: Page;
  isActive: boolean;
  isBeingDragged: boolean;
  onClick: () => void;
  depth: number;
}

const DraggablePage = React.memo(function DraggablePage({ page, isActive, isBeingDragged, onClick, depth }: DraggablePageProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `folder-page-${page.id}`,
    data: { type: 'page', id: page.id },
  });

  const depthStyle = getDepthStyle(depth);
  const indentAmount = (depth + 1) * INDENT_SIZE; // Pages get +1 depth automatically
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isBeingDragged ? 0.5 : depthStyle.opacity, // Use depth opacity when not being dragged
    cursor: isBeingDragged ? 'grabbing' : 'pointer',
    marginLeft: `${indentAmount}px`,
    width: `calc(100% - ${indentAmount}px)`, // Constrain width to prevent overflow
    borderRadius: depthStyle.borderRadius,
  };

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] min-w-0 transition-colors ${isActive ? 'font-medium bg-[var(--hover-bg)]' : ''
        }`}
      style={{
        ...style,
        color: 'var(--foreground)',
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <span className="flex-1 truncate min-w-0 text-left" title={page.title}>{page.title}</span>
    </button>
  );
});

// ============================================================================
// RECENT PAGE ITEM WITH FOLDER TAG
// ============================================================================
interface RecentPageProps {
  page: Page;
  folder?: Folder | null;
  isActive: boolean;
  isBeingDragged: boolean;
  onClick: () => void;
}

const RecentPage = React.memo(function RecentPage({ page, folder, isActive, isBeingDragged, onClick }: RecentPageProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `recent-page-${page.id}`,
    data: { type: 'page', id: page.id },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isBeingDragged ? 0.5 : 1,
    cursor: isBeingDragged ? 'grabbing' : 'pointer',
  };

  // Create muted folder color for the tag
  const baseColor = parseHex(folder?.color)?.hex ?? FALLBACK_COLOR;
  const mutedFolderColor = lightenHex(baseColor, 0.7);

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] min-w-0 transition-colors ${isActive ? 'font-medium bg-[var(--hover-bg)]' : ''
        }`}
      style={{
        ...style,
        color: 'var(--foreground)',
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <span className="flex-1 truncate min-w-0 text-left" title={page.title}>{page.title}</span>
      {folder && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 
          rounded-md text-xs font-medium flex-shrink-0 w-16
           hover:w-auto hover:max-w-none transition-all 
           duration-200 ease-out group"
          style={{
            background: mutedFolderColor,
            color: '#374151'
          }}
        >
          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill={folder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="truncate group-hover:whitespace-nowrap transition-all duration-200 ease-out" title={folder.name}>{folder.name}</span>
        </span>
      )}
    </button>
  );
});


// ============================================================================
// TRASH BUTTON COMPONENT - Droppable for deletion
// ============================================================================
const TrashButton = React.memo(function TrashButton() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-button',
  });

  return (
    <button
      ref={setNodeRef}
      onClick={() => {
        // You can implement trash functionality here
        console.log('Trash clicked');
      }}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer"
      style={{
        color: 'var(--foreground)',
        background: isOver ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
        border: isOver ? '2px dashed #ef4444' : 'none',
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: isOver ? '#ef4444' : 'var(--foreground-muted)',
            transform: isOver ? 'scale(1.1)' : 'scale(1)',
            transition: 'color 0.2s ease, transform 0.2s ease',
          }}
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </div>
      <span
        className="text-sm font-medium"
        style={{ color: isOver ? '#ef4444' : 'var(--foreground)' }}
      >
        {isOver ? 'Drop to Delete' : 'Trash'}
      </span>
    </button>
  );
});

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    folders,
    pages,
    sidebarOpen,
    setSidebarOpen,
    currentFolder,
    currentPage,
    moveFolderToFolder,
    movePageToFolder,
    deleteFolder,
    deletePage,
    canDropItem,
    createFolder,
    createPage
  } = useWorkspace();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const workspaceTitle = useMemo(() => getWorkspaceTitle(user), [user]);
  const accentBackground = '#68AAEC';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
      if (showCreateMenu && !target.closest('.create-menu-container')) {
        setShowCreateMenu(false);
      }
    };

    if (showProfileMenu || showCreateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showCreateMenu]);

  // Drag & Drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Delete/Trash state
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'folder' | 'page' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Initialize expanded folders from localStorage
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expandedFolders');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Get root-level folders (memoized to prevent recalculation)
  const rootFolders = useMemo(() => folders.filter(f => !f.parent_folder_id), [folders]);

  // Get recent pages (5 most recently edited pages across all folders)
  const recentPages = useMemo(() => {
    return [...pages]
      .sort((a, b) => new Date(b.last_edited_at).getTime() - new Date(a.last_edited_at).getTime())
      .slice(0, 5);
  }, [pages]);

  // Auto-expand folder when viewing a page inside it
  useEffect(() => {
    if (currentPage?.folder_id) {
      setExpandedFolders(prev => {
        if (!prev.has(currentPage.folder_id!)) {
          const next = new Set(prev);
          next.add(currentPage.folder_id!);
          // Save to localStorage
          localStorage.setItem('expandedFolders', JSON.stringify([...next]));
          return next;
        }
        return prev;
      });
    }
  }, [currentPage]);


  // Toggle folder expanded state
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      // Save to localStorage
      localStorage.setItem('expandedFolders', JSON.stringify([...next]));
      return next;
    });
  };

  // Get pages for each folder (memoized)
  const getFolderPages = useCallback((folderId: string) => {
    return pages.filter(p => p.folder_id === folderId);
  }, [pages]);

  // Get child folders (memoized)
  const getChildFolders = useCallback((parentFolderId: string) => {
    return folders.filter(f => f.parent_folder_id === parentFolderId);
  }, [folders]);

  // Check if item is active (memoized)
  const isActive = useCallback((id: string, type: 'folder' | 'page') => {
    if (type === 'folder') {
      return currentFolder?.id === id || pathname.includes(`/folder/${id}`);
    }
    return currentPage?.id === id || pathname.includes(`/page/${id}`);
  }, [currentFolder, currentPage, pathname]);

  // Navigation handlers (memoized)
  const navigateToWorkspace = useCallback(() => {
    router.push('/notebook');
  }, [router]);

  const navigateToFolder = useCallback((folderId: string) => {
    router.push(`/notebook/folder/${folderId}`);
  }, [router]);

  const navigateToPage = useCallback((pageId: string) => {
    router.push(`/notebook/page/${pageId}`);
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  // ============================================================================
  // CREATE HANDLERS - Immediate creation, no prompts
  // ============================================================================

  const handleCreateFolder = useCallback(async () => {
    try {
      // Create folder immediately with default values
      const defaultColor = '#5A7FA3';
      await createFolder('New Folder', undefined, defaultColor);
      setShowCreateMenu(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [createFolder]);

  const handleCreatePage = useCallback(async () => {
    try {
      // Create page immediately with default title
      const newPage = await createPage('Untitled Page');
      setShowCreateMenu(false);
      // Navigate to the new page
      router.push(`/notebook/page/${newPage.id}`);
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  }, [createPage, router]);

  // ============================================================================
  // DELETE/TRASH HANDLERS
  // ============================================================================

  const handleDeleteRequest = (id: string, type: 'folder' | 'page') => {
    setSelectedItem({ id, type });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'folder') {
        await deleteFolder(selectedItem.id);
      } else {
        await deletePage(selectedItem.id);
      }
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const getItemName = () => {
    if (!selectedItem) return '';

    if (selectedItem.type === 'folder') {
      const folder = folders.find(f => f.id === selectedItem.id);
      return folder?.name || 'Untitled Folder';
    } else {
      const page = pages.find(p => p.id === selectedItem.id);
      return page?.title || 'Untitled Page';
    }
  };

  const hasChildren = () => {
    if (!selectedItem || selectedItem.type !== 'folder') return false;

    const folderPages = getFolderPages(selectedItem.id);
    const childFolders = getChildFolders(selectedItem.id);
    return folderPages.length > 0 || childFolders.length > 0;
  };

  // Keyboard event handler for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();

        // Check if we have a currently viewed item
        if (currentPage) {
          handleDeleteRequest(currentPage.id, 'page');
        } else if (currentFolder) {
          handleDeleteRequest(currentFolder.id, 'folder');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, currentFolder]);

  // ============================================================================
  // DRAG & DROP HANDLERS
  // ============================================================================

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    // Extract type and id from the drag/drop ids
    // Format is "context-type-uuid", but UUIDs contain dashes, so we need to be careful
    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    // Check if dropped on trash
    if (overIdStr === 'trash-button') {
      // Handle different ID formats: folder-*, folder-page-*, recent-page-*
      let dragType: 'folder' | 'page';
      let dragId: string;

      if (activeIdStr.startsWith('folder-page-')) {
        dragType = 'page';
        dragId = activeIdStr.substring('folder-page-'.length);
      } else if (activeIdStr.startsWith('recent-page-')) {
        dragType = 'page';
        dragId = activeIdStr.substring('recent-page-'.length);
      } else if (activeIdStr.startsWith('folder-')) {
        dragType = 'folder';
        dragId = activeIdStr.substring('folder-'.length);
      } else {
        // Fallback for old format
        dragType = activeIdStr.split('-')[0] as 'folder' | 'page';
        dragId = activeIdStr.substring(dragType.length + 1);
      }

      // Trigger delete confirmation
      handleDeleteRequest(dragId, dragType);
      return;
    }

    // Parse drag item type and ID
    let dragType: 'folder' | 'page';
    let dragId: string;

    if (activeIdStr.startsWith('folder-page-')) {
      dragType = 'page';
      dragId = activeIdStr.substring('folder-page-'.length);
    } else if (activeIdStr.startsWith('recent-page-')) {
      dragType = 'page';
      dragId = activeIdStr.substring('recent-page-'.length);
    } else if (activeIdStr.startsWith('folder-')) {
      dragType = 'folder';
      dragId = activeIdStr.substring('folder-'.length);
    } else {
      // Fallback for old format
      dragType = activeIdStr.split('-')[0] as 'folder' | 'page';
      dragId = activeIdStr.substring(dragType.length + 1);
    }

    const targetType = overIdStr.split('-')[0] as 'folder' | 'page';
    const targetId = overIdStr.substring(targetType.length + 1); // Get everything after "type-"

    // Validate the drop
    if (!canDropItem(dragType, dragId, targetType, targetId)) {
      console.log('Invalid drop - validation failed');
      return;
    }

    try {
      if (dragType === 'folder') {
        await moveFolderToFolder(dragId, targetId);
      } else if (dragType === 'page') {
        await movePageToFolder(dragId, targetId);
      }
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Get the active drag item for overlay
  const getActiveItem = () => {
    if (!activeId) return null;

    let type: string;
    let id: string;

    if (activeId.startsWith('folder-page-')) {
      type = 'page';
      id = activeId.substring('folder-page-'.length);
    } else if (activeId.startsWith('recent-page-')) {
      type = 'page';
      id = activeId.substring('recent-page-'.length);
    } else if (activeId.startsWith('folder-')) {
      type = 'folder';
      id = activeId.substring('folder-'.length);
    } else {
      // Fallback for old format
      type = activeId.split('-')[0];
      id = activeId.substring(type.length + 1);
    }

    if (type === 'folder') {
      return folders.find(f => f.id === id);
    } else {
      return pages.find(p => p.id === id);
    }
  };

  // ============================================================================
  // RECURSIVE FOLDER RENDERING - DEPTH MANAGEMENT
  // ============================================================================

  /**
   * Recursively renders folders with proper depth management
   * - Root folders start at depth 0
   * - Each nested level increases depth by 1
   * - Child folders inherit parent depth + 1
   * - Pages automatically get +1 extra depth (so pages are always more indented than folders at same level)
   * - Drag & drop operations automatically update depth when items are moved
   */
  const renderFolder = (folder: Folder, depth: number = 0): React.ReactElement => {
    const folderPages = getFolderPages(folder.id);
    const childFolders = getChildFolders(folder.id);
    const itemCount = folderPages.length + childFolders.length;
    const active = isActive(folder.id, 'folder');
    const isExpanded = expandedFolders.has(folder.id);
    const isBeingDragged = activeId === `folder-${folder.id}`;
    const isDropTarget = overId === `folder-${folder.id}`;


    return (
      <DraggableFolder
        key={folder.id}
        folder={folder}
        isActive={active}
        isExpanded={isExpanded}
        isBeingDragged={isBeingDragged}
        isDropTarget={isDropTarget}
        onToggle={(e) => toggleFolder(folder.id, e)}
        onClick={() => navigateToFolder(folder.id)}
        pageCount={itemCount}
        depth={depth}
      >
        {/* Render nested content when expanded */}
        {isExpanded && itemCount > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {/* Render child folders recursively at depth + 1 */}
            {childFolders.map(childFolder => renderFolder(childFolder, depth + 1))}

            {/* Render pages in this folder at depth + 1 */}
            {folderPages.map(page => (
              <DraggablePage
                key={page.id}
                page={page}
                isActive={isActive(page.id, 'page')}
                isBeingDragged={activeId === `folder-page-${page.id}`}
                onClick={() => navigateToPage(page.id)}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </DraggableFolder>
    );
  };

  return (
    <aside
      className="relative h-full overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: sidebarOpen ? '1px solid var(--border-color)' : 'none',
        width: sidebarOpen ? '100%' : '0px',
        minWidth: sidebarOpen ? '180px' : '0px', // This controls the actual sidebar width limit
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col"
        style={{
          padding: '0px 16px 16px 16px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: sidebarOpen ? '0.1s' : '0s',
          minWidth: '180px', // Minimum usable width
        }}
      >
        {/* Header - Fixed height to match top header */}
        <div className="h-16 flex items-center relative" style={{ marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
          <div className="flex items-center gap-2 w-full min-w-0">
            <button
              onClick={navigateToWorkspace}
              className="flex-1 flex items-center gap-2 px-3 py-1.5 
            rounded-md hover:bg-[var(--hover-bg)] text-left min-w-0 cursor-pointer transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {sidebarOpen && (
                user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="h-5 w-5 rounded-md flex-shrink-0 
                  border-1 border-white/50 object-cover"
                  />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    aria-hidden="true"
                    style={{ background: accentBackground }}
                  />
                )
              )}
              <span className="font-semibold text-sm truncate min-w-0 text-left" title={workspaceTitle}>
                {workspaceTitle}
              </span>
            </button>

            {/* Create Button - Prominent Design */}
            <div className="relative create-menu-container">
              <button
                ref={createButtonRef}
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md 
                transition-all flex-shrink-0 cursor-pointer font-medium text-sm shadow-sm hover:shadow-md"
                style={{
                  background: accentBackground,
                  color: '#ffffff',
                  border: 'none'
                }}
                title="Create new page or folder"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm">New</span>
              </button>

              {/* Dropdown Menu */}
              {showCreateMenu && (
                <div
                  ref={createMenuRef}
                  className="absolute top-8 right-0 rounded-lg shadow-lg border py-1 z-[9999] min-w-[160px]"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <button
                    onClick={handleCreatePage}
                    className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span>New Page</span>
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <svg fill="currentColor" stroke="none" viewBox="0 0 24 24">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <span>New Folder</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Toggle Button - Small */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--hover-bg)] transition-colors flex-shrink-0 cursor-pointer"
              style={{ color: 'var(--foreground-muted)' }}
              title="Hide sidebar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>


          {/* Navigation Tree with Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <nav className="space-y-1 min-w-0">
              {/* Top Navigation Items */}
              <div className="space-y-0.5 mb-3">
                {/* Home */}
                <button
                  onClick={() => router.push('/notebook')}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors cursor-pointer text-left ${pathname === '/notebook' ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)]'
                    }`}
                  style={{ color: 'var(--foreground)' }}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Home</span>
                </button>

                {/* Search */}

                <button
                  onClick={() => {
                    // You can implement search functionality here
                    console.log('Search clicked');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer text-left"
                  style={{ color: 'var(--foreground)' }}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Search</span>
                </button>


                {/* Community */}
                <Tooltip
                  content="Public learning space (coming soon)"
                  placement="right"
                  classNames={{
                    content: "bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded-md border border-zinc-800 shadow-xl",
                  }}
                  delay={0}
                  closeDelay={0}
                >
                  <button
                    onClick={() => router.push('/community')}
                    className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer text-left"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Community</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide"
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)', // Slightly more visible background
                        color: '#60a5fa', // Lighter blue for better contrast on dark
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                      }}
                    >
                      Building
                    </span>
                  </button>
                </Tooltip>
              </div>



              {/* Spaces Section Header */}
              {rootFolders.length > 0 && (
                <div className="px-3 py-1.5 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                  Workspace
                </div>
              )}

              {/* Root Folders - Rendered recursively with nested folders */}
              {rootFolders.map(folder => renderFolder(folder, 0))}

              {/* Recent Pages - 5 most recently edited pages */}
              {recentPages.length > 0 && (
                <div className="pt-2">
                  {rootFolders.length > 0 && (
                    <div className="px-3 py-1.5 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                      Recents
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {recentPages.map(page => {
                      const folder = page.folder_id ? folders.find(f => f.id === page.folder_id) : null;
                      return (
                        <RecentPage
                          key={page.id}
                          page={page}
                          folder={folder}
                          isActive={isActive(page.id, 'page')}
                          isBeingDragged={activeId === `recent-page-${page.id}`}
                          onClick={() => navigateToPage(page.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>


            {/* Drag Overlay - shows dragged item */}
            <DragOverlay>
              {activeId ? (
                <div
                  className="px-3 py-1.5 rounded-md text-sm"
                  style={{
                    background: 'var(--hover-bg)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border-color)',
                    opacity: 0.8,
                    cursor: 'grabbing',
                  }}
                >
                  {(() => {
                    const item = getActiveItem();
                    if (!item) return null;
                    const icon = 'icon' in item ? item.icon : '📄';
                    const name = 'name' in item ? item.name : 'title' in item ? item.title : '';
                    return (
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="truncate">{name}</span>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Modals */}
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedItem(null);
            }}
            onConfirm={handleDeleteConfirm}
            itemType={selectedItem?.type || 'page'}
            itemName={getItemName()}
            hasChildren={hasChildren()}
          />
        </div>

        {/* Bottom Menu Items */}
        <div className="pt-2 mt-auto pb-2">
          {/* Main Menu Items */}
          <div className="space-y-0.5 mb-3">
            {/* Ask a Question */}
            <button
              onClick={() => {
                // You can implement ask a question functionality here
                console.log('Ask a question clicked');
              }}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer text-left"
              style={{ color: 'var(--foreground)' }}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="text-sm font-medium">Ask a question</span>
            </button>

            {/* Academy */}
            <button
              onClick={() => window.open('https://academy.example.com', '_blank')}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer text-left"
              style={{ color: 'var(--foreground)' }}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <span className="text-sm font-medium">Academy</span>
            </button>

            {/* Documentation */}
            <button
              onClick={() => window.open('https://docs.example.com', '_blank')}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer text-left"
              style={{ color: 'var(--foreground)' }}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Documentation</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--foreground-muted)', marginLeft: 'auto' }}
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </button>

            {/* Feedback */}
            <button
              onClick={() => window.open('https://feedback.example.com', '_blank')}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--hover-bg)] cursor-pointer text-left"
              style={{ color: 'var(--foreground)' }}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <span className="text-sm font-medium">Feedback</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--foreground-muted)', marginLeft: 'auto' }}
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </button>

            {/* Trash - Droppable for deletion */}
            <TrashButton />
          </div>

          {/* Bottom Icon Row */}
          <div className="flex items-center justify-start gap-4 px-3">
            {/* Home */}
            <button
              onClick={navigateToWorkspace}
              className="w-6 h-6 flex items-center justify-center transition-colors hover:bg-[var(--hover-bg)] rounded cursor-pointer"
              title="Home"
              aria-label="Home"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                // You can implement settings functionality here
                console.log('Settings clicked');
              }}
              className="w-6 h-6 flex items-center justify-center transition-colors hover:bg-[var(--hover-bg)] rounded cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-6 h-6 flex items-center justify-center transition-colors hover:bg-[var(--hover-bg)] rounded cursor-pointer"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  color: 'var(--foreground-muted)',
                  transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease',
                }}
              >
                {theme === 'light' ? (
                  // Sun icon for light mode
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </>
                ) : (
                  // Moon icon for dark mode
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                )}
              </svg>
            </button>

            {/* User Profile */}
            <div className="relative profile-menu-container">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-6 h-6 flex items-center justify-center transition-colors hover:bg-[var(--hover-bg)] rounded cursor-pointer"
                title="User Profile"
                aria-label="User Profile"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  ref={profileMenuRef}
                  className="fixed bottom-16 left-4 w-48 rounded-lg shadow-lg border py-1 z-[9999]"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}>
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {user?.user_metadata?.preferred_name ||
                        user?.user_metadata?.given_name ||
                        user?.email?.split('@')[0] ||
                        'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside >
  );
}
