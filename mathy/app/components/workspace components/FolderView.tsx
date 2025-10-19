'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import PageCard from './PageCard';
import WorkspaceLayout from './WorkspaceLayout';
import SearchAndNewButtons from './SearchAndNewButtons';
import { getFolderBreadcrumbPath, generateFolderBreadcrumbJSX } from '@/app/lib/breadcrumbUtils';

interface FolderViewProps {
  folderId: string;
}

export default function FolderView({ folderId }: FolderViewProps) {
  const router = useRouter();
  const { folders, pages, createPage, deletePage, loading } = useWorkspace();
  const [folder, setFolder] = useState(folders.find(f => f.id === folderId));
  const [folderPages, setFolderPages] = useState(pages.filter(p => p.folder_id === folderId));
  const [creatingPage, setCreatingPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentFolder = folders.find(f => f.id === folderId);
    setFolder(currentFolder);
    setFolderPages(pages.filter(p => p.folder_id === folderId));
  }, [folderId, folders, pages]);

  // Get child folders and pages
  const childFolders = useMemo(() => folders.filter(f => f.parent_folder_id === folderId), [folders, folderId]);
  const folderPagesList = useMemo(() => pages.filter(p => p.folder_id === folderId), [pages, folderId]);

  // Search filtering
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return folderPagesList;
    return folderPagesList.filter(page => 
      page.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folderPagesList, searchQuery]);

  const filteredChildFolders = useMemo(() => {
    if (!searchQuery.trim()) return childFolders;
    return childFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [childFolders, searchQuery]);

  // Search handler
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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


  const headerContent = (
    <>
      {/* Empty - buttons moved to main content area */}
    </>
  );

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
      {getFolderBreadcrumbPath(folderId, folders).length > 1 
        ? generateFolderBreadcrumbJSX(
            getFolderBreadcrumbPath(folderId, folders),
            (folderId) => router.push(`/notebook/folder/${folderId}`),
            () => router.push('/notebook')
          )
        : (
          <>
            <button
              onClick={handleGoBack}
              className="hover:underline transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              Workspace
            </button>
            <span>/</span>
            <span>{folder.name}</span>
          </>
        )
      }
    </nav>
  );


  return (
    <WorkspaceLayout header={headerContent} breadcrumb={breadcrumb}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Folder info with search/new buttons */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4">
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
            
            {/* Search and New Buttons */}
            <div className="flex items-center">
              <SearchAndNewButtons
                onNewClick={handleCreatePage}
                newButtonText="New Page"
                newButtonDisabled={creatingPage}
                newButtonLoading={creatingPage}
                searchPlaceholder="Search pages..."
                onSearchChange={handleSearchChange}
                searchQuery={searchQuery}
              />
            </div>
          </div>

        {/* Child Folders */}
        {filteredChildFolders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
              Folders {searchQuery && `(${filteredChildFolders.length} found)`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChildFolders.map(childFolder => (
                <div
                  key={childFolder.id}
                  onClick={() => router.push(`/notebook/folder/${childFolder.id}`)}
                  className="p-4 rounded-lg border cursor-pointer hover:bg-[var(--hover-bg)] transition-colors"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-lg"
                      style={{ backgroundColor: childFolder.color || '#6B7280' }}
                    >
                      {childFolder.icon || '📁'}
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {childFolder.name}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        {pages.filter(p => p.folder_id === childFolder.id).length} pages
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pages Grid */}
        {filteredPages.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
              Pages {searchQuery && `(${filteredPages.length} found)`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPages.map(page => (
                <PageCard
                  key={page.id}
                  page={page}
                  folderName={folder?.name}
                  folderColor={folder?.color}
                  onDelete={deletePage}
                  onEdit={() => {/* TODO: Implement edit modal */}}
                  onMove={() => {/* TODO: Implement move functionality */}}
                />
              ))}
            </div>
          </div>
        ) : !searchQuery && (
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

        {/* Search Results Empty State */}
        {searchQuery && filteredPages.length === 0 && filteredChildFolders.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              No results found
            </h3>
            <p style={{ color: 'var(--foreground-muted)' }}>
              No pages or folders match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

