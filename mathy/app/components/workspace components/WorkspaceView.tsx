'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import FolderCard from './FolderCard';
import PageCard from './PageCard';

type TabType = 'items' | 'notebooks' | 'canvases';

interface AuthorTag {
  name: string;
  count: number;
  selected: boolean;
}

export default function WorkspaceView() {
  const { folders, pages, workspaceItems, deleteFolder, deletePage, loading, sidebarOpen, setSidebarOpen } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'folder' | 'page' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());

  // Extract authors from pages (for demo purposes, we'll generate some mock authors)
  const authors = useMemo(() => {
    const mockAuthors: AuthorTag[] = [
      { name: 'Frank Arute', count: 2, selected: false },
      { name: 'Kunal Arya', count: 2, selected: false },
      { name: 'Shekoofeh Azizi', count: 2, selected: false },
      { name: 'Ryan Babbush', count: 2, selected: false },
      { name: 'Dave Bacon', count: 2, selected: false },
      { name: 'Joseph C. Bardin', count: 2, selected: false },
      { name: 'Rami Barends', count: 2, selected: false },
      { name: 'Joelle Barral', count: 2, selected: false },
      { name: 'Rupak Biswas', count: 2, selected: false },
      { name: 'Sergio Boixo', count: 2, selected: false },
    ];
    return mockAuthors;
  }, []);

  // Get root-level folders and pages
  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const rootPages = pages.filter(p => !p.folder_id);

  // Get page count for each folder
  const getFolderPageCount = (folderId: string) => {
    return pages.filter(p => p.folder_id === folderId).length;
  };

  // Mock research papers data (in a real app, this would come from your backend)
  const researchPapers = useMemo(() => [
    {
      id: '1',
      year: 2025,
      field: 'Computer Science',
      title: 'Disentangling the Factors of Convergence between Brains and Computer Vision Models',
      authors: ['Joséphine Rauge', 'Marc Szafraniec', 'Huy V. Vo', 'Camille Couprie', 'Patrick Labatut', 'Piotr Bojanowski', 'Valentin Wyart', 'Jean-R...'],
      citations: 0,
      downloads: 4,
      fieldColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: '2',
      year: 2007,
      field: 'Computer Science',
      title: 'The neural basis of loss aversion in decision-making under risk',
      authors: ['Sabrina M. Tom', 'Craig R. Fox', 'Christopher Trepel', 'Russell A. Poldrack'],
      citations: 4,
      downloads: 0,
      fieldColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: '3',
      year: 2025,
      field: 'Computer Science',
      title: 'The Future of Memory: Limits and Opportunities',
      authors: ['Shuhan Liu', 'Samuel Dayo', 'Peijing Li', 'Philip Levis', 'Subhasish Mitra', 'Thierry Tambe', 'David Tenenhouse', 'H.-S. Philip Wong'],
      citations: 0,
      downloads: 0,
      fieldColor: 'bg-green-100 text-green-800'
    },
    {
      id: '4',
      year: 2023,
      field: 'Computer Science',
      title: 'AnimateDiff: Animate Your Personalized Text-to-Image Diffusion Models without Specific Tuning',
      authors: ['Dahua Lin', 'Yuwei Guo', 'Ceyuan Yang', 'Anyi Rao', 'Zhengyang Liang', 'Yaohui Wang', 'Yu Qiao', 'Maneesh Agrawala', 'Bo Dai'],
      citations: 1,
      downloads: 0,
      fieldColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: '5',
      year: 2007,
      field: 'Computer Science',
      title: 'What every programmer should know about memory',
      authors: ['Ulrich Drepper'],
      citations: 0,
      downloads: 0,
      fieldColor: 'bg-red-100 text-red-800'
    },
    {
      id: '6',
      year: 2023,
      field: 'Computer Science',
      title: 'Reconstructing the Mind\'s Eye: fMRI-to-Image with Contrastive Learning and Diffusion Priors',
      authors: ['Paul S. Scotti', 'Atmadeep Banerjee', 'Jimmie Goode', 'Stephan Shabalini', 'Alex Nguyen', 'Ethan Cohen', 'Aidan J. Dempster', 'Nathalie...'],
      citations: 0,
      downloads: 0,
      fieldColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: '7',
      year: 2014,
      field: 'Computer Science',
      title: 'Quantifying the Rise and Fall of Complexity in Closed Systems: The Coffee Automaton',
      authors: ['Scott Aaronson', 'Sean M. Carroll', 'Lauren Ouellette'],
      citations: 0,
      downloads: 0,
      fieldColor: 'bg-pink-100 text-pink-800'
    },
    {
      id: '8',
      year: 1986,
      field: 'Computer Science',
      title: 'You and Your Research',
      authors: ['Richard Hamming'],
      citations: 0,
      downloads: 0,
      fieldColor: 'bg-gray-100 text-gray-800'
    }
  ], []);

  const toggleAuthor = (authorName: string) => {
    const newSelected = new Set(selectedAuthors);
    if (newSelected.has(authorName)) {
      newSelected.delete(authorName);
    } else {
      newSelected.add(authorName);
    }
    setSelectedAuthors(newSelected);
  };

  const filteredPapers = useMemo(() => {
    if (selectedAuthors.size === 0) return researchPapers;
    return researchPapers.filter(paper =>
      paper.authors.some(author => selectedAuthors.has(author))
    );
  }, [researchPapers, selectedAuthors]);

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
              background: `var(--${theme === 'light' ? 'border-color' : 'hover-bg'})`,
              border: '1px solid var(--border-color)',
              transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.1s ease',
            }}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <div 
              className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full flex items-center justify-center"
              style={{
                background: theme === 'light' ? 'var(--active-bg)' : 'var(--foreground)',
                transform: theme === 'light' ? 'translateX(0) scale(1)' : 'translateX(20px) scale(1)',
                boxShadow: `0 2px 8px var(--shadow), 0 1px 3px var(--shadow)`,
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
              }}
            >
              <div style={{
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                opacity: theme === 'light' ? 1 : 0,
                transform: theme === 'light' ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(180deg)',
                position: 'absolute',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--foreground-muted)" stroke="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-8 p-1 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            {(['items', 'notebooks', 'canvases'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    Items
                  </>
                )}
                {tab === 'notebooks' && (
                  <>
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    Notebooks
                  </>
                )}
                {tab === 'canvases' && (
                  <>
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Canvases
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Authors Section */}
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--foreground-muted)' }}>
              Authors
            </h3>
            <div className="flex flex-wrap gap-2">
              {authors.map((author) => (
                <button
                  key={author.name}
                  onClick={() => toggleAuthor(author.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedAuthors.has(author.name)
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    background: selectedAuthors.has(author.name) ? 'var(--active-bg)' : 'var(--card-bg)',
                    color: selectedAuthors.has(author.name) ? 'var(--foreground)' : 'var(--foreground-muted)',
                    border: `1px solid ${selectedAuthors.has(author.name) ? 'var(--active-bg)' : 'var(--border-color)'}`,
                  }}
                >
                  {author.name} {author.count}
                </button>
              ))}
            </div>
          </div>

          {/* Items Section */}
          {activeTab === 'items' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Items ({filteredPapers.length})
                </h2>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  <button className="flex items-center gap-2 hover:text-[var(--foreground)] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                    </svg>
                    Add
                  </button>
                  <button className="flex items-center gap-2 hover:text-[var(--foreground)] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Recently accessed
                  </button>
                </div>
              </div>

              {/* Research Papers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {/* Year and Field */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${paper.fieldColor}`}>
                        {paper.year} {paper.field}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-sm mb-2 leading-tight line-clamp-3" style={{ color: 'var(--foreground)' }}>
                      {paper.title}
                    </h3>

                    {/* Authors */}
                    <p className="text-xs mb-3 leading-relaxed line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>
                      {paper.authors.join(', ')}
                    </p>

                    {/* Metrics */}
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                          </svg>
                          {paper.citations}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {paper.downloads}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-[var(--hover-bg)] rounded transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notebooks Section */}
          {activeTab === 'notebooks' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Notebooks
                </h2>
          </div>

        {/* Folders Section */}
        {rootFolders.length > 0 && (
          <section className="mb-8">
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
              Folders
                  </h3>
            <div className="flex flex-wrap gap-6 justify-start">
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
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
              Pages
                  </h3>
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
        </div>
      </div>
    </div>
  );
}
