'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCorners, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import CreateFolderModal from './CreateFolderModal';
import CreatePageModal from './CreatePageModal';
import type { Folder, Page } from '@/app/types/workspace';

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
    background: isDropTarget && isOver ? 'var(--active-bg)' : isActive ? 'var(--hover-bg)' : 'transparent',
    border: isOver ? '2px solid #3b82f6' : undefined,
    transition: 'background-color 0.2s, border 0.2s',
  };

  // Combine refs
  const combinedRef = (element: HTMLButtonElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        {/* Chevron toggle */}
        {pageCount > 0 && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--hover-bg)] active:scale-90 transition-all duration-150"
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
          className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150 text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] ${
            isActive ? 'font-medium' : ''
          }`}
          style={{
            ...style,
            color: 'var(--foreground)',
            cursor: isBeingDragged ? 'grabbing' : 'grab',
          }}
        >
          <span>{folder.icon || '📁'}</span>
          <span className="flex-1 truncate">{folder.name}</span>
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {pageCount}
          </span>
        </button>
      </div>

      {/* Pages in folder */}
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
}

function DraggablePage({ page, isActive, isBeingDragged, onClick }: DraggablePageProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `page-${page.id}`,
    data: { type: 'page', id: page.id },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isBeingDragged ? 0.5 : 1,
    cursor: isBeingDragged ? 'grabbing' : 'grab',
    background: isActive ? 'var(--hover-bg)' : 'transparent',
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
      className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all duration-150 text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] ${
        isActive ? 'font-medium' : ''
      }`}
      style={{
        ...style,
        color: 'var(--foreground)',
      }}
    >
      <span className="text-xs">{page.icon || '📄'}</span>
      <span className="flex-1 truncate">{page.title}</span>
    </button>
  );
}

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
    canDropItem
  } = useWorkspace();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  
  // Drag & Drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
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

  // Get pages for each folder
  const getFolderPages = (folderId: string) => {
    return pages.filter(p => p.folder_id === folderId);
  };

  const getChildFolders = (parentFolderId: string) => {
    return folders.filter(f => f.parent_folder_id === parentFolderId);
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
  // RECURSIVE FOLDER RENDERING
  // ============================================================================
  
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
      >
        {/* Render nested content when expanded */}
        {isExpanded && itemCount > 0 && (
          <div className="ml-9 mt-0.5 space-y-0.5">
            {/* Render child folders recursively */}
            {childFolders.map(childFolder => renderFolder(childFolder, depth + 1))}
            
            {/* Render pages in this folder */}
            {folderPages.map(page => (
              <DraggablePage
                key={page.id}
                page={page}
                isActive={isActive(page.id, 'page')}
                isBeingDragged={activeId === `page-${page.id}`}
                onClick={() => navigateToPage(page.id)}
              />
            ))}
          </div>
        )}
      </DraggableFolder>
    );
  };

  return (
    <aside
      className="relative shrink-0 overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: sidebarOpen ? '1px solid var(--border-color)' : 'none',
        width: sidebarOpen ? '288px' : '0px',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="w-[288px] h-full overflow-y-auto"
        style={{
          padding: '32px 16px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: sidebarOpen ? '0.1s' : '0s',
        }}
      >
      {/* Header */}
      <div className="mb-6 px-2">
        <button
          onClick={navigateToWorkspace}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-left"
          style={{ color: 'var(--foreground)' }}
        >
          <span className="text-xl">📚</span>
          <span className="font-semibold">Workspace</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mb-4 px-2 flex gap-2">
        <button
          onClick={() => setShowNewFolderModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span> New Folder</span>
        </button>
        <button
          onClick={() => setShowNewPageModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span> New Page</span>
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
        <nav className="space-y-1">
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
              />
            ))}
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
      </div>
    </aside>
  );
}

