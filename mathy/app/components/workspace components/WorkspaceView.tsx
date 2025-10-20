'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import FolderCard from './FolderCard';
import PageCard from './PageCard';
import WorkspaceLayout from './WorkspaceLayout';
import SearchAndNewButtons from './SearchAndNewButtons';

type TabType = 'items' | 'notebooks' | 'canvases';


export default function WorkspaceView() {
  const { folders, pages, deleteFolder, deletePage, loading } = useWorkspace();
  const [activeTab, setActiveTab] = useState<TabType>('notebooks');
  const [searchQuery, setSearchQuery] = useState('');

  // Get root-level folders and pages (memoized)
  const rootFolders = useMemo(() => folders.filter(f => !f.parent_folder_id), [folders]);
  const rootPages = useMemo(() => pages.filter(p => !p.folder_id), [pages]);
  
  // Get recent pages (10 most recently edited pages across all folders)
  const recentPages = useMemo(() => {
    return [...pages]
      .sort((a, b) => new Date(b.last_edited_at).getTime() - new Date(a.last_edited_at).getTime())
      .slice(0, 10);
  }, [pages]);

  // Get page count for each folder (memoized)
  const getFolderPageCount = useCallback((folderId: string) => {
    return pages.filter(p => p.folder_id === folderId).length;
  }, [pages]);

  // Search filtering logic
  const filteredRootFolders = useMemo(() => {
    if (!searchQuery.trim()) return rootFolders;
    return rootFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rootFolders, searchQuery]);

  const filteredRootPages = useMemo(() => {
    if (!searchQuery.trim()) return rootPages;
    return rootPages.filter(page => 
      page.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rootPages, searchQuery]);

  // Search handler
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);



  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: 'var(--foreground-muted)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (filteredRootFolders.length === 0 && filteredRootPages.length === 0 && !searchQuery) {
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


  const headerContent = (
    <>
      {/* Empty - buttons moved to main content area */}
    </>
  );

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
      <span>Workspace</span>
    </nav>
  );

  return (
    <WorkspaceLayout header={headerContent} breadcrumb={breadcrumb}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with title and compact tabs */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              Workspace
            </h1>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Manage your notebooks, folders, and pages
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search and New Buttons */}
            <SearchAndNewButtons
              onNewClick={() => {
                // TODO: Implement new page/folder creation
              }}
              newButtonText="New"
              newButtonDisabled={false}
              newButtonLoading={false}
              searchPlaceholder="Search title..."
              onSearchChange={handleSearchChange}
              searchQuery={searchQuery}
            />
            
            {/* Compact Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            {(['items', 'notebooks', 'canvases'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  background: activeTab === tab ? 'var(--active-bg)' : 'transparent',
                  color: activeTab === tab ? 'var(--foreground)' : 'var(--foreground-muted)',
                }}
              >
                {tab === 'items' && (
                  <>
                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    Papers
                  </>
                )}
                {tab === 'notebooks' && (
                  <>
                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    Notebooks
                  </>
                )}
                {tab === 'canvases' && (
                  <>
                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Canvases
                  </>
                )}
              </button>
            ))}
            </div>
          </div>
        </div>


          {/* Items Section */}
          {activeTab === 'items' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Papers & Materials
              </h2>
              <p style={{ color: 'var(--foreground-muted)' }}>
                Research papers and materials coming soon...
              </p>
            </div>
          )}

        {/* Notebooks Section */}
        {activeTab === 'notebooks' && (
          <div>

        {/* Folders Section */}
        {filteredRootFolders.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                Folders {searchQuery && `(${filteredRootFolders.length} found)`}
              </h3>
            </div>
            <div className="relative">
              {/* Left chevron button */}
              <button
                id="folders-left-chevron"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-opacity duration-200 opacity-0"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--foreground-muted)',
                }}
                onClick={() => {
                  const container = document.getElementById('folders-scroll-container');
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Right chevron button */}
              <button
                id="folders-right-chevron"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-opacity duration-200"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--foreground-muted)',
                  opacity: 0,
                }}
                onClick={() => {
                  const container = document.getElementById('folders-scroll-container');
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div 
                id="folders-scroll-container"
                className="flex gap-6 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                ref={(el) => {
                  if (el) {
                    // Check initial state on mount
                    const leftChevron = document.getElementById('folders-left-chevron');
                    const rightChevron = document.getElementById('folders-right-chevron');
                    
                    if (leftChevron && rightChevron) {
                      const scrollLeft = el.scrollLeft;
                      const maxScroll = el.scrollWidth - el.clientWidth;
                      
                      // Show chevrons based on scroll position
                      leftChevron.style.opacity = scrollLeft > 0 ? '1' : '0';
                      rightChevron.style.opacity = maxScroll > 1 ? '1' : '0';
                    }
                  }
                }}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const leftChevron = document.getElementById('folders-left-chevron');
                  const rightChevron = document.getElementById('folders-right-chevron');
                  
                  if (leftChevron && rightChevron) {
                    const scrollLeft = container.scrollLeft;
                    const maxScroll = container.scrollWidth - container.clientWidth;
                    
                    // Show left chevron if not at the beginning
                    leftChevron.style.opacity = scrollLeft > 0 ? '1' : '0';
                    
                    // Show right chevron if not at the end
                    rightChevron.style.opacity = scrollLeft < maxScroll - 1 ? '1' : '0';
                  }
                }}
              >
                {filteredRootFolders.map(folder => (
                  <div key={folder.id} className="flex-shrink-0">
                    <FolderCard
                      folder={folder}
                      pageCount={getFolderPageCount(folder.id)}
                      onDelete={deleteFolder}
                      onEdit={() => {/* TODO: Implement edit modal */}}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent Pages Section */}
        {recentPages.length > 0 && !searchQuery && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                Recently visited
              </h3>
            </div>
            <div className="relative">
              {/* Left shadow overlay */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-200"
                id="left-shadow"
                style={{ 
                  opacity: 0,
                  background: 'linear-gradient(to right, var(--background) 0%, var(--background) 20%, transparent 100%)'
                }}
              />
              
              {/* Right shadow overlay */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-200"
                id="right-shadow"
                style={{ 
                  opacity: 1,
                  background: 'linear-gradient(to left, var(--background) 0%, var(--background) 20%, transparent 100%)'
                }}
              />
              
              <div 
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                ref={(el) => {
                  if (el) {
                    // Check initial state on mount
                    const leftShadow = document.getElementById('left-shadow');
                    const rightShadow = document.getElementById('right-shadow');
                    
                    if (leftShadow && rightShadow) {
                      const scrollLeft = el.scrollLeft;
                      const maxScroll = el.scrollWidth - el.clientWidth;
                      
                      // Show right shadow by default if there's more content
                      rightShadow.style.opacity = maxScroll > 1 ? '1' : '0';
                      leftShadow.style.opacity = scrollLeft > 0 ? '1' : '0';
                    }
                  }
                }}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const leftShadow = document.getElementById('left-shadow');
                  const rightShadow = document.getElementById('right-shadow');
                  
                  if (leftShadow && rightShadow) {
                    const scrollLeft = container.scrollLeft;
                    const maxScroll = container.scrollWidth - container.clientWidth;
                    
                    // Show left shadow if not at the beginning
                    leftShadow.style.opacity = scrollLeft > 0 ? '1' : '0';
                    
                    // Show right shadow if not at the end
                    rightShadow.style.opacity = scrollLeft < maxScroll - 1 ? '1' : '0';
                  }
                }}
              >
                {recentPages.map(page => {
                  const folder = page.folder_id ? folders.find(f => f.id === page.folder_id) : null;
                  return (
                    <div key={page.id} className="flex-shrink-0 w-48 h-80">
                      <PageCard
                        page={page}
                        folderName={folder?.name}
                        folderColor={folder?.color}
                        onDelete={deletePage}
                        onEdit={() => {/* TODO: Implement edit modal */}}
                        onMove={() => {/* TODO: Implement move functionality */}}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Pages Section */}
        {filteredRootPages.length > 0 && (
          <section>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
              Pages {searchQuery && `(${filteredRootPages.length} found)`}
                  </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRootPages.map(page => (
                <PageCard
                  key={page.id}
                  page={page}
                  onDelete={deletePage}
                  onEdit={() => {/* TODO: Implement edit modal */}}
                  onMove={() => {/* TODO: Implement move functionality */}}
                />
              ))}
            </div>
          </section>
              )}
            </div>
          )}

          {/* Canvases Section */}
          {activeTab === 'canvases' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎨</div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Canvases
              </h2>
              <p style={{ color: 'var(--foreground-muted)' }}>
                Visual canvas workspace coming soon...
              </p>
            </div>
        )}

        {/* Search Results Empty State */}
        {searchQuery && filteredRootFolders.length === 0 && filteredRootPages.length === 0 && (
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

    </WorkspaceLayout>
  );
}
