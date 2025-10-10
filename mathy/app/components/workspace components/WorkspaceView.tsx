'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import FolderCard from './FolderCard';
import PageCard from './PageCard';

export default function WorkspaceView() {
  const { folders, pages, workspaceItems, deleteFolder, deletePage, loading } = useWorkspace();
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'folder' | 'page' } | null>(null);

  // Get root-level folders and pages
  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const rootPages = pages.filter(p => !p.folder_id);

  // Get page count for each folder
  const getFolderPageCount = (folderId: string) => {
    return pages.filter(p => p.folder_id === folderId).length;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center" style={{ color: 'var(--foreground-muted)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (rootFolders.length === 0 && rootPages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Welcome to your workspace!
          </h2>
          <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
            Get started by creating your first folder or page using the buttons in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Workspace
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            {rootFolders.length} {rootFolders.length === 1 ? 'folder' : 'folders'}, {rootPages.length} {rootPages.length === 1 ? 'page' : 'pages'}
          </p>
        </div>

        {/* Folders Section */}
        {rootFolders.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Folders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rootFolders.map(folder => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  pageCount={getFolderPageCount(folder.id)}
                  onDelete={deleteFolder}
                  onEdit={(id) => setEditingItem({ id, type: 'folder' })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pages Section */}
        {rootPages.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Pages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rootPages.map(page => (
                <PageCard
                  key={page.id}
                  page={page}
                  onDelete={deletePage}
                  onEdit={(id) => setEditingItem({ id, type: 'page' })}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

