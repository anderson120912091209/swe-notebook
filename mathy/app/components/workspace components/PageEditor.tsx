'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import dynamic from 'next/dynamic';
import { customSchema, getMathMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import Sidebar from './Sidebar';

const MathEditor = dynamic(() => import('@/app/components/product components/MathEditor'), {
  ssr: false,
});

interface PageEditorProps {
  pageId: string;
}

export default function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { pages, folders, currentPage, updatePage, deletePage } = useWorkspace();
  const [page, setPage] = useState(pages.find(p => p.id === pageId));
  const [title, setTitle] = useState(page?.title || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [mathLatex, setMathLatex] = useState('');

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

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: page?.content?.blocks || page?.content || undefined,
  });

  // Auto-save content with debouncing
  const handleContentChange = useCallback(async () => {
    if (!page) return;
    
    const blocks = editor.document;
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
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Sidebar />
      
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between px-4 backdrop-blur sm:px-8" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--sidebar-bg)' }}>
          {/* Breadcrumb */}
          <nav className="flex flex-1 items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {getBreadcrumb()}
          </nav>

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
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--hover-bg)]"
              style={{ color: 'var(--foreground)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Page Title */}
        <div className="px-8 pt-8">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none"
            style={{ color: 'var(--foreground)' }}
            placeholder="Untitled"
          />
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto px-8 pb-16">
          <BlockNoteView
            editor={editor}
            theme={theme}
            onChange={handleContentChange}
            className="font-[family-name:var(--font-geist-sans)]"
            style={{ minHeight: 'calc(100vh - 200px)' }}
            slashMenu={false}
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) =>
                filterSuggestionItems(getMathMenuItems(editor), query)
              }
            />
          </BlockNoteView>
        </div>
      </div>

      {/* Math Editor Modal */}
      {showMathEditor && (
        <MathEditor
          latex={mathLatex}
          onSave={(newLatex) => {
            // Handle math save
            setMathLatex(newLatex);
            setShowMathEditor(false);
          }}
          onCancel={() => setShowMathEditor(false)}
        />
      )}
    </div>
  );
}

