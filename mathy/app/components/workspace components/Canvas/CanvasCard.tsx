'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Canvas } from '@/app/types/workspace';
import { useTheme } from '@/app/contexts/ThemeContext';
import CanvasEditorModal from './CanvasEditorModal'; 

const FALLBACK_COLOR = '#9CC5FF';

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!/^#?[0-9a-f]{3,6}$/i.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function expandToSixDigit(hex: string): string {
  if (hex.length === 7) return hex.toUpperCase();
  if (hex.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  return hex.toUpperCase();
}

function parseHex(hex?: string | null): { hex: string; r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  
  const expanded = expandToSixDigit(normalized);
  const r = parseInt(expanded.slice(1, 3), 16);
  const g = parseInt(expanded.slice(3, 5), 16);
  const b = parseInt(expanded.slice(5, 7), 16);
  
  return { hex: expanded, r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function lightenHex(hex: string, amount: number): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  
  const lighten = (value: number) => Math.round(value + (255 - value) * amount);
  
  return `rgb(${lighten(parsed.r)}, ${lighten(parsed.g)}, ${lighten(parsed.b)})`;
}

interface CanvasCardProps {
  canvas: Canvas;
  folderName?: string;
  folderColor?: string;
  folders?: Array<{ id: string; name: string; color?: string }>;
  onDelete?: (canvasId: string) => void;
  onEdit?: (canvasId: string) => void;
  onMove?: (canvasId: string, folderId: string | null) => void;
}

const CanvasCard = React.memo(function CanvasCard({ 
  canvas, 
  folderName, 
  folderColor, 
  folders = [], 
  onDelete, 
  onEdit, 
  onMove 
}: CanvasCardProps) {
  const { theme } = useTheme();
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete "${canvas.title}"?`)) {
      onDelete(canvas.id);
    }
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(canvas.id);
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
      onMove(canvas.id, folderId);
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
                color: '#374151',
                border: '1px solid var(--border-color)'
              }}
            >
              {/*Folder Icon in the Tag*/}
              <svg className="w-3 h-3 mr-1" fill={folderColor || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {folderName}
            </span>
          ) : (
            <div className="h-5" /> // Virtual placeholder for consistent spacing
          )}
        </div>

        {/* Canvas Icon */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--hover-bg)' }}>
            {canvas.icon ? (
              <span className="text-lg">{canvas.icon}</span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        </div>

        {/* Canvas Title */}
        <div className="px-4 pb-2 flex-1 flex flex-col">
          <h3 
            className="font-medium text-sm leading-tight mb-2 line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {canvas.title}
          </h3>
          
          {/* Canvas Preview/Description */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-1">🎨</div>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                Canvas
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Date and Menu */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {formatDate(canvas.last_edited_at)}
          </span>
          
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--hover-bg)] cursor-pointer"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-50"
                style={{ 
                  background: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2 cursor-pointer"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={handleMove}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2 cursor-pointer"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Move to Folder
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-500 cursor-pointer"
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

      {/* Move Canvas Modal - TODO: Implement MoveCanvasModal */}
      {/* <MoveCanvasModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={handleMoveConfirm}
        currentFolderId={canvas.folder_id || undefined}
        canvasTitle={canvas.title}
      /> */}

      {/* Canvas Editor Modal */}
      <CanvasEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        canvasId={canvas.id}
      />
    </>
  );
});

export default CanvasCard;
