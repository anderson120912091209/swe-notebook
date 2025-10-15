'use client';

import React, { useState, useEffect } from 'react';
import { Folder } from '@/app/types/workspace';
import { getFolders } from '@/app/lib/api/workspace';

interface MovePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
  currentFolderId?: string;
  pageTitle: string;
}

export default function MovePageModal({ 
  isOpen, 
  onClose, 
  onMove, 
  currentFolderId,
  pageTitle 
}: MovePageModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      // Get current user ID from auth context or localStorage
      const userId = localStorage.getItem('userId') || '';
      const userFolders = await getFolders(userId);
      setFolders(userFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{ 
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Move Page
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Move &quot;{pageTitle}&quot; to a different folder
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Loading folders...
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Root level option */}
              <label className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-[var(--hover-bg)] transition-colors">
                <input
                  type="radio"
                  name="folder"
                  value=""
                  checked={selectedFolderId === null}
                  onChange={() => setSelectedFolderId(null)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <span className="text-lg mr-2">📁</span>
                  <span style={{ color: 'var(--foreground)' }}>Root (No folder)</span>
                </div>
              </label>

              {/* Folder options */}
              {folders.map((folder) => (
                <label 
                  key={folder.id} 
                  className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <input
                    type="radio"
                    name="folder"
                    value={folder.id}
                    checked={selectedFolderId === folder.id}
                    onChange={() => setSelectedFolderId(folder.id)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{folder.icon || '📁'}</span>
                    <span style={{ color: 'var(--foreground)' }}>{folder.name}</span>
                  </div>
                </label>
              ))}

              {folders.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    No folders available
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              color: 'var(--foreground-muted)',
              background: 'transparent',
              border: '1px solid var(--border-color)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{ 
              color: 'white',
              background: 'var(--active-bg)',
              border: '1px solid var(--active-bg)'
            }}
          >
            Move Page
          </button>
        </div>
      </div>
    </div>
  );
}
