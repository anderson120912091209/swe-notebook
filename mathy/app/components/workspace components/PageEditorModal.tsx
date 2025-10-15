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

const FALLBACK_COLOR = '#9CC5FF';

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!/^#?[0-9a-f]{3,6}$/i.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function expandToSixDigit(hex: string): string {
  if (hex.length === 7) return hex.toUpperCase();
  const expanded = hex.slice(1).split('').map(c => c + c).join('');
  return `#${expanded.toUpperCase()}`;
}

function parseHex(color?: string | null) {
  const normalized = normalizeHex(color);
  if (!normalized) return null;
  const full = expandToSixDigit(normalized);
  const intValue = parseInt(full.slice(1), 16);
  return {
    hex: full,
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function lightenHex(hex: string, amount: number): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  
  const { r, g, b } = parsed;
  const lighten = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}

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
  const { theme } = useTheme();
  const { user } = useAuth();
  const { pages, folders, updatePage, deletePage } = useWorkspace();
  
  const [page, setPage] = useState(pages.find(p => p.id === pageId));
  const [title, setTitle] = useState(page?.title || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

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

  // Menu handlers
  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share page');
    setShowMenu(false);
  };

  const handleCopy = () => {
    // TODO: Implement copy functionality
    console.log('Copy page');
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate page');
    setShowMenu(false);
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
        base: "w-full h-[95vh] max-w-full mt-[5vh] sm:max-w-[95vw] sm:w-[95vw] sm:h-[95vh] sm:mt-0 md:max-w-[85vw] md:w-[85vw] md:h-[90vh] lg:max-w-[70vw] lg:w-[68vw] lg:h-[85vh]",
        wrapper: "items-start sm:items-center justify-center",
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
      <ModalContent className="h-full sm:h-[95vh] md:h-[90vh] lg:h-[85vh] rounded-none sm:rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        {() => (
          <>
            {/* Header */}
            <ModalHeader className="flex h-12 items-center justify-between px-4 backdrop-blur sm:px-6 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--sidebar-bg)' }}>
              {/* Left side - Title display */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {title || 'Untitled'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {isSaving && (
                  <span className="text-xs px-2" style={{ color: 'var(--foreground-muted)' }}>
                    Saving...
                  </span>
                )}
                
                {/* Open as Page Button */}
                <button
                  onClick={() => {
                    // Navigate to the page editor route
                    window.open(`/notebook/page/${pageId}`, '_blank');
                  }}
                  className="p-2 rounded hover:bg-[var(--hover-bg)] transition-colors"
                  style={{ color: 'var(--foreground-muted)' }}
                  title="Open as page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>

                {/* Three Dots Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-2 rounded hover:bg-[var(--hover-bg)] transition-colors"
                    style={{ color: 'var(--foreground-muted)' }}
                    title="More options"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div 
                      className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-20"
                      style={{ 
                        background: 'var(--card-bg)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <div className="py-1">
                        <button
                          onClick={handleShare}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          Share
                        </button>
                        <button
                          onClick={handleCopy}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                        <button
                          onClick={handleDuplicate}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Duplicate
                        </button>
                        <hr className="my-1" style={{ borderColor: 'var(--border-color)' }} />
                        <button
                          onClick={handleDelete}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                    {/* Folder Tag */}
                    {currentFolder && (
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide"
                        style={{ 
                          background: currentFolder.color ? lightenHex(parseHex(currentFolder.color)?.hex ?? FALLBACK_COLOR, 0.7) : 'var(--hover-bg)',
                          color: '#374151',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {/*Folder Icon in the Tag*/}
                        <svg className="w-3 h-3 mr-1.5" fill={currentFolder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {currentFolder.name.toUpperCase()}
                      </span>
                    )}
                    <div 
                      className="px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide"
                      style={{
                        background: 'var(--hover-bg)',
                        color: 'var(--foreground-muted)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      Status: Draft
                    </div>
                    <div 
                      className="px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide"
                      style={{
                        background: 'var(--hover-bg)',
                        color: 'var(--foreground-muted)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {currentFolder ? `AREA: ${currentFolder.name.toUpperCase()}` : 'AREA: PERSONAL'}
                    </div>
                    <div 
                      className="px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide"
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

