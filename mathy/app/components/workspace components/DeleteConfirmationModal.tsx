'use client';

import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: 'folder' | 'page';
  itemName: string;
  hasChildren?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  hasChildren = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="#ef4444"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Delete {itemType === 'folder' ? 'Folder' : 'Page'}?
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-sm mb-3" style={{ color: 'var(--foreground-muted)' }}>
            Are you sure you want to delete{' '}
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
              {itemName}
            </span>
            ?
          </p>
          {hasChildren && itemType === 'folder' && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
              }}
            >
              ⚠️ This folder contains pages or subfolders. All contents will be
              permanently deleted.
            </div>
          )}
          {!hasChildren && (
            <p className="text-xs" style={{ color: 'var(--muted-text)' }}>
              This action cannot be undone.
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex gap-3 px-6 py-4 rounded-b-xl"
          style={{
            background: 'var(--hover-bg)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
            style={{
              background: 'var(--card-bg)',
              color: 'var(--foreground)',
              border: '1px solid var(--border-color)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-full text-sm font-medium text-white transition-all active:scale-95"
            style={{
              background: '#ef4444',
            }}
          >
            Delete {itemType === 'folder' ? 'Folder' : 'Page'}
          </button>
        </div>
      </div>
    </div>
  );
}

