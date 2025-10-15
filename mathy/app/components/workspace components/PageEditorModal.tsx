'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema, getMathMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";

interface PageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function PageEditorModal({ isOpen, onClose, pageId }: PageEditorModalProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { pages, folders, updatePage, deletePage } = useWorkspace();
  
  const [page, setPage] = useState(pages.find(p => p.id === pageId));
  const [title, setTitle] = useState(page?.title || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTime, setCurrentTime] = useState(new Date()); // Used to trigger re-renders for relative time updates

  // Get current folder for display
  const currentFolder = page?.folder_id ? folders.find(f => f.id === page.folder_id) : null;

  // Debounce timers
  const contentSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

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
      onClose(); // Close modal after deletion
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  if (!page) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="full"
      classNames={{
        base: "w-full h-full max-w-full lg:max-w-[66vw] lg:w-[66vw] lg:h-auto",
        wrapper: "items-center justify-center",
        backdrop: "bg-black/50"
      }}
      motionProps={{
        variants: {
          enter: {
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
          exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.2,
              ease: 'easeIn',
            },
          },
        },
        initial: { opacity: 0, scale: 0.95 },
      }}
    >
      <ModalContent className="h-full lg:h-[80vh] lg:max-h-[80vh] rounded-none lg:rounded-2xl overflow-hidden" style={{ background: 'var(--background)' }}>
        {() => (
          <>
            {/* Header */}
            <ModalHeader className="flex h-16 items-center justify-between px-4 backdrop-blur sm:px-8 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--sidebar-bg)' }}>
              {/* Left side - Title display */}
              <div className="flex items-center gap-3 flex-1">
                <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                  {title || 'Untitled'}
                </h2>
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
                  className="theme-toggle relative h-7 w-12 rounded-full hover:opacity-90 active:scale-95"
                  style={{ 
                    background: `var(--${theme === 'light' ? 'border-color' : 'hover-bg'})`,
                    border: '1px solid var(--border-color)',
                    transition: 'background-color 0.25s ease, border-color 0.25s ease, opacity 0.2s ease, transform 0.1s ease',
                  }}
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <div 
                    className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full flex items-center justify-center"
                    style={{
                      background: theme === 'light' ? 'var(--active-bg)' : 'var(--foreground)',
                      transform: theme === 'light' ? 'translateX(0) scale(1)' : 'translateX(20px) scale(1)',
                      boxShadow: `0 2px 8px var(--shadow), 0 1px 3px var(--shadow)`,
                      transition: 'transform 0.25s ease, background-color 0.25s ease, box-shadow 0.2s ease',
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
                <button
                  onClick={onClose}
                  className="flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors hover:bg-[var(--hover-bg)]"
                  style={{ color: 'var(--foreground)' }}
                  title="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </ModalHeader>

            {/* Body */}
            <ModalBody className="p-0 overflow-hidden">
              <div className="h-full overflow-auto">
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
                      Status: Draft
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
                      Priority: High
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <div className="px-8 pb-16">
                  <div 
                    className="rounded-lg p-6"
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      minHeight: '500px',
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
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

