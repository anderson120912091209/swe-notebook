'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Page } from '@/app/types/workspace';
import MovePageModal from './MovePageModal';
import PageEditorModal from './PageEditorModal';
import PageCardPreview from './PageCardPreview';
import { CardMenu, ThreeDotButton } from '../Shared/CardMenu';

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

  // Create muted folder color for the tag
  const baseColor = parseHex(folderColor)?.hex ?? FALLBACK_COLOR;
  const mutedFolderColor = lightenHex(baseColor, 0.7);

  const handleClick = () => {
    setShowEditorModal(true);
  };

  const handleDelete = () => {
    // CardMenu already handles stopPropagation
    if (onDelete && confirm(`Delete "${page.title}"?`)) {
      onDelete(page.id);
    }
    setShowMenu(false);
  };

  const handleEdit = () => {
    // CardMenu already handles stopPropagation
    if (onEdit) {
      onEdit(page.id);
    }
    setShowMenu(false);
  };

  const handleMove = () => {
    // CardMenu already handles stopPropagation
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

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative flex flex-col rounded-xl border transition-all duration-200 cursor-pointer 
        hover:border-[#68AAEC]/50 h-[320px] overflow-hidden"
        style={{
          borderColor: 'var(--border-color)',
          background: 'var(--card-bg)',
        }}
      >
        {/* Header: Folder Badge (Folder tags) & Menu */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          {folderName ? (
            <span
              className="inline-flex items-center px-2 py-1 rounded-md
              border-[#6b7280]/20 border-[0.7px] text-xs font-medium transition-colors hover:bg-[var(--hover-bg)]"
              style={{
                background: 'var(--hover-bg)',
                color: 'var(--foreground-muted)'
              }}
            >
              <svg className="w-3.5 h-3.5 mr-2" fill={folderColor || '#6b7280'} stroke="none" viewBox="0 0 24 24" style={{ filter: 'none' }}>
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
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-colors hover:bg-[var(--hover-bg)]"
                style={{
                  color: 'var(--foreground-muted)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to folder
              </button>

              {/* Folder Dropdown */}
              {showFolderDropdown && (
                <div
                  className="absolute bottom-full left-0 mb-1 w-48 rounded-lg shadow-lg border z-20"
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

          {/* Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <ThreeDotButton
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              isVisible={showMenu}
            />
            <CardMenu
              isOpen={showMenu}
              onClose={() => setShowMenu(false)}
              items={[
                {
                  label: 'Rename',
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  ),
                  onClick: handleEdit,
                },
                {
                  label: 'Move to Folder',
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  ),
                  onClick: handleMove,
                },
                {
                  label: 'Delete',
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ),
                  onClick: handleDelete,
                  destructive: true,
                },
              ]}
            />
          </div>
        </div>

        {/* Title */}
        <div className="px-5 mb-3">
          <h3
            className="text-lg font-bold leading-tight line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {page.title || 'Untitled'}
          </h3>
        </div>

        {/* Content Preview */}
        <div className="px-5 flex-1 overflow-hidden relative mb-4">
          <div
            className="h-full w-full border-[var(--border-color)]
            border-1 rounded-lg overflow-hidden"
            style={{
              background: 'var(--card-preview-bg)',
              zoom: 0.5
            }}
          >
            <PageCardPreview key={`${page.id}-${page.updated_at}`} content={page.content} />
          </div>
          {/* Fade out mask that overlays the Content Preview Snippet */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 60%, var(--card-bg) 100%)'
            }}
          />
        </div>

        {/* Footer: Tags */}
        <div className="px-5 pb-5 mt-auto">

          {/* Tags */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Tags</span>
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

