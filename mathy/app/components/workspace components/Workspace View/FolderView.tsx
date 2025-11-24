'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import PageCard from '../Pages/PageCard';
import CanvasCard from '../Canvas/CanvasCard';
import WorkspaceLayout from './WorkspaceLayout';
import SearchAndNewButtons from '../SearchAndNewButtons';
import FolderTag from '../Folders/FolderTag';
import CreateCanvasModal from '../Canvas/CreateCanvasModal';
import { getFolderBreadcrumbPath, generateFolderBreadcrumbJSX } from '@/app/lib/breadcrumbUtils';

interface FolderViewProps {
  folderId: string;
}

export default function FolderView({ folderId }: FolderViewProps) {
  const router = useRouter();
  const { folders, pages, canvas, createPage, createFolder, createCanvas, deletePage, deleteCanvas, updateFolder, loading } = useWorkspace();
  const [folder, setFolder] = useState(folders.find(f => f.id === folderId));
  const [creatingPage, setCreatingPage] = useState(false);
  const [creatingCanvas, setCreatingCanvas] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const [folderDescription, setFolderDescription] = useState(folder?.description || '');
  const [folderTitle, setFolderTitle] = useState(folder?.name || '');

  useEffect(() => {
    const currentFolder = folders.find(f => f.id === folderId);
    setFolder(currentFolder);
    if (currentFolder) {
      setFolderTitle(currentFolder.name);
      setFolderDescription(currentFolder.description || '');
    }
  }, [folderId, folders]);

  // Get child folders and pages
  const childFolders = useMemo(() => folders.filter(f => f.parent_folder_id === folderId), [folders, folderId]);
  const folderPagesList = useMemo(() => pages.filter(p => p.folder_id === folderId), [pages, folderId]);
  const folderCanvasList = useMemo(() => canvas.filter(c => c.folder_id === folderId), [canvas, folderId]);

  // Search filtering
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return folderPagesList;
    return folderPagesList.filter(page =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folderPagesList, searchQuery]);

  const filteredCanvas = useMemo(() => {
    if (!searchQuery.trim()) return folderCanvasList;
    return folderCanvasList.filter(canvas =>
      canvas.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folderCanvasList, searchQuery]);

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

  const handleCreateFolder = async () => {
    try {
      const newFolder = await createFolder('Untitled Folder', undefined, '#6B7280', '', folderId);
      console.log('Folder created successfully:', newFolder);
      // Navigate to the new folder for a smooth transition
      router.push(`/notebook/folder/${newFolder.id}`);
    } catch (error) {
      console.error('Failed to create folder:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const handleGoBack = () => {
    router.push('/notebook');
  };

  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (!folder || newTitle.trim() === folder.name) return;

    const trimmedTitle = newTitle.trim();
    if (trimmedTitle.length > 25) {
      alert('Folder name must be 25 characters or less.');
      return;
    }

    try {
      setFolderTitle(trimmedTitle);
      await updateFolder(folderId, { name: trimmedTitle });
      console.log('Folder title updated successfully:', trimmedTitle);
    } catch (error) {
      console.error('Failed to update folder title:', error);
      // Revert the local state on error
      setFolderTitle(folder.name);
    }
  }, [folder, folderId, updateFolder]);

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
      {/* Empty - content moved to header */}
    </>
  );

  const rightHeaderContent = (
    <SearchAndNewButtons
      onNewClick={() => setCreatingPage(true)}
      onNewFolder={() => {
        // TODO: Implement folder creation within folder
        console.log('Create folder in folder clicked');
      }}
      onNewPage={() => setCreatingPage(true)}
      onNewCanvas={() => {
        setCreatingCanvas(true);
      }}
      newButtonDisabled={creatingPage}
      newButtonLoading={creatingPage}
      searchPlaceholder="Search pages..."
      onSearchChange={handleSearchChange}
      searchQuery={searchQuery}
    />
  );

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
      <Image
        src="/logos/claritylogo-notext.png"
        alt="Clarity"
        width={15}
        height={15}
        className="opacity-60"
      />
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
    <WorkspaceLayout
      header={headerContent}
      rightHeader={rightHeaderContent}
      breadcrumb={breadcrumb}
      title={folderTitle}
      editableTitle={true}
      onTitleChange={handleTitleChange}
      customTagContent={
        <FolderTag
          folderName={`${filteredPages.length + filteredChildFolders.length} items`}
          folderColor={folder.color}
        />
      }
      description={folderDescription}
      onDescriptionChange={async (desc) => {
        setFolderDescription(desc);
        try {
          await updateFolder(folderId, { description: desc });
          console.log('Folder description updated successfully:', desc);
        } catch (error) {
          console.error('Failed to update folder description:', error);
          // Revert the local state on error
          setFolderDescription(folder?.description || '');
        }
      }}
      showDescriptionField={showDescriptionField}
      onToggleDescription={() => setShowDescriptionField(!showDescriptionField)}
      showHamburgerButton={true}
    >
      <div className="p-8">
        <div className="max-w-7xl mx-auto">

          {/* Child Folders */}
          {filteredChildFolders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
                Folders {searchQuery && `(${filteredChildFolders.length} found)`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Create Folder Card - Dashed */}
                <div
                  onClick={handleCreateFolder}
                  className="p-4 rounded-xl border-2 border-dashed cursor-pointer hover:bg-[var(--hover-bg)] transition-all group flex flex-col justify-between h-[120px]"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <svg
                    className="w-8 h-8 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <span className="font-medium text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Create folder
                  </span>
                </div>

                {filteredChildFolders.map(childFolder => (
                  <div
                    key={childFolder.id}
                    onClick={() => router.push(`/notebook/folder/${childFolder.id}`)}
                    className="p-4 rounded-xl border cursor-pointer hover:shadow-sm hover:border-[var(--foreground-muted)] transition-all flex flex-col justify-between h-[120px]"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${childFolder.color}20`, color: childFolder.color || '#6B7280' }}
                      >
                        {childFolder.icon || '📁'}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--hover-bg)]" style={{ color: 'var(--foreground-muted)' }}>
                        {pages.filter(p => p.folder_id === childFolder.id).length}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {childFolder.name}
                      </h4>
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
                {/* Create Page Card - Dashed */}
                <div
                  onClick={handleCreatePage}
                  className="p-4 rounded-xl border-2 border-dashed cursor-pointer hover:bg-[var(--hover-bg)] transition-all group flex flex-col justify-between h-[160px]"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <svg
                    className="w-8 h-8 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="font-medium text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Create page
                  </span>
                </div>

                {filteredPages.map(page => (
                  <PageCard
                    key={page.id}
                    page={page}
                    folderName={folder?.name}
                    folderColor={folder?.color}
                    onDelete={deletePage}
                    onEdit={() => {/* TODO: Implement edit modal */ }}
                    onMove={() => {/* TODO: Implement move functionality */ }}
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

          {/* Canvas Grid */}
          {filteredCanvas.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
                Canvas {searchQuery && `(${filteredCanvas.length} found)`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCanvas.map(canvasItem => (
                  <CanvasCard
                    key={canvasItem.id}
                    canvas={canvasItem}
                    folderName={folder?.name}
                    folderColor={folder?.color}
                    onDelete={deleteCanvas}
                    onEdit={() => {/* TODO: Implement edit modal */ }}
                    onMove={() => {/* TODO: Implement move functionality */ }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Search Results Empty State */}
          {searchQuery && filteredPages.length === 0 && filteredChildFolders.length === 0 && filteredCanvas.length === 0 && (
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

      {/* Create Canvas Modal */}
      <CreateCanvasModal
        isOpen={creatingCanvas}
        onClose={() => setCreatingCanvas(false)}
        defaultFolderId={folderId}
      />
    </WorkspaceLayout>
  );
}

