'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Page } from '@/app/types/workspace';

interface PageCardProps {
  page: Page;
  onDelete?: (pageId: string) => void;
  onEdit?: (pageId: string) => void;
}

const PageCard = React.memo(function PageCard({ page, onDelete, onEdit }: PageCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/notebook/page/${page.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete "${page.title}"?`)) {
      onDelete(page.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(page.id);
    }
  };

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
    <div
      onClick={handleClick}
      className="group relative flex flex-col rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-lg"
      style={{
        borderColor: 'var(--border-color)',
        background: 'var(--sidebar-bg)',
      }}
    >
      {/* Cover Image */}
      {page.cover_image && (
        <div className="h-32 w-full overflow-hidden rounded-t-lg">
          <img
            src={page.cover_image}
            alt={page.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-2 mb-2">
          {page.icon && (
            <span className="text-2xl flex-shrink-0">{page.icon}</span>
          )}
          <h3
            className="flex-1 text-base font-medium line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {page.title || 'Untitled'}
          </h3>
        </div>

        {/* Metadata */}
        <div className="mt-auto flex items-center justify-between text-xs" style={{ color: 'var(--foreground-muted)' }}>
          <span>Edited {formatDate(page.last_edited_at)}</span>
          {page.is_favorited && (
            <span className="text-yellow-500">⭐</span>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          onClick={handleEdit}
          className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--foreground)' }}
          title="Rename"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-red-500"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

export default PageCard;

