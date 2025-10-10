'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Folder } from '@/app/types/workspace';

interface FolderCardProps {
  folder: Folder;
  pageCount?: number;
  onDelete?: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
}

export default function FolderCard({ folder, pageCount = 0, onDelete, onEdit }: FolderCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/notebook/folder/${folder.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete folder "${folder.name}" and all its pages?`)) {
      onDelete(folder.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(folder.id);
    }
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
      {/* Colored Header */}
      <div
        className="h-24 w-full rounded-t-lg transition-opacity duration-200 group-hover:opacity-90"
        style={{ backgroundColor: folder.color || '#6B7280' }}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-2 mb-2">
          {folder.icon && (
            <span className="text-2xl flex-shrink-0">{folder.icon}</span>
          )}
          <h3
            className="flex-1 text-base font-medium line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {folder.name || 'Untitled Folder'}
          </h3>
        </div>

        {/* Page Count */}
        <div className="mt-auto text-xs" style={{ color: 'var(--foreground-muted)' }}>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          onClick={handleEdit}
          className="p-1.5 rounded hover:bg-white/20 transition-colors text-white"
          title="Rename"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-white"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

