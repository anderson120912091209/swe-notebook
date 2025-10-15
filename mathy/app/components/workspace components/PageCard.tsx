'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Page } from '@/app/types/workspace';
import { extractSnippet } from '@/app/lib/contentSnippet';
import MovePageModal from './MovePageModal';
import PageEditorModal from './PageEditorModal';

interface PageCardProps {
  page: Page;
  folderName?: string;
  onDelete?: (pageId: string) => void;
  onEdit?: (pageId: string) => void;
  onMove?: (pageId: string, folderId: string | null) => void;
}

const PageCard = React.memo(function PageCard({ page, folderName, onDelete, onEdit, onMove }: PageCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Extract content snippet
  const snippet = useMemo(() => extractSnippet(page.content), [page.content]);

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
        duration-200 cursor-pointer hover:shadow-lg"
        style={{
          borderColor: 'var(--border-color)',
          background: 'var(--card-bg)',
        }}
      >
        {/* Folder Tag */}
        {folderName && (
          <div className="px-4 pt-3 pb-2">
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ 
                background: 'var(--hover-bg)',
                color: 'var(--foreground-muted)'
              }}
            >
              <span className="mr-1">📁</span>
              {folderName}
            </span>
          </div>
        )}

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
            <p 
              className="text-sm leading-relaxed line-clamp-3"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {snippet}
            </p>
          </div>

          {/* Meta Footer */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--foreground-muted)' }}>
              Edited {formatDate(page.last_edited_at)}
            </span>
            
            <div className="flex items-center gap-2">
              {page.is_favorited && (
                <span className="text-yellow-500">⭐</span>
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

