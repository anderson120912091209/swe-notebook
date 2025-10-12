'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCorners, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { getWorkspaceTitle } from '@/app/lib/workspaceTitle';
import CreateFolderModal from './CreateFolderModal';
import CreatePageModal from './CreatePageModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import type { Folder, Page } from '@/app/types/workspace';

// ============================================================================
// INDENTATION SYSTEM - Single source of truth for all objects
// ============================================================================
const INDENT_SIZE = 20; // Increased from 20px for better visual separation

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

function DraggableFolder({
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
      <div className="flex items-center gap-1" style={getIndentStyle(depth, false)}>
        {/* Chevron toggle */}
        {pageCount > 0 && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-5 h-5
             rounded hover:bg-[var(--hover-bg)] active:scale-90"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <path d="M4 2L8 6L4 10" />
            </svg>
          </button>
        )}
        {pageCount === 0 && <div className="w-5" />}

        {/* Folder button - draggable and droppable */}
        <button
          ref={combinedRef}
          {...attributes}
          {...listeners}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`flex-1 flex items-center gap-2 px-3 py-1.5 
            rounded-md text-sm text-left 
            hover:bg-[var(--hover-bg)] active:scale-[0.98] min-w-0 ${
            isActive ? 'font-medium bg-[var(--hover-bg)]' : ''
          } ${isDropTarget && isOver ? 'bg-[var(--active-bg)]' : ''}`}
          style={{
            ...style,
            color: 'var(--foreground)',
            cursor: isBeingDragged ? 'grabbing' : 'grab',
            ...getDepthStyle(depth),
            width: `calc(100% - ${depth * INDENT_SIZE}px)`, // Constrain width to prevent overflow
          }}
        >
          <span>{folder.icon || '📁'}</span>
          <span className="flex-1 truncate min-w-0" title={folder.name}>{folder.name}</span>
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {pageCount}
          </span>
        </button>
      </div>

      {/* Nested content (child folders and pages) */}
      {children}
    </div>
  );
}

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

