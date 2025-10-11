'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import FolderCard from './FolderCard';
import PageCard from './PageCard';

export default function WorkspaceView() {
  const { folders, pages, workspaceItems, deleteFolder, deletePage, loading, sidebarOpen, setSidebarOpen } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-4 backdrop-blur sm:px-8" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--sidebar-bg)' }}>
        {/* Left side - Sidebar toggle + Title */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--foreground)' }}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </>
              )}
            </svg>
          </button>

          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Workspace
          </span>
        </div>

        {/* Right side - Theme toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="relative h-7 w-12 rounded-full hover:opacity-90 active:scale-95"
            style={{ 
              background: theme === 'light' ? '#e0e0e0' : '#4a4a4a',
              transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.1s ease',
            }}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <div 
              className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full flex items-center justify-center"
              style={{
                background: theme === 'light' ? '#fbbf24' : '#1e293b',
                transform: theme === 'light' ? 'translateX(0) scale(1)' : 'translateX(20px) scale(1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
              }}
            >
              <div style={{
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                opacity: theme === 'light' ? 1 : 0,
                transform: theme === 'light' ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(180deg)',
                position: 'absolute',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </div>
              <div style={{
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                opacity: theme === 'dark' ? 1 : 0,
                transform: theme === 'dark' ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-180deg)',
                position: 'absolute',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#94a3b8" stroke="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page info */}
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
    </div>
  );
}

