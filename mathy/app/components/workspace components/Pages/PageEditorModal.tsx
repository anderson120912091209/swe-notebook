'use client';

import React, { useEffect, useState, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema, getMathMenuItems, getSlashMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { CustomSuggestionMenu } from './CustomSuggestionMenu';

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

// Error Boundary to catch BlockNote initialization errors
class BlockNoteErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BlockNote Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Helper function to deeply validate blocks structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateBlock(block: any, depth = 0): boolean {
  // Prevent infinite recursion
  if (depth > 10) return false;

  if (!block || typeof block !== 'object') return false;
  if (typeof block.id !== 'string' || block.id.length === 0) return false;
  if (typeof block.type !== 'string' || block.type.length === 0) return false;

  // Validate props if present (should be object or undefined)
  if (block.props !== undefined && typeof block.props !== 'object') return false;

  // Validate content if present (should be array or undefined)
  if (block.content !== undefined && !Array.isArray(block.content)) return false;

  // Recursively validate children if present
  if (block.children !== undefined) {
    if (!Array.isArray(block.children)) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!block.children.every((child: any) => validateBlock(child, depth + 1))) return false;
  }

  return true;
}

// Helper function to validate blocks structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateBlocks(blocks: any): boolean {
  if (!Array.isArray(blocks)) return false;
  if (blocks.length === 0) return false;

  // Validate each block deeply
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return blocks.every((block: any) => validateBlock(block));
}

// Helper function to sanitize and validate blocks before passing to BlockNote
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeBlocks(content: any): any[] | undefined {
  if (!content) return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blocks: any = undefined;

    // Extract blocks from different possible formats
    if (content.blocks && Array.isArray(content.blocks)) {
      blocks = content.blocks.length > 0 ? content.blocks : undefined;
    } else if (Array.isArray(content)) {
      blocks = content.length > 0 ? content : undefined;
    }

    // Deeply validate blocks structure - if invalid, return undefined to use default
    if (blocks && !validateBlocks(blocks)) {
      console.warn('Invalid blocks structure detected, using default content', {
        blocksCount: blocks.length,
        sampleBlock: blocks[0],
      });
      return undefined;
    }

    return blocks;
  } catch (error) {
    console.error('Error parsing content for preview:', error);
    return undefined;
  }
}

