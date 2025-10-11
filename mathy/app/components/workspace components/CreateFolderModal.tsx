'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

interface CreateFolderModalProps {
  onClose: () => void;
  onSuccess?: (folderId: string) => void;
}

const FOLDER_ICONS = ['📁', '📂', '🚀', '📊', '💡', '⚡', '🎨', '🔬', '📚', '🌟', '🎯', '💼'];
const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
];

export default function CreateFolderModal({ onClose, onSuccess }: CreateFolderModalProps) {
  const { createFolder } = useWorkspace();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const newFolder = await createFolder(name.trim(), icon, color);
      if (onSuccess) {
        onSuccess(newFolder.id);
      }
      onClose();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
          Create Folder
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Research"
              autoFocus
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border-color)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Icon Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {FOLDER_ICONS.map((folderIcon) => (
                <button
                  key={folderIcon}
                  type="button"
                  onClick={() => setIcon(folderIcon)}
                  className={`p-3 rounded-lg text-2xl transition-all ${
                    icon === folderIcon ? 'ring-2 ring-blue-500 scale-110' : 'hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {folderIcon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((folderColor) => (
                <button
                  key={folderColor}
                  type="button"
                  onClick={() => setColor(folderColor)}
                  className={`h-12 rounded-lg transition-all ${
                    color === folderColor ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
                  }`}
                  style={{ backgroundColor: folderColor }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200 active:scale-95 disabled:opacity-50"
              style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="px-4 py-2 rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              {creating ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

