'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import posthog from 'posthog-js';

interface CreatePageModalProps {
  onClose: () => void;
  defaultFolderId?: string;
}

export default function CreatePageModal({ onClose, defaultFolderId }: CreatePageModalProps) {
  const router = useRouter();
  const { folders, createPage } = useWorkspace();
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || '');
  const [creating, setCreating] = useState(false);
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
    if (!title.trim()) return;

    posthog.capture('page_created', {
      title_length: title.trim().length,
      folder_selected: !!folderId,
    });

    setCreating(true);
    try {
      const newPage = await createPage(title.trim(), folderId || undefined, undefined);
      router.push(`/notebook/page/${newPage.id}`);
      handleClose();
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Failed to create page. Please try again.');
    } finally {
      setCreating(false);
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
              New Page
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
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                Page Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Meeting Notes"
                autoFocus
                className="w-full bg-transparent px-0 py-2 text-lg border-b-2 transition-colors focus:outline-none"
                style={{
                  color: 'var(--foreground)',
                  borderColor: title ? 'var(--foreground)' : 'var(--border-color)',
                }}
              />
            </div>

            {/* Folder Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                Location
              </label>
              <div className="relative">
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full appearance-none bg-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  style={{
                    color: 'var(--foreground)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <option value="" className="bg-[#171717]">No folder (root level)</option>
                  {folders
                    .filter(f => !f.parent_folder_id)
                    .map(folder => (
                      <option key={folder.id} value={folder.id} className="bg-[#171717]">
                        {folder.name}
                      </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-muted)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={creating}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 active:scale-95"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || creating}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                {creating ? 'Creating...' : 'Create Page'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
