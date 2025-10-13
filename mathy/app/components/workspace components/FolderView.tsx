'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import PageCard from './PageCard';

interface FolderViewProps {
  folderId: string;
}

export default function FolderView({ folderId }: FolderViewProps) {
  const router = useRouter();
  const { folders, pages, createPage, deletePage, loading, sidebarOpen, setSidebarOpen } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const [folder, setFolder] = useState(folders.find(f => f.id === folderId));
  const [folderPages, setFolderPages] = useState(pages.filter(p => p.folder_id === folderId));
  const [creatingPage, setCreatingPage] = useState(false);

  useEffect(() => {
    const currentFolder = folders.find(f => f.id === folderId);
    setFolder(currentFolder);
    setFolderPages(pages.filter(p => p.folder_id === folderId));
  }, [folderId, folders, pages]);

  const handleCreatePage = async () => {
    setCreatingPage(true);
    try {
      const newPage = await createPage('Untitled Page', folderId, '📝');
      router.push(`/notebook/page/${newPage.id}`);
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setCreatingPage(false);
    }
  };

  const handleGoBack = () => {
    router.push('/notebook');
  };

  if (loading && !folder) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: 'var(--foreground-muted)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p>Loading folder...</p>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Folder not found
          </h2>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
          >
            Go back to workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-4 backdrop-blur sm:px-8" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--sidebar-bg)' }}>
        {/* Left side - Sidebar toggle + Breadcrumb */}
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

          <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            <button
              onClick={handleGoBack}
              className="hover:underline transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              Workspace
            </button>
            <span>/</span>
            <span>{folder.name}</span>
          </nav>
        </div>

        {/* Right side - Actions + Theme toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreatePage}
            disabled={creatingPage}
            className="flex items-center gap-2 px-3 py-2 rounded-full 
            hover:bg-[var(--hover-bg)] transition-all duration-200 active:scale-95
             disabled:opacity-50 text-xs"
            style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{creatingPage ? 'Creating...' : 'New Page'}</span>
          </button>

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
          {/* Folder info */}
          <div className="flex items-start gap-4 mb-8">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
              style={{ backgroundColor: folder.color || '#6B7280' }}
            >
              {folder.icon || '📁'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {folder.name}
              </h1>
              <p style={{ color: 'var(--foreground-muted)' }}>
                {folderPages.length} {folderPages.length === 1 ? 'page' : 'pages'}
              </p>
            </div>
          </div>

        {/* Pages Grid */}
        {folderPages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folderPages.map(page => (
              <PageCard
                key={page.id}
                page={page}
                onDelete={deletePage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              No pages yet
            </h3>
            <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
              Create your first page in this folder to get started.
            </p>
            <button
              onClick={handleCreatePage}
              disabled={creatingPage}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200 active:scale-95 disabled:opacity-50"
              style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{creatingPage ? 'Creating...' : 'Create Page'}</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

