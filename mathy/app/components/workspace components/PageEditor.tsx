'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema, getMathMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import Sidebar from './Sidebar';

interface PageEditorProps {
  pageId: string;
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? 'yesterday' : `${diffInDays} days ago`;
  }
  
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

// Get user display name
const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'you';
  return user.user_metadata?.full_name || 
         user.user_metadata?.name || 
         user.email?.split('@')[0] || 
         'you';
};

export default function PageEditor({ pageId }: PageEditorProps) {
  const COLLAPSE_THRESHOLD = 1;
  const HIDDEN_PANEL_SIZE = 0.0001;
  const DEFAULT_SIDEBAR_SIZE = 20;

  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { pages, folders, updatePage, deletePage, sidebarOpen, setSidebarOpen } = useWorkspace();
  const [page, setPage] = useState(pages.find(p => p.id === pageId));
  const [title, setTitle] = useState(page?.title || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTime, setCurrentTime] = useState(new Date()); // Used to trigger re-renders for relative time updates
  const [shouldAnimateLayout, setShouldAnimateLayout] = useState(false);

  // Get current folder for display
  const currentFolder = page?.folder_id ? folders.find(f => f.id === page.folder_id) : null;

  // Debounce timers
  const contentSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const sidebarPanelRef = React.useRef<ImperativePanelHandle | null>(null);
  const lastSidebarSizeRef = React.useRef<number>(DEFAULT_SIDEBAR_SIZE);
  const animationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const suppressAnimationResetRef = React.useRef(false);

  // Update page when data changes (but not while user is actively editing)
  useEffect(() => {
    const currentPageData = pages.find(p => p.id === pageId);
    if (currentPageData) {
      setPage(currentPageData);
      
      // Only update title if user is not actively editing it
      // Check if there's no pending save timer
      if (!titleSaveTimerRef.current) {
        setTitle(currentPageData.title);
      }
    }
  }, [pageId, pages]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (contentSaveTimerRef.current) {
        clearTimeout(contentSaveTimerRef.current);
      }
      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current);
      }
    };
  }, []);

  // Update current time every 60 seconds for relative time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) {
      return;
    }

    const currentSize = panel.getSize();
    const releaseAfterResize = () => {
      requestAnimationFrame(() => {
        suppressAnimationResetRef.current = false;
      });
    };

    suppressAnimationResetRef.current = true;

    if (sidebarOpen) {
      const targetSize =
        lastSidebarSizeRef.current > COLLAPSE_THRESHOLD
          ? lastSidebarSizeRef.current
          : DEFAULT_SIDEBAR_SIZE;

      if (Math.abs(currentSize - targetSize) > 0.5) {
        requestAnimationFrame(() => {
          panel.resize(targetSize);
          releaseAfterResize();
        });
      } else {
        panel.resize(targetSize);
        releaseAfterResize();
      }
    } else {
      if (currentSize > COLLAPSE_THRESHOLD) {
        lastSidebarSizeRef.current = currentSize;
      }
      requestAnimationFrame(() => {
        panel.resize(HIDDEN_PANEL_SIZE);
        releaseAfterResize();
      });
    }

    setShouldAnimateLayout(true);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setShouldAnimateLayout(false);
      animationTimeoutRef.current = null;
    }, 350);
  }, [sidebarOpen]);

  // Initialize BlockNote editor with safe content parsing
  const getInitialContent = () => {
    if (!page?.content) return undefined;
    
    try {
      // If content has blocks array, use it
      if (page.content.blocks && Array.isArray(page.content.blocks)) {
        // If blocks array is empty, return undefined to use BlockNote default
        return page.content.blocks.length > 0 ? page.content.blocks : undefined;
      }
      
      // If content is already an array, use it directly
      if (Array.isArray(page.content)) {
        return page.content.length > 0 ? page.content : undefined;
      }
      
      // Otherwise return undefined to use default
      return undefined;
    } catch (error) {
      console.error('Error parsing initial content:', error);
      return undefined;
    }
  };

  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: getInitialContent(),
  });

  // Auto-save content with debouncing
  const handleContentChange = useCallback(async () => {
    if (!page) return;
    
    try {
      const blocks = editor.document;
      
      // Validate blocks before saving
      if (!blocks || !Array.isArray(blocks)) {
        console.warn('Invalid blocks structure, skipping save');
        return;
      }
      
      const content = { blocks }; // Wrap blocks in object for database storage
      
      // Clear previous timer
      if (contentSaveTimerRef.current) {
        clearTimeout(contentSaveTimerRef.current);
      }
      
      setIsSaving(true);
      
      // Set new timer to save after 1 second of no typing
      contentSaveTimerRef.current = setTimeout(async () => {
        try {
          await updatePage(pageId, { content });
        } catch (error) {
          console.error('Failed to save content:', error);
        } finally {
          setTimeout(() => setIsSaving(false), 500);
        }
      }, 1000);
    } catch (error) {
      console.error('Error in handleContentChange:', error);
      setIsSaving(false);
    }
  }, [editor, page, pageId, updatePage]);

  // Auto-save title with debouncing
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    
    if (!page) return;
    
    // Clear previous timer
    if (titleSaveTimerRef.current) {
      clearTimeout(titleSaveTimerRef.current);
    }
    
    // Set new timer to save after 500ms of no typing
    titleSaveTimerRef.current = setTimeout(async () => {
      try {
        await updatePage(pageId, { title: newTitle });
      } catch (error) {
        console.error('Failed to save title:', error);
      }
    }, 500);
  }, [page, pageId, updatePage]);

  // Delete page handler
  const handleDelete = async () => {
    if (!confirm(`Delete "${page?.title}"?`)) return;
    
    try {
      await deletePage(pageId);
      
      // Navigate back
      if (page?.folder_id) {
        router.push(`/notebook/folder/${page.folder_id}`);
      } else {
        router.push('/notebook');
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  // Get breadcrumb
  const getBreadcrumb = () => {
    if (!page) return null;
    
    if (page.folder_id) {
      const folder = folders.find(f => f.id === page.folder_id);
      if (folder) {
        return (
          <>
            <button
              onClick={() => router.push('/notebook')}
              className="hover:underline"
            >
              Workspace
            </button>
            <span className="mx-2">/</span>
            <button
              onClick={() => router.push(`/notebook/folder/${folder.id}`)}
              className="hover:underline"
            >
              {folder.name}
            </button>
            <span className="mx-2">/</span>
            <span>{title}</span>
          </>
        );
      }
    }
    
    return (
      <>
        <button
          onClick={() => router.push('/notebook')}
          className="hover:underline"
        >
          Workspace
        </button>
        <span className="mx-2">/</span>
        <span>{title}</span>
      </>
    );
  };

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Page not found</h2>
          <button
            onClick={() => router.push('/notebook')}
            className="px-4 py-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
          >
            Go back to workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <PanelGroup direction="horizontal" className="min-h-screen">
        <Panel
          ref={sidebarPanelRef}
          defaultSize={20}
          minSize={sidebarOpen ? 15 : 0}
          maxSize={40}
          onResize={(size) => {
            if (!suppressAnimationResetRef.current && shouldAnimateLayout) {
              setShouldAnimateLayout(false);
              if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
              }
            }
            if (size > COLLAPSE_THRESHOLD) {
              lastSidebarSizeRef.current = size;
            }
            const shouldBeOpen = size > COLLAPSE_THRESHOLD;
            if (shouldBeOpen !== sidebarOpen) {
              setSidebarOpen(shouldBeOpen);
            }
          }}
          className="min-h-screen"
          style={{
            transition: shouldAnimateLayout ? 'flex-grow 0.3s ease, min-width 0.3s ease, width 0.3s ease' : 'none',
          }}
        >
          <Sidebar />
        </Panel>
        <PanelResizeHandle
          className="bg-transparent transition-colors duration-200"
          style={{
            backgroundColor: 'transparent',
            width: sidebarOpen ? '1px' : '0px',
            transition: shouldAnimateLayout ? 'width 0.3s ease, background-color 0.2s ease' : 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        />
        <Panel
          className="min-h-screen"
          style={{
            transition: shouldAnimateLayout ? 'flex-grow 0.3s ease' : 'none',
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col h-full">
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
              {getBreadcrumb()}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Saving...
              </span>
            )}
            <button
              onClick={handleDelete}
              className="flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors hover:bg-red-500/10 text-red-500"
              title="Delete page"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {/* Theme Toggle Switch */}
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

        {/* Page Header with Title and Metadata */}
        <div className="px-8 pt-8 pb-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none mb-2"
            style={{ color: 'var(--foreground)' }}
            placeholder="Untitled"
          />

          {/* Metadata */}
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            <span 
              title={page?.last_edited_at ? new Date(page.last_edited_at).toLocaleString() : ''}
              className="cursor-help"
            >
              Last edited {page?.last_edited_at ? formatRelativeTime(page.last_edited_at) : 'just now'}
            </span>
            <span>•</span>
            <span
              title={page?.created_at ? new Date(page.created_at).toLocaleString() : ''}
              className="cursor-help"
            >
              Created by {getUserDisplayName(user)}
            </span>
          </div>

          {/* Property Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div 
              className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
              style={{
                background: 'var(--hover-bg)',
                color: 'var(--foreground-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              STATUS: DRAFT
            </div>
            <div 
              className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
              style={{
                background: 'var(--hover-bg)',
                color: 'var(--foreground-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              {currentFolder ? `AREA: ${currentFolder.name.toUpperCase()}` : 'AREA: PERSONAL'}
            </div>
            <div 
              className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
              style={{
                background: 'var(--hover-bg)',
                color: 'var(--foreground-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              PRIORITY: HIGH
            </div>
          </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto px-8 pb-16">
              <div 
                className="rounded-lg p-6"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  minHeight: 'calc(100vh - 400px)',
                }}
              >
                <BlockNoteView
                  editor={editor}
                  theme={theme}
                  onChange={handleContentChange}
                  className="font-[family-name:var(--font-geist-sans)]"
                >
                  {/* $ menu for inline math */}
                  {/* @ts-expect-error - SuggestionMenuController API is correct but TypeScript inference has issues */}
                  <SuggestionMenuController
                    triggerCharacter="$"
                    getItems={async (query) =>
                      filterSuggestionItems(getMathMenuItems(editor), query)
                    }
                  />
                </BlockNoteView>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
