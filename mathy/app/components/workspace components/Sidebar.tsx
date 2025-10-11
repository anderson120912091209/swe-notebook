'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import CreateFolderModal from './CreateFolderModal';
import CreatePageModal from './CreatePageModal';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { folders, pages, sidebarOpen, currentFolder, currentPage } = useWorkspace();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  
  // Initialize expanded folders from localStorage
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expandedFolders');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Get root-level folders and pages
  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const rootPages = pages.filter(p => !p.folder_id);

  // Auto-expand folder when viewing a page inside it
  useEffect(() => {
    if (currentPage?.folder_id) {
      setExpandedFolders(prev => {
        if (!prev.has(currentPage.folder_id!)) {
          const next = new Set(prev);
          next.add(currentPage.folder_id!);
          // Save to localStorage
          localStorage.setItem('expandedFolders', JSON.stringify([...next]));
          return next;
        }
        return prev;
      });
    }
  }, [currentPage]);

  // Toggle folder expanded state
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      // Save to localStorage
      localStorage.setItem('expandedFolders', JSON.stringify([...next]));
      return next;
    });
  };

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

  return (
    <aside
      className="relative shrink-0 overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: sidebarOpen ? '1px solid var(--border-color)' : 'none',
        width: sidebarOpen ? '288px' : '0px',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="w-[288px] h-full overflow-y-auto"
        style={{
          padding: '32px 16px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: sidebarOpen ? '0.1s' : '0s',
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
        {/* Spaces Section Header */}
        {rootFolders.length > 0 && (
          <div className="px-3 py-1 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
            Spaces
          </div>
        )}
        
        {/* Root Folders */}
        {rootFolders.map(folder => {
          const folderPages = getFolderPages(folder.id);
          const active = isActive(folder.id, 'folder');
          const isExpanded = expandedFolders.has(folder.id);

          return (
            <div key={folder.id}>
              <div className="flex items-center gap-1">
                {/* Chevron toggle */}
                {folderPages.length > 0 && (
                  <button
                    onClick={(e) => toggleFolder(folder.id, e)}
                    className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--hover-bg)] active:scale-90 transition-all duration-150"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <path d="M4 2L8 6L4 10" />
                    </svg>
                  </button>
                )}
                {folderPages.length === 0 && <div className="w-5" />}
                
                {/* Folder button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToFolder(folder.id);
                  }}
                  className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150 text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] ${
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
              </div>

              {/* Pages in folder */}
              {folderPages.length > 0 && isExpanded && (
                <div className="ml-9 mt-0.5 space-y-0.5">
                  {folderPages.map(page => (
                    <button
                      key={page.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigateToPage(page.id);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all duration-150 text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] ${
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigateToPage(page.id);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150 text-left hover:bg-[var(--hover-bg)] active:scale-[0.98] ${
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
      </div>
    </aside>
  );
}

