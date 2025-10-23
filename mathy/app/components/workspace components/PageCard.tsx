'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Page } from '@/app/types/workspace';
import { extractSnippet } from '@/app/lib/contentSnippet';
import MovePageModal from './MovePageModal';
import PageEditorModal from './PageEditorModal';

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

interface PageCardProps {
  page: Page;
  folderName?: string;
  folderColor?: string;
  folders?: Array<{ id: string; name: string; color?: string }>;
  onDelete?: (pageId: string) => void;
  onEdit?: (pageId: string) => void;
  onMove?: (pageId: string, folderId: string | null) => void;
}

const PageCard = React.memo(function PageCard({ page, folderName, folderColor, folders = [], onDelete, onEdit, onMove }: PageCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const folderDropdownRef = useRef<HTMLDivElement>(null);

  // Extract content snippet
  const snippet = useMemo(() => extractSnippet(page.content), [page.content]);

  // Create muted folder color for the tag
  const baseColor = parseHex(folderColor)?.hex ?? FALLBACK_COLOR;
  const mutedFolderColor = lightenHex(baseColor, 0.7);

  const handleClick = () => {
    setShowEditorModal(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete "${page.title}"?`)) {
      onDelete(page.id);
    }
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(page.id);
    }
    setShowMenu(false);
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoveModal(true);
    setShowMenu(false);
  };

  const handleMoveConfirm = (folderId: string | null) => {
    if (onMove) {
      onMove(page.id, folderId);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setShowFolderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format last edited date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative flex flex-col rounded-lg border transition-all 
        duration-200 cursor-pointer hover:shadow-lg h-[240px]"
        style={{
          borderColor: 'var(--border-color)',
          background: 'var(--card-bg)',
        }}
      >
        {/* Folder Tag or Virtual Placeholder */}
        <div className="px-4 pt-3 pb-2">
          {folderName ? (
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium"
              style={{ 
                background: mutedFolderColor,
                color: '#374151'
              }}
            >
              {/*Folder Icon in the Tag*/}
              <svg className="w-3 h-3 mr-1" fill={folderColor || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {folderName}
            </span>
          ) : (
            <div className="relative" ref={folderDropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderDropdown(!showFolderDropdown);
                }}
                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium border-2 border-dashed transition-colors hover:bg-[var(--hover-bg)]"
                style={{ 
                  color: 'var(--foreground-muted)',
                  borderColor: 'var(--border-color)'
                }}
                title="Add to folder"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to folder
              </button>

              {/* Folder Dropdown */}
              {showFolderDropdown && (
                <div 
                  className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg border z-20"
                  style={{ 
                    background: 'var(--card-bg)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="py-1">
                    {folders.length > 0 ? (
                      folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMove) {
                              onMove(page.id, folder.id);
                            }
                            setShowFolderDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <svg className="w-4 h-4" fill={folder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {folder.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        No folders available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-4 pb-4">
          {/* Title */}
          <div className="mb-3">
            <h3
              className="text-base font-semibold truncate"
              style={{ color: 'var(--foreground)' }}
            >
              {page.title || 'Untitled'}
            </h3>
          </div>

          {/* Content Snippet */}
          <div className="flex-1 mb-4">
            <div 
              className="p-3 rounded-lg text-sm leading-relaxed line-clamp-3"
              style={{ 
                color: 'var(--foreground-muted)',
                background: 'var(--math-bg)'
              }}
            >
              {snippet}
            </div>
          </div>

          {/* Meta Footer */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--foreground-muted)' }}>
              Edited {formatDate(page.last_edited_at)}
            </span>
            
            <div className="flex items-center gap-2">
              {page.is_favorited && (
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              )}
              
              {/* Overflow Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 rounded hover:bg-[var(--hover-bg)] transition-colors opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--foreground-muted)' }}
                  title="More actions"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div 
                    className="absolute right-0 bottom-full mb-2 w-48 rounded-lg shadow-lg border z-10"
                    style={{ 
                      background: 'var(--card-bg)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="py-1">
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={handleMove}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Move to Folder
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Move Page Modal */}
      <MovePageModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={handleMoveConfirm}
        currentFolderId={page.folder_id || undefined}
        pageTitle={page.title}
      />

      {/* Page Editor Modal */}
      <PageEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        pageId={page.id}
      />
    </>
  );
});

export default PageCard;

