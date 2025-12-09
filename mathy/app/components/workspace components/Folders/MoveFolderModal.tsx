'use client';

import React, { useState } from 'react';
import type { Folder } from '@/app/types/workspace';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

interface MoveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder;
  onMove: (targetFolderId: string | null) => void;
}

export default function MoveFolderModal({ 
  isOpen, 
  onClose, 
  folder,
  onMove
}: MoveFolderModalProps) {
  const { folders, canDropItem } = useWorkspace();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folder.parent_folder_id || null);

  // Filter out the folder itself and its descendants to prevent circular references
  const getDescendantIds = (folderId: string): Set<string> => {
    const descendants = new Set<string>([folderId]);
    const children = folders.filter(f => f.parent_folder_id === folderId);
    
    children.forEach(child => {
      const childDescendants = getDescendantIds(child.id);
      childDescendants.forEach(id => descendants.add(id));
    });
    
    return descendants;
  };

  const invalidFolderIds = getDescendantIds(folder.id);
  const availableFolders = folders.filter(f => !invalidFolderIds.has(f.id));

  const handleMove = () => {
    // Validate the move operation
    if (selectedFolderId && !canDropItem('folder', folder.id, 'folder', selectedFolderId)) {
      alert('Cannot move folder to this location (would create a circular reference)');
      return;
    }
    
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
            Move Folder
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Move &quot;{folder.name}&quot; to a different location
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
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
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span style={{ color: 'var(--foreground)' }}>Root (No parent folder)</span>
              </div>
            </label>

            {/* Folder options */}
            {availableFolders.map((availableFolder) => (
              <label 
                key={availableFolder.id} 
                className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-[var(--hover-bg)] transition-colors"
              >
                <input
                  type="radio"
                  name="folder"
                  value={availableFolder.id}
                  checked={selectedFolderId === availableFolder.id}
                  onChange={() => setSelectedFolderId(availableFolder.id)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill={availableFolder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span style={{ color: 'var(--foreground)' }}>{availableFolder.name}</span>
                </div>
              </label>
            ))}

            {availableFolders.length === 0 && (
              <div className="text-center py-4">
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  No available folders (cannot move folder into itself or its descendants)
                </div>
              </div>
            )}
          </div>
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
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              color: 'white',
              background: 'var(--active-bg)',
              border: '1px solid var(--active-bg)'
            }}
          >
            Move Folder
          </button>
        </div>
      </div>
    </div>
  );
}

