'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import posthog from 'posthog-js';
import type { Folder } from '@/app/types/workspace';

interface EditFolderModalProps {
  folder: Folder;
  onClose: () => void;
  onSuccess?: () => void;
}

const FOLDER_COLORS = [
  '#5A7FA3', // Soft Blue
  '#6B9B7A', // Soft Green
  '#D4A574', // Soft Amber/Yellow
  '#C47A7A', // Soft Red
  '#9A7BB3', // Soft Purple
  '#D47BB3', // Soft Pink
  '#7A7A7A', // Soft Gray
  '#6B9B9B', // Soft Teal
];

export default function EditFolderModal({ folder, onClose, onSuccess }: EditFolderModalProps) {
  const { updateFolder } = useWorkspace();
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color || '#5A7FA3');
  const [updating, setUpdating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedName = name.trim();
    if (trimmedName.length > 25) {
      alert('Folder name must be 25 characters or less.');
      return;
    }

    setUpdating(true);
    try {
      await updateFolder(folder.id, {
        name: trimmedName,
        color,
      });
      posthog.capture('folder_edited', {
        folder_id: folder.id,
        name_changed: trimmedName !== folder.name,
        color_changed: color !== folder.color,
      });
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (error) {
      console.error('Failed to update folder:', error);
      alert('Failed to update folder. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        style={{
          background: 'rgba(23, 23, 23, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Rename Folder
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Research Projects"
                  autoFocus
                  maxLength={25}
                  className="w-full bg-transparent px-0 py-2 text-lg border-b-2 transition-colors focus:outline-none"
                  style={{
                    color: 'var(--foreground)',
                    borderColor: name ? color : 'var(--border-color)',
                  }}
                />
                <div className="absolute right-0 top-2 text-xs transition-colors" style={{ color: name.length > 25 ? '#ef4444' : 'var(--foreground-muted)' }}>
                  {name.length}/25
                </div>
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                Color Tag
              </label>
              <div className="grid grid-cols-8 gap-3">
                {FOLDER_COLORS.map((folderColor) => (
                  <button
                    key={folderColor}
                    type="button"
                    onClick={() => {
                      posthog.capture('folder_color_changed', { color: folderColor });
                      setColor(folderColor);
                    }}
                    className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${color === folderColor ? 'ring-2 ring-offset-2 ring-offset-[#171717] scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                    style={{
                      backgroundColor: folderColor
                    }}
                  >
                    {color === folderColor && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={updating}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 active:scale-95"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || updating || name.length > 25}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