// Inner component that uses the hook - wrapped in error boundary
function PageEditorModalInner({ isOpen, onClose, pageId }: PageEditorModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { pages, folders, updatePage } = useWorkspace();
  const router = useRouter();

  const [page, setPage] = useState(pages.find(p => p.id === pageId));
  const [title, setTitle] = useState(page?.title || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showAddTags, setShowAddTags] = useState(false);
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
  // Use sanitizeBlocks for deep validation
  const initialContent = React.useMemo(() => {
    return sanitizeBlocks(page?.content);
  }, [page?.content]);

  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: initialContent, // Will be undefined if invalid - safe for BlockNote
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

  // Handle expand to full page with seamless animation
  const handleExpandToFullPage = useCallback(() => {
    setIsExpanding(true);

    // Navigate immediately for seamless transition
    router.push(`/notebook/page/${pageId}`);
  }, [router, pageId]);

  if (!page) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      classNames={{
        base: `w-full h-[95vh] max-w-full mt-[5vh] sm:max-w-[95vw] sm:w-[95vw] sm:h-[95vh] sm:mt-0 md:max-w-[85vw] md:w-[85vw] md:h-[90vh] lg:max-w-[70vw] lg:w-[68vw] lg:h-[85vh] transition-all duration-300 ease-out ${isExpanding ? 'opacity-0 scale-95' : ''
          }`,
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
      <ModalContent className="h-full sm:h-[95vh] 
      md:h-[90vh] lg:h-[85vh] rounded-lg 
      border-1 border-white/10 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        {/* Header */}
        <ModalHeader className="flex h-16 items-center justify-between px-4 backdrop-blur 
        sm:px-6 border-b border-gray-200" style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg)' }}>
          {/* Left side - Folder tag and Title display */}
          <div className="flex items-center gap-3 flex-1">
            {/* Folder Tag */}
            {currentFolder && (
              <span
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium flex-shrink-0"
                style={{
                  background: currentFolder.color ? lightenHex(parseHex(currentFolder.color)?.hex ?? FALLBACK_COLOR, 0.7) : 'var(--hover-bg)',
                  color: '#374151',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/*Folder Icon in the Tag*/}
                <svg className="w-3 h-3 mr-1" fill={currentFolder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {currentFolder.name}
              </span>
            )}
            <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
              {title || 'Untitled'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-xs px-2" style={{ color: 'var(--foreground-muted)' }}>
                Saving...
              </span>
            )}

            {/* Expand to full page button */}
            <button
              onClick={handleExpandToFullPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[var(--hover-bg)] transition-all duration-200"
              style={{ color: 'var(--foreground-muted)' }}
              title="Expand to full page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Expand</span>
            </button>

            {/* Close page button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[var(--hover-bg)] transition-all duration-200"
              style={{ color: 'var(--foreground-muted)' }}
              title="Close page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span></span>
            </button>
          </div>
        </ModalHeader>

        {/* Body */}
        <ModalBody className="p-0 overflow-hidden">
          <div className="h-full overflow-auto">
            {/* Page Header with Title and Metadata */}
            <div
              className="px-4 sm:px-8 md:px-12 lg:px-16 pt-8 pb-4 relative group max-w-4xl mx-auto"
              onMouseEnter={() => setShowAddTags(true)}
              onMouseLeave={() => setShowAddTags(false)}
            >
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

              {/* Add Tags Button - Hover Revealed */}
              <button
                className={`absolute right-8 top-8 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${showAddTags ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                style={{
                  background: 'var(--hover-bg)',
                  color: 'var(--foreground-muted)',
                  border: '1px solid var(--border-color)'
                }}
                onClick={() => {
                  // TODO: Implement add tags functionality
                  console.log('Add tags clicked');
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Add Tags</span>
              </button>
            </div>

            {/* Editor */}
            <div className="pb-16">
              <div
                className="max-w-4xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16"
                style={{
                  minHeight: '500px',
                }}
              >
                <BlockNoteView
                  editor={editor}
                  theme={theme}
                  onChange={handleContentChange}
                  slashMenu={false}
                  className="font-[family-name:var(--font-geist-sans)] [&_.bn-editor]:!bg-transparent [&_.bn-container]:!bg-transparent [&_.bn-editor]:!px-0"
                >
                  {/* $ menu for inline math */}
                  {/* @ts-expect-error - SuggestionMenuController API is correct but TypeScript inference has issues */}
                  <SuggestionMenuController
                    triggerCharacter="$"
                    getItems={async (query) =>
                      filterSuggestionItems(getMathMenuItems(editor), query)
                    }
                    suggestionMenuComponent={CustomSuggestionMenu}
                  />
                  {/* / slash menu with inline math included */}
                  <SuggestionMenuController
                    triggerCharacter="/"
                    getItems={async (query) =>
                      filterSuggestionItems(getSlashMenuItems(editor), query)
                    }
                    suggestionMenuComponent={CustomSuggestionMenu}
                  />
                </BlockNoteView>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// Outer component with error boundary
export default function PageEditorModal({ isOpen, onClose, pageId }: PageEditorModalProps) {
  const fallback = (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      classNames={{
        base: "w-full h-[95vh] max-w-full",
        wrapper: "items-start sm:items-center justify-center",
        backdrop: "bg-black/50"
      }}
    >
      <ModalContent className="h-full" style={{ background: 'var(--card-bg)' }}>
        <ModalHeader>
          <span style={{ color: 'var(--foreground)' }}>Error Loading Editor</span>
        </ModalHeader>
        <ModalBody>
          <div className="p-8 text-center" style={{ color: 'var(--foreground-muted)' }}>
            <p>Unable to load the page editor. The content may be corrupted.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-md"
              style={{
                background: 'var(--hover-bg)',
                color: 'var(--foreground)'
              }}
            >
              Close
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  return (
    <BlockNoteErrorBoundary fallback={fallback}>
      <PageEditorModalInner isOpen={isOpen} onClose={onClose} pageId={pageId} />
    </BlockNoteErrorBoundary>
  );
}

