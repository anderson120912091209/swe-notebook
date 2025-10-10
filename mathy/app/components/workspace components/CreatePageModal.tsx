'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

interface CreatePageModalProps {
  onClose: () => void;
  defaultFolderId?: string;
}

const PAGE_ICONS = ['📝', '📄', '📊', '📈', '🎨', '💡', '⚡', '🔬', '📚', '✨', '🎯', '💻'];

export default function CreatePageModal({ onClose, defaultFolderId }: CreatePageModalProps) {
  const router = useRouter();
  const { folders, createPage } = useWorkspace();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [folderId, setFolderId] = useState(defaultFolderId || '');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      const newPage = await createPage(title.trim(), folderId || undefined, icon);
      router.push(`/notebook/page/${newPage.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Failed to create page. Please try again.');
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
          Create Page
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Notes"
              autoFocus
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border-color)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Folder Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Folder (Optional)
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border-color)',
                color: 'var(--foreground)',
              }}
            >
              <option value="">No folder (root level)</option>
              {folders
                .filter(f => !f.parent_folder_id)
                .map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.icon} {folder.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Icon Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PAGE_ICONS.map((pageIcon) => (
                <button
                  key={pageIcon}
                  type="button"
                  onClick={() => setIcon(pageIcon)}
                  className={`p-3 rounded-lg text-2xl transition-all ${
                    icon === pageIcon ? 'ring-2 ring-blue-500 scale-110' : 'hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {pageIcon}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50"
              style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || creating}
              className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              {creating ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