function DraggablePage({ page, isActive, isBeingDragged, onClick, depth }: DraggablePageProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `page-${page.id}`,
    data: { type: 'page', id: page.id },
  });

  const depthStyle = getDepthStyle(depth);
  const indentAmount = (depth + 1) * INDENT_SIZE; // Pages get +1 depth automatically
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isBeingDragged ? 0.5 : depthStyle.opacity, // Use depth opacity when not being dragged
    cursor: isBeingDragged ? 'grabbing' : 'grab',
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
      className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-sm text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] min-w-0 ${
        isActive ? 'font-medium bg-[var(--hover-bg)]' : ''
      }`}
      style={{
        ...style,
        color: 'var(--foreground)',
      }}
    >
      <span className="text-xs">{page.icon || '📄'}</span>
      <span className="flex-1 truncate min-w-0" title={page.title}>{page.title}</span>
    </button>
  );
}

// ============================================================================
// TRASH ZONE COMPONENT
// ============================================================================
interface TrashZoneProps {
  isHovered: boolean;
  isDragging: boolean;
}

function TrashZone({ isHovered, isDragging }: TrashZoneProps) {
  const { setNodeRef } = useDroppable({
    id: 'trash-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className="mt-4 mx-2 px-4 py-3 rounded-lg transition-all duration-200"
      style={{
        background: isHovered ? 'rgba(239, 68, 68, 0.15)' : isDragging ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
        border: isHovered ? '2px dashed #ef4444' : isDragging ? '2px dashed rgba(239, 68, 68, 0.3)' : '2px dashed var(--border-color)',
        opacity: isDragging ? 1 : 0.5,
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <svg
          className="w-5 h-5 transition-transform duration-200"
          fill="none"
          stroke={isHovered ? '#ef4444' : 'var(--foreground-muted)'}
          viewBox="0 0 24 24"
          style={{
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <span
          className="text-sm font-medium"
          style={{
            color: isHovered ? '#ef4444' : 'var(--foreground-muted)',
          }}
        >
          {isHovered ? 'Drop to Delete' : 'Trash'}
        </span>
      </div>
    </div>
  );
}

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
    currentFolder, 
    currentPage,
    moveFolderToFolder,
    movePageToFolder,
    deleteFolder,
    deletePage,
    canDropItem
  } = useWorkspace();
  const { user } = useAuth();
  const { theme } = useTheme();

  const workspaceTitle = useMemo(() => getWorkspaceTitle(user), [user]);
  const accentBackground = '#68AAEC';
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);
  
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

  // Get root-level folders and pages
  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const rootPages = pages.filter(p => !p.folder_id);
  
  // Debug: Log the data structure
  console.log('=== WORKSPACE DATA DEBUG ===');
  console.log('All folders:', folders.map(f => ({ id: f.id, name: f.name, parent_folder_id: f.parent_folder_id })));
  console.log('All pages:', pages.map(p => ({ id: p.id, title: p.title, folder_id: p.folder_id })));
  console.log('Root folders:', rootFolders.map(f => f.name));
  console.log('Root pages:', rootPages.map(p => p.title));

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

  // Monitor sidebar width to detect compression
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        // Consider compressed if width is less than 280px (enough for icons + "Folder"/"Page" but not "New")
        setIsCompressed(width < 280);
      }
    };

    // Initial check
    handleResize();

    // Use ResizeObserver for efficient width monitoring
    const resizeObserver = new ResizeObserver(handleResize);
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      resizeObserver.observe(sidebar);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [sidebarOpen]);

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

  // Get pages for each folder
  const getFolderPages = (folderId: string) => {
    const result = pages.filter(p => p.folder_id === folderId);
    console.log(`getFolderPages(${folderId}):`, result.map(p => p.title));
    return result;
  };

  const getChildFolders = (parentFolderId: string) => {
    const result = folders.filter(f => f.parent_folder_id === parentFolderId);
    console.log(`getChildFolders(${parentFolderId}):`, result.map(f => f.name));
    return result;
  };

  const isActive = (id: string, type: 'folder' | 'page') => {
    if (type === 'folder') {
      return currentFolder?.id === id || pathname.includes(`/folder/${id}`);
    }
    return currentPage?.id === id || pathname.includes(`/page/${id}`);
  };

  const navigateToWorkspace = () => {
    router.push('/notebook');
  };

  const navigateToFolder = (folderId: string) => {
    router.push(`/notebook/folder/${folderId}`);
  };

  const navigateToPage = (pageId: string) => {
    router.push(`/notebook/page/${pageId}`);
  };

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
    // Format is "type-uuid", but UUIDs contain dashes, so we need to be careful
    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();
    
    // Check if dropped on trash
    if (overIdStr === 'trash-zone') {
      const dragType = activeIdStr.split('-')[0] as 'folder' | 'page';
      const dragId = activeIdStr.substring(dragType.length + 1);
      
      // Trigger delete confirmation
      handleDeleteRequest(dragId, dragType);
      return;
    }
    
    // Split only on the first dash
    const dragType = activeIdStr.split('-')[0] as 'folder' | 'page';
    const dragId = activeIdStr.substring(dragType.length + 1); // Get everything after "type-"
    
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
    
    const type = activeId.split('-')[0];
    const id = activeId.substring(type.length + 1);
    
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
                isBeingDragged={activeId === `page-${page.id}`}
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
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="w-full h-full overflow-y-auto overflow-x-hidden"
        style={{
          padding: '32px 16px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: sidebarOpen ? '0.1s' : '0s',
          minWidth: '200px', // Minimum usable width
        }}
      >
      {/* Header */}
      <div className="mb-6 px-2">
        <button
          onClick={navigateToWorkspace}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--hover-bg)] text-left"
          style={{ color: 'var(--foreground)' }}
        >
          {sidebarOpen && (
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              aria-hidden="true"
              style={{ background: accentBackground }}
            />
          )}
          <span className="font-semibold truncate">{workspaceTitle}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mb-4 px-2 flex gap-2">
        <button
          onClick={() => setShowNewFolderModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs hover:bg-[var(--hover-bg)]"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{isCompressed ? 'Folder' : 'New Folder'}</span>
        </button>
        <button
          onClick={() => setShowNewPageModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs hover:bg-[var(--hover-bg)]"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{isCompressed ? 'Page' : 'New Page'}</span>
        </button>
      </div>

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
          {/* Spaces Section Header */}
          {rootFolders.length > 0 && (
            <div className="px-3 py-1 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
              Spaces
            </div>
          )}
          
          {/* Root Folders - Rendered recursively with nested folders */}
          {rootFolders.map(folder => renderFolder(folder, 0))}

        {/* Root Pages (not in any folder) - Now Draggable */}
        {rootPages.length > 0 && (
          <div className="pt-2">
            {rootFolders.length > 0 && (
              <div className="px-3 py-1 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                Pages
              </div>
            )}
            {rootPages.map(page => (
              <DraggablePage
                key={page.id}
                page={page}
                isActive={isActive(page.id, 'page')}
                isBeingDragged={activeId === `page-${page.id}`}
                onClick={() => navigateToPage(page.id)}
                depth={0}
              />
            ))}
          </div>
        )}
        </nav>

        {/* Trash Zone - Droppable area for deleting items */}
        <TrashZone isHovered={overId === 'trash-zone'} isDragging={activeId !== null} />

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
      {showNewFolderModal && (
        <CreateFolderModal 
          onClose={() => setShowNewFolderModal(false)}
          onSuccess={(folderId) => {
            setShowNewFolderModal(false);
            router.push(`/notebook/folder/${folderId}`);
          }}
        />
      )}
      {showNewPageModal && (
        <CreatePageModal onClose={() => setShowNewPageModal(false)} />
      )}
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
    </aside>
  );
}
