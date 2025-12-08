'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema, getMathMenuItems, getSlashMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import WorkspaceLayout from '@/app/components/workspace components/Workspace View/WorkspaceLayout';
import { getFolderBreadcrumbPath, generateFolderBreadcrumbJSX } from '@/app/lib/breadcrumbUtils';
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
function PageEditorInner({ pageId }: PageEditorProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { pages, folders, updatePage, sidebarOpen } = useWorkspace();

  // Debug sidebar state
  useEffect(() => {
    console.log('PageEditor: sidebarOpen is', sidebarOpen);
  }, [sidebarOpen]);
  const [page, setPage] = useState(pages.find(p => p.id === pageId));
  const [title, setTitle] = useState(page?.title || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Initialize BlockNote editor with safe content parsing
  // Use sanitizeBlocks for deep validation
  const initialContent = useMemo(() => {
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
          // Show saved indicator
          setIsSaving(false);
          setJustSaved(true);

          // Clear any existing saved indicator timeout
          if (savedIndicatorTimeoutRef.current) {
            clearTimeout(savedIndicatorTimeoutRef.current);
          }

          // Hide saved indicator after 2 seconds
          savedIndicatorTimeoutRef.current = setTimeout(() => {
            setJustSaved(false);
          }, 2000);
        } catch (error) {
          console.error('Failed to save content:', error);
          setIsSaving(false);
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


  // Get breadcrumb
  const getBreadcrumb = () => {
    if (!page) return null;

    if (page.folder_id) {
      const folderPath = getFolderBreadcrumbPath(page.folder_id, folders);
      const folderBreadcrumbs = generateFolderBreadcrumbJSX(
        folderPath,
        (folderId) => router.push(`/notebook/folder/${folderId}`),
        () => router.push('/notebook')
      );

      return (
        <>
          {folderBreadcrumbs}
          <span className="mx-2">/</span>
          <span>{title}</span>
        </>
      );
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

  const headerContent = (
    <>
      {/* Empty - breadcrumb moved to top header */}
    </>
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
      {getBreadcrumb()}
    </nav>
  );

  const rightHeaderContent = (
    <>
      {isSaving && (
        <div className="absolute top-4 right-4 z-50">
          <span className="text-xs px-2 py-1 rounded-md" style={{
            color: 'var(--foreground-muted)',
            background: 'var(--hover-bg)'
          }}>
            Saving...
          </span>
        </div>
      )}
      {justSaved && !isSaving && (
        <div className="absolute top-4 right-4 z-50">
          <span className="text-xs px-2 py-1 rounded-md flex items-center gap-1" style={{
            color: 'var(--foreground-muted)',
            background: 'var(--hover-bg)'
          }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        </div>
      )}
    </>
  );

  return (
    <WorkspaceLayout header={headerContent} rightHeader={rightHeaderContent} breadcrumb={breadcrumb}>

      {/* Page Header with Title and Metadata */}
      <div
        className="px-4 sm:px-8 md:px-12 lg:px-16 pt-4 pb-2 relative group max-w-4xl mx-auto"
        onMouseEnter={() => setShowAddTags(true)}
        onMouseLeave={() => setShowAddTags(false)}
      >
        {/* Folder Tag */}
        {currentFolder && (
          <div className="mb-2">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium"
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
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-4xl font-bold bg-transparent
               border-none outline-none mb-1"
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
          className={`absolute right-8 top-4 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${showAddTags ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
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

      {/* Editor - scrollable content within container */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div
          className="max-w-4xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16"
          style={{
            minHeight: 'calc(100vh - 350px)',
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
    </WorkspaceLayout>
  );
}

// Outer component with error boundary
export default function PageEditor({ pageId }: PageEditorProps) {
  const fallback = (
    <WorkspaceLayout
      header={null}
      rightHeader={null}
      breadcrumb={null}
      title="Error"
      description=""
      showDescriptionField={false}
      onToggleDescription={() => { }}
      showHamburgerButton={true}
    >
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Error Loading Editor
          </h2>
          <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
            Unable to load the page editor. The content may be corrupted.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-md"
            style={{
              background: 'var(--hover-bg)',
              color: 'var(--foreground)'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </WorkspaceLayout>
  );

  return (
    <BlockNoteErrorBoundary fallback={fallback}>
      <PageEditorInner pageId={pageId} />
    </BlockNoteErrorBoundary>
  );
}