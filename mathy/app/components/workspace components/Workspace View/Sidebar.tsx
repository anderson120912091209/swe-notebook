'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
  onMouseEnter,
}: DraggableFolderProps & { onMouseEnter?: () => void }) {
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
        className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md transition-all duration-200 border border-transparent
          ${isActive ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)] hover:border-[rgba(128,128,128,0.2)]'}
          ${isDropTarget && isOver ? 'bg-[var(--active-bg)]' : ''}`}
        style={getIndentStyle(depth, false)}
        onMouseEnter={onMouseEnter}
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
              {pageCount === 0 ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                  <path opacity="0.5" d="M22 14V11.7979C22 9.16554 22 7.84935 21.2305 6.99383C21.1598 6.91514 21.0849 6.84024 21.0062 6.76946C20.1506 6 18.8345 6 16.2021 6H15.8284C14.6747 6 14.0979 6 13.5604 5.84678C13.2651 5.7626 12.9804 5.64471 12.7121 5.49543C12.2237 5.22367 11.8158 4.81578 11 4L10.4497 3.44975C10.1763 3.17633 10.0396 3.03961 9.89594 2.92051C9.27652 2.40704 8.51665 2.09229 7.71557 2.01738C7.52976 2 7.33642 2 6.94975 2C6.06722 2 5.62595 2 5.25839 2.06935C3.64031 2.37464 2.37464 3.64031 2.06935 5.25839C2 5.62595 2 6.06722 2 6.94975V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z" fill={folder.color || '#6b7280'}/>
                  <path d="M12.25 10C12.25 9.58579 12.5858 9.25 13 9.25H18C18.4142 9.25 18.75 9.58579 18.75 10C18.75 10.4142 18.4142 10.75 18 10.75H13C12.5858 10.75 12.25 10.4142 12.25 10Z" fill={folder.color || '#6b7280'}/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                  <path opacity="0.5" d="M2 6.94975C2 6.06722 2 5.62595 2.06935 5.25839C2.37464 3.64031 3.64031 2.37464 5.25839 2.06935C5.62595 2 6.06722 2 6.94975 2C7.33642 2 7.52976 2 7.71557 2.01738C8.51665 2.09229 9.27652 2.40704 9.89594 2.92051C10.0396 3.03961 10.1763 3.17633 10.4497 3.44975L11 4C11.8158 4.81578 12.2237 5.22367 12.7121 5.49543C12.9804 5.64471 13.2651 5.7626 13.5604 5.84678C14.0979 6 14.6747 6 15.8284 6H16.2021C18.8345 6 20.1506 6 21.0062 6.76946C21.0849 6.84024 21.1598 6.91514 21.2305 6.99383C22 7.84935 22 9.16554 22 11.7979V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V6.94975Z" fill={folder.color || '#6b7280'}/>
                  <path d="M20 6.23751C19.9992 5.94016 19.9949 5.76263 19.9746 5.60842C19.7974 4.26222 18.7381 3.2029 17.3919 3.02567C17.1969 3 16.9647 3 16.5003 3H9.98828C10.1042 3.10392 10.2347 3.23445 10.45 3.44975L11.0003 4C11.8161 4.81578 12.2239 5.22367 12.7124 5.49543C12.9807 5.64471 13.2653 5.7626 13.5606 5.84678C14.0982 6 14.675 6 15.8287 6H16.2024C17.9814 6 19.1593 6 20 6.23751Z" fill={folder.color || '#6b7280'}/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.25 10C12.25 9.58579 12.5858 9.25 13 9.25H18C18.4142 9.25 18.75 9.58579 18.75 10C18.75 10.4142 18.4142 10.75 18 10.75H13C12.5858 10.75 12.25 10.4142 12.25 10Z" fill={folder.color || '#6b7280'}/>
                </svg>
              )}
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
          <span className="flex-1 truncate min-w-0 text-left font-medium" title={folder.name}>{folder.name}</span>
          <span className="text-[10px]" style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}>
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

const DraggablePage = React.memo(function DraggablePage({
  page,
  isActive,
  isBeingDragged,
  onClick,
  depth,
  onMouseEnter,
}: DraggablePageProps & { onMouseEnter?: () => void }) {
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
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left 
        min-w-0 transition-all duration-200 border border-transparent
        hover:bg-[var(--hover-bg)] hover:border-[rgba(128,128,128,0.2)] active:scale-[0.98]
        ${isActive ? 'font-medium bg-[var(--hover-bg)]' : ''}`}
      style={{
        ...style,
        color: 'var(--foreground)',
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--foreground)' }}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path opacity="0.5" d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.25 10C7.25 9.58579 7.58579 9.25 8 9.25H16C16.4142 9.25 16.75 9.58579 16.75 10C16.75 10.4142 16.4142 10.75 16 10.75H8C7.58579 10.75 7.25 10.4142 7.25 10Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.25 14C7.25 13.5858 7.58579 13.25 8 13.25H13C13.4142 13.25 13.75 13.5858 13.75 14C13.75 14.4142 13.4142 14.75 13 14.75H8C7.58579 14.75 7.25 14.4142 7.25 14Z" fill="currentColor"/>
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

const RecentPage = React.memo(function RecentPage({
  page,
  folder,
  isActive,
  isBeingDragged,
  onClick,
  onMouseEnter,
}: RecentPageProps & { onMouseEnter?: () => void }) {
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
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left 
        min-w-0 transition-all duration-200 border border-transparent
        hover:bg-[var(--hover-bg)] hover:border-[rgba(128,128,128,0.2)] active:scale-[0.98]
        ${isActive ? 'font-medium bg-[var(--hover-bg)]' : ''}`}
      style={{
        ...style,
        color: 'var(--foreground)',
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--foreground)' }}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path opacity="0.5" d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z" fill="currentColor"/>
          <path d="M16.5189 16.5013C16.6939 16.3648 16.8526 16.2061 17.1701 15.8886L21.1275 11.9312C21.2231 11.8356 21.1793 11.6708 21.0515 11.6264C20.5844 11.4644 19.9767 11.1601 19.4083 10.5917C18.8399 10.0233 18.5356 9.41561 18.3736 8.94849C18.3292 8.82066 18.1644 8.77687 18.0688 8.87254L14.1114 12.8299C13.7939 13.1474 13.6352 13.3061 13.4987 13.4811C13.3377 13.6876 13.1996 13.9109 13.087 14.1473C12.9915 14.3476 12.9205 14.5606 12.7786 14.9865L12.5951 15.5368L12.3034 16.4118L12.0299 17.2323C11.9601 17.4419 12.0146 17.6729 12.1708 17.8292C12.3271 17.9854 12.5581 18.0399 12.7677 17.9701L13.5882 17.6966L14.4632 17.4049L15.0135 17.2214L15.0136 17.2214C15.4394 17.0795 15.6524 17.0085 15.8527 16.913C16.0891 16.8004 16.3124 16.6623 16.5189 16.5013Z" fill="currentColor"/>
          <path d="M22.3665 10.6922C23.2112 9.84754 23.2112 8.47812 22.3665 7.63348C21.5219 6.78884 20.1525 6.78884 19.3078 7.63348L19.1806 7.76071C19.0578 7.88348 19.0022 8.05496 19.0329 8.22586C19.0522 8.33336 19.0879 8.49053 19.153 8.67807C19.2831 9.05314 19.5288 9.54549 19.9917 10.0083C20.4545 10.4712 20.9469 10.7169 21.3219 10.847C21.5095 10.9121 21.6666 10.9478 21.7741 10.9671C21.945 10.9978 22.1165 10.9422 22.2393 10.8194L22.3665 10.6922Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.25 9C7.25 8.58579 7.58579 8.25 8 8.25H14.5C14.9142 8.25 15.25 8.58579 15.25 9C15.25 9.41421 14.9142 9.75 14.5 9.75H8C7.58579 9.75 7.25 9.41421 7.25 9ZM7.25 13C7.25 12.5858 7.58579 12.25 8 12.25H11C11.4142 12.25 11.75 12.5858 11.75 13C11.75 13.4142 11.4142 13.75 11 13.75H8C7.58579 13.75 7.25 13.4142 7.25 13ZM7.25 17C7.25 16.5858 7.58579 16.25 8 16.25H9.5C9.91421 16.25 10.25 16.5858 10.25 17C10.25 17.4142 9.91421 17.75 9.5 17.75H8C7.58579 17.75 7.25 17.4142 7.25 17Z" fill="currentColor"/>
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
  const { user, signOut, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const workspaceTitle = useMemo(() => getWorkspaceTitle(user), [user]);
  const accentBackground = '#68AAEC';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredNavButton, setHoveredNavButton] = useState<'home' | 'search' | 'help' | null>(null);
  const navHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Track mount state to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Responsive auto-collapse: Close sidebar on narrow screens, open on wide screens
  // Only responds to window resize events, not manual toggles
  useEffect(() => {
    let previousWidth = window.innerWidth;
    const BREAKPOINT = 1024;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasNarrow = previousWidth < BREAKPOINT;
      const isNarrow = currentWidth < BREAKPOINT;

      // Only update if crossing the breakpoint threshold
      if (wasNarrow !== isNarrow) {
        if (isNarrow && sidebarOpen) {
          // Just crossed to narrow - auto-collapse
          setSidebarOpen(false);
        } else if (!isNarrow && !sidebarOpen) {
          // Just crossed to wide - auto-open
          setSidebarOpen(true);
        }
      }

      previousWidth = currentWidth;
    };

    // Set initial state only on mount
    const isNarrow = window.innerWidth < BREAKPOINT;
    if (isNarrow && sidebarOpen) {
      setSidebarOpen(false);
    } else if (!isNarrow && !sidebarOpen) {
      setSidebarOpen(true);
    }

    // Listen to resize events only
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount and respond to resize events

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

  // Initialize expanded folders - always start with empty Set for consistent SSR
  // Load from localStorage AFTER mount to prevent hydration mismatches
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Load expanded folders from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('expandedFolders');
    if (saved) {
      try {
        setExpandedFolders(new Set(JSON.parse(saved)));
      } catch {
        // Invalid data, keep empty Set
      }
    }
  }, []);

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

  // Prefetch handlers for instant navigation
  const prefetchFolder = useCallback((folderId: string) => {
    router.prefetch(`/notebook/folder/${folderId}`);
  }, [router]);

  const prefetchPage = useCallback((pageId: string) => {
    router.prefetch(`/notebook/page/${pageId}`);
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  // ============================================================================
  // NAV BUTTON HOVER HANDLERS - With debouncing to prevent flashing
  // ============================================================================
  
  const handleNavButtonEnter = useCallback((button: 'home' | 'search' | 'help') => {
    // Clear any pending timeout
    if (navHoverTimeoutRef.current) {
      clearTimeout(navHoverTimeoutRef.current);
      navHoverTimeoutRef.current = null;
    }
    // Immediately set the hovered button
    setHoveredNavButton(button);
  }, []);

  const handleNavButtonLeave = useCallback(() => {
    // Clear any existing timeout
    if (navHoverTimeoutRef.current) {
      clearTimeout(navHoverTimeoutRef.current);
    }
    // Delay before clearing hover state to prevent flashing
    navHoverTimeoutRef.current = setTimeout(() => {
      setHoveredNavButton(null);
      navHoverTimeoutRef.current = null;
    }, 150); // 150ms delay
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navHoverTimeoutRef.current) {
        clearTimeout(navHoverTimeoutRef.current);
      }
    };
  }, []);

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
        onMouseEnter={() => prefetchFolder(folder.id)}
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
                onMouseEnter={() => prefetchPage(page.id)}
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
      className="relative h-full w-full overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: sidebarOpen ? '1px solid var(--border-color)' : 'none',
        // Width is controlled by the parent Panel component, so we don't set it here
        transition: 'border 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col"
        style={{
          padding: '0px 16px 16px 16px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: sidebarOpen ? '0.1s' : '0s',
        }}
      >
        {/* Header - Refined Profile & Create Actions */}
        <div className="pt-4 pb-2 mb-2" style={{ marginLeft: '-8px', marginRight: '-8px', paddingLeft: '8px', paddingRight: '8px' }}>
          <div className="flex items-center justify-between gap-2 mb-4 px-2">
            {/* User Profile / Workspace Switcher */}
            <button
              onClick={() => {
                if (user) setShowProfileMenu(!showProfileMenu);
                else router.push('/login');
              }}
              className="flex items-center gap-2 text-left min-w-0 cursor-pointer group rounded-lg p-1 -ml-2 
              hover:bg-[var(--hover-bg)] transition-all duration-200 border border-transparent hover:border-[rgba(128,128,128,0.2)]"
              style={{ color: 'var(--foreground)' }}
            >
              <div className="relative flex-shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-lg border-white/30 border-1 object-cover"
                  />
                ) : (
                  <Image
                    src="/logos/claritylogo-notext.png"
                    alt="Clarity"
                    width={22}
                    height={22}
                    className="rounded-sm object-cover"
                  />
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-[13px] truncate leading-tight">
                  {workspaceTitle}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)] truncate opacity-60">
                  {user ? 'Free Plan' : 'Guest'}
                </span>
              </div>

              <svg className="w-3.5 h-3.5 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sidebar Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="p-1.5 rounded-md hover:bg-[var(--hover-bg)]
               text-[var(--foreground-muted)] hover:text-[var(--foreground)]
              hover:cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3zM9 3v18" />
              </svg>
            </button>
          </div>

      {/* Sign In Button - Only for unregistered users */}
      {!user && (
        <button
          onClick={() => router.push('/login')}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2 rounded-lg mb-3
          transition-all duration-200 cursor-pointer font-medium text-sm group"
          style={{
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          title="Sign in with Google"
          aria-label="Sign in with Google"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Sign in / Sign up</span>
        </button>
      )}

          {/* Create Button - Full Width */}
          <div className="relative create-menu-container mb-3">
            <button
              ref={createButtonRef}
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
              transition-all duration-200 cursor-pointer font-medium text-sm group relative overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, #f3f4f6, #e5e7eb)',
                color: '#1f2937', // Dark grey text
                borderTop: '1px solid #ffffff',
                borderBottom: '1px solid #d1d5db',
                borderLeft: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
              }}
            >
              {/* Button content */}
              <div className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="opacity-90 group-hover:opacity-100">New item</span>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>

            {/* Dropdown Menu */}
            {showCreateMenu && (
              <div
                ref={createMenuRef}
                className="absolute top-10 left-0 w-full rounded-lg shadow-xl border py-1.5 z-[9999]"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <button
                  onClick={handleCreatePage}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                  style={{ color: 'var(--foreground)' }}
                >
                  <div className="p-1 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">New Page</div>
                    <div className="text-xs text-[var(--foreground-muted)]">Create a new document</div>
                  </div>
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                  style={{ color: 'var(--foreground)' }}
                >
                  <div className="p-1 rounded bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <svg width="14" height="14" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">New Folder</div>
                    <div className="text-xs text-[var(--foreground-muted)]">Organize your pages</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Home, Search & Help Buttons - Expandable (Only one at a time) */}
          <div className="flex gap-1.5">
            {/* Home Button */}
            <button
              onClick={() => router.push('/notebook')}
              onMouseEnter={() => handleNavButtonEnter('home')}
              onMouseLeave={handleNavButtonLeave}
              className={`flex items-center gap-2 py-1.5 rounded-md text-sm
              transition-all duration-200 cursor-pointer border border-transparent overflow-hidden
              ${(hoveredNavButton === 'home' || (hoveredNavButton === null && pathname === '/notebook'))
                  ? 'bg-[var(--hover-bg)] border-[rgba(128,128,128,0.2)] w-[100px]'
                  : 'w-[40px]'
                } px-3`}
              style={{ color: 'var(--foreground)' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.5" d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" fill="currentColor"/>
                <path d="M9 17.25C8.58579 17.25 8.25 17.5858 8.25 18C8.25 18.4142 8.58579 18.75 9 18.75H15C15.4142 18.75 15.75 18.4142 15.75 18C15.75 17.5858 15.4142 17.25 15 17.25H9Z" fill="currentColor"/>
              </svg>
              <span className={`font-medium whitespace-nowrap transition-all duration-200 overflow-hidden
                ${(hoveredNavButton === 'home' || (hoveredNavButton === null && pathname === '/notebook'))
                  ? 'max-w-[70px] opacity-100' 
                  : 'max-w-0 opacity-0'
                }`}>
                Home
              </span>
            </button>

            {/* Search Button */}
            <button
              onClick={() => console.log('Search')}
              onMouseEnter={() => handleNavButtonEnter('search')}
              onMouseLeave={handleNavButtonLeave}
              className={`flex items-center gap-2 py-1.5 rounded-md text-sm
              transition-all duration-200 cursor-pointer border border-transparent overflow-hidden
              ${(hoveredNavButton === 'search' || (hoveredNavButton === null && pathname === '/search'))
                  ? 'bg-[var(--hover-bg)] border-[rgba(128,128,128,0.2)] w-[100px]'
                  : 'w-[40px]'
                } px-3`}
              style={{ color: 'var(--foreground)' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.42229 20.6181C10.1779 21.5395 11.0557 22.0001 12 22.0001V12.0001L2.63802 7.07275C2.62423 7.09491 2.6107 7.11727 2.5974 7.13986C2 8.15436 2 9.41678 2 11.9416V12.0586C2 14.5834 2 15.8459 2.5974 16.8604C3.19479 17.8749 4.27063 18.4395 6.42229 19.5686L8.42229 20.6181Z" fill="currentColor"/>
                <path opacity="0.7" d="M17.5774 4.43152L15.5774 3.38197C13.8218 2.46066 12.944 2 11.9997 2C11.0554 2 10.1776 2.46066 8.42197 3.38197L6.42197 4.43152C4.31821 5.53552 3.24291 6.09982 2.6377 7.07264L11.9997 12L21.3617 7.07264C20.7564 6.09982 19.6811 5.53552 17.5774 4.43152Z" fill="currentColor"/>
                <path opacity="0.5" d="M21.4026 7.13986C21.3893 7.11727 21.3758 7.09491 21.362 7.07275L12 12.0001V22.0001C12.9443 22.0001 13.8221 21.5395 15.5777 20.6181L17.5777 19.5686C19.7294 18.4395 20.8052 17.8749 21.4026 16.8604C22 15.8459 22 14.5834 22 12.0586V11.9416C22 9.41678 22 8.15436 21.4026 7.13986Z" fill="currentColor"/>
              </svg>
              <span className={`font-medium whitespace-nowrap transition-all duration-200 overflow-hidden
                ${(hoveredNavButton === 'search' || (hoveredNavButton === null && pathname === '/search'))
                  ? 'max-w-[70px] opacity-100' 
                  : 'max-w-0 opacity-0'
                }`}>
                Search
              </span>
            </button>

            {/* Help Button */}
            <button
              onClick={() => console.log('Help')}
              onMouseEnter={() => handleNavButtonEnter('help')}
              onMouseLeave={handleNavButtonLeave}
              className={`flex items-center gap-2 py-1.5 rounded-md text-sm
              transition-all duration-200 cursor-pointer border border-transparent overflow-hidden
              ${(hoveredNavButton === 'help' || (hoveredNavButton === null && pathname === '/help'))
                  ? 'bg-[var(--hover-bg)] border-[rgba(128,128,128,0.2)] w-[100px]'
                  : 'w-[40px]'
                } px-3`}
              style={{ color: 'var(--foreground)' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.5" d="M2 11.25C2 8.35051 4.01472 6 6.5 6C8.98528 6 11 8.35051 11 11.25V20H4.23256C2.99955 20 2 18.8339 2 17.3953V11.25Z" fill="currentColor"/>
                <path opacity="0.8" d="M11 11.25V20H14H15H19.7931C21.0119 20 22 18.8473 22 17.4253V11.25C22 8.35051 19.9853 6 17.5 6H6.5C8.98528 6 11 8.35051 11 11.25Z" fill="currentColor"/>
                <path d="M9.5 20V22C9.5 22.4142 9.83579 22.75 10.25 22.75C10.6642 22.75 11 22.4142 11 22V20H9.5Z" fill="currentColor"/>
                <path d="M15 20H13.5V22C13.5 22.4142 13.8358 22.75 14.25 22.75C14.6642 22.75 15 22.4142 15 22V20Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M4.25 16C4.25 15.5858 4.58579 15.25 5 15.25H8C8.41421 15.25 8.75 15.5858 8.75 16C8.75 16.4142 8.41421 16.75 8 16.75H5C4.58579 16.75 4.25 16.4142 4.25 16Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M17.3846 6.58471L17.6407 6.53344C18.0564 6.45022 18.4863 6.48995 18.8814 6.64813C19.5717 6.92453 20.3266 6.97616 21.0458 6.79618L21.1073 6.7808C21.6309 6.64975 22 6.16299 22 5.60336V3.47284C22 2.73503 21.3358 2.19145 20.6454 2.36421C20.249 2.46342 19.8329 2.43496 19.4523 2.28261L19.3793 2.25335C18.7422 1.99828 18.0491 1.93421 17.3787 2.06841L16.93 2.15824C16.3901 2.26632 16 2.75722 16 3.32846V10.2807C16 10.678 16.31 11 16.6923 11C17.0747 11 17.3846 10.678 17.3846 10.2807V6.58471Z" fill="currentColor"/>
              </svg>
              <span className={`font-medium whitespace-nowrap transition-all duration-200 overflow-hidden
                ${(hoveredNavButton === 'help' || (hoveredNavButton === null && pathname === '/help'))
                  ? 'max-w-[70px] opacity-100' 
                  : 'max-w-0 opacity-0'
                }`}>
                Guide
              </span>
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
                {/* Items moved to header */}
              </div>



              {/* Spaces Section Header */}
              {isMounted && rootFolders.length > 0 && (
                <div className="px-3 py-1.5 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                  Workspace
                </div>
              )}

              {/* Root Folders - Rendered recursively with nested folders */}
              {isMounted && rootFolders.map(folder => renderFolder(folder, 0))}

              {/* Recent Pages - 5 most recently edited pages */}
              {isMounted && recentPages.length > 0 && (
                <div className="pt-2">
                  {isMounted && rootFolders.length > 0 && (
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
                          onMouseEnter={() => prefetchPage(page.id)}
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

            {/* User Profile - Only show when user is logged in */}
            {user && (
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
            )}
          </div>
        </div>
      </div>
    </aside >
  );
}
