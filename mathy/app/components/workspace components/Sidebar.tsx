'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import CreateFolderModal from './CreateFolderModal';
import CreatePageModal from './CreatePageModal';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { folders, pages, sidebarOpen, setSidebarOpen, currentFolder, currentPage } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);

  // Get root-level folders and pages
  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const rootPages = pages.filter(p => !p.folder_id);

  // Get pages for each folder
  const getFolderPages = (folderId: string) => {
    return pages.filter(p => p.folder_id === folderId);
  };

  const isActive = (id: string, type: 'folder' | 'page') => {
    if (type === 'folder') {
      return currentFolder?.id === id || pathname.includes(`/folder/${id}`);
    }
    return currentPage?.id === id || pathname.includes(`/page/${id}`);
  };

  const navigateToWorkspace = () => {
    router.push('/notebook');
  };

  const navigateToFolder = (folderId: string) => {
    router.push(`/notebook/folder/${folderId}`);
  };

  const navigateToPage = (pageId: string) => {
    router.push(`/notebook/page/${pageId}`);
  };

  if (!sidebarOpen) return null;

  return (
    <aside
      className="relative shrink-0 transition-all duration-300 ease-in-out overflow-y-auto"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-color)',
        width: '288px',
        padding: '32px 16px',
      }}
    >
      {/* Header */}
      <div className="mb-6 px-2">
        <button
          onClick={navigateToWorkspace}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-left"
          style={{ color: 'var(--foreground)' }}
        >
          <span className="text-xl">📚</span>
          <span className="font-semibold">Workspace</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mb-4 px-2 flex gap-2">
        <button
          onClick={() => setShowNewFolderModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Folder</span>
        </button>
        <button
          onClick={() => setShowNewPageModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Page</span>
        </button>
      </div>

      {/* Navigation Tree */}
      <nav className="space-y-1">
        {/* Root Folders */}
        {rootFolders.map(folder => {
          const folderPages = getFolderPages(folder.id);
          const active = isActive(folder.id, 'folder');

          return (
            <div key={folder.id}>
              <button
                onClick={() => navigateToFolder(folder.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${
                  active ? 'font-medium' : ''
                }`}
                style={{
                  color: 'var(--foreground)',
                  background: active ? 'var(--hover-bg)' : 'transparent',
                }}
              >
                <span>{folder.icon || '📁'}</span>
                <span className="flex-1 truncate">{folder.name}</span>
                <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  {folderPages.length}
                </span>
              </button>

              {/* Pages in folder */}
              {folderPages.length > 0 && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {folderPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => navigateToPage(page.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors text-left ${
                        isActive(page.id, 'page') ? 'font-medium' : ''
                      }`}
                      style={{
                        color: 'var(--foreground)',
                        background: isActive(page.id, 'page') ? 'var(--hover-bg)' : 'transparent',
                      }}
                    >
                      <span className="text-xs">{page.icon || '📄'}</span>
                      <span className="flex-1 truncate">{page.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Root Pages (not in any folder) */}
        {rootPages.length > 0 && (
          <div className="pt-2">
            {rootFolders.length > 0 && (
              <div className="px-3 py-1 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                Pages
              </div>
            )}
            {rootPages.map(page => (
              <button
                key={page.id}
                onClick={() => navigateToPage(page.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${
                  isActive(page.id, 'page') ? 'font-medium' : ''
                }`}
                style={{
                  color: 'var(--foreground)',
                  background: isActive(page.id, 'page') ? 'var(--hover-bg)' : 'transparent',
                }}
              >
                <span>{page.icon || '📄'}</span>
                <span className="flex-1 truncate">{page.title}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Footer - Theme Toggle */}
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
          <span className="text-sm">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
        </button>
      </div>

      {/* Modals */}
      {showNewFolderModal && (
        <CreateFolderModal 
          onClose={() => setShowNewFolderModal(false)}
          onSuccess={(folderId) => {
            setShowNewFolderModal(false);
            router.push(`/notebook/folder/${folderId}`);
          }}
        />
      )}
      {showNewPageModal && (
        <CreatePageModal onClose={() => setShowNewPageModal(false)} />
      )}
    </aside>
  );
}

