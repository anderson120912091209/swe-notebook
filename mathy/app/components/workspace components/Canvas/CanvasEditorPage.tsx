'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import CanvasEditor from './CanvasEditor';
import WorkspaceLayout from '../Workspace View/WorkspaceLayout';
// Removed unused imports
import type { Canvas } from '@/app/types/workspace';

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

interface CanvasEditorPageProps {
  canvasId: string;
}

export default function CanvasEditorPage({ canvasId }: CanvasEditorPageProps) {
  const router = useRouter();
  const { canvas, folders, updateCanvas } = useWorkspace();
  
  const [currentCanvas, setCurrentCanvas] = useState<Canvas | null>(null);
  const [title, setTitle] = useState('');

  // Debounce timers
  const titleSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update canvas when data changes (but not while user is actively editing)
  useEffect(() => {
    const canvasData = canvas.find(c => c.id === canvasId);
    if (canvasData) {
      setCurrentCanvas(canvasData);
      
      // Only update title if user is not actively editing it
      // Check if there's no pending save timer
      if (!titleSaveTimerRef.current) {
        setTitle(canvasData.title);
      }
    }
  }, [canvasId, canvas]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current);
      }
    };
  }, []);

  // Get current folder for breadcrumb
  const currentFolder = currentCanvas?.folder_id ? folders.find(f => f.id === currentCanvas.folder_id) : null;

  // Auto-save title with debouncing (same pattern as PageEditor)
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    
    if (!currentCanvas) return;
    
    // Clear previous timer
    if (titleSaveTimerRef.current) {
      clearTimeout(titleSaveTimerRef.current);
    }
    
    // Set new timer to save after 500ms of no typing (same as PageEditor)
    titleSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateCanvas(currentCanvas.id, { title: newTitle });
      } catch (error) {
        console.error('Failed to save canvas title:', error);
      }
    }, 500);
  }, [currentCanvas, updateCanvas]);

  // Handle title blur (save immediately if there's a pending timer)
  const handleTitleBlur = useCallback(() => {
    if (titleSaveTimerRef.current) {
      clearTimeout(titleSaveTimerRef.current);
      titleSaveTimerRef.current = null;
      // Save immediately on blur
      if (currentCanvas && title !== currentCanvas.title) {
        updateCanvas(currentCanvas.id, { title });
      }
    }
  }, [title, currentCanvas, updateCanvas]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (currentCanvas?.folder_id) {
      router.push(`/notebook/folder/${currentCanvas.folder_id}`);
    } else {
      router.push('/notebook');
    }
  }, [router, currentCanvas]);

  if (!currentCanvas) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: 'var(--foreground-muted)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  // Breadcrumb
  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
      {currentFolder ? (
        <>
          <button
            onClick={() => router.push('/notebook')}
            className="hover:underline transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            Workspace
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/notebook/folder/${currentFolder.id}`)}
            className="hover:underline transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {currentFolder.name}
          </button>
          <span>/</span>
          <span>{currentCanvas.title}</span>
        </>
      ) : (
        <>
          <button
            onClick={() => router.push('/notebook')}
            className="hover:underline transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            Workspace
          </button>
          <span>/</span>
          <span>{currentCanvas.title}</span>
        </>
      )}
    </nav>
  );

  return (
    <WorkspaceLayout
      header={undefined}
      rightHeader={undefined}
      breadcrumb={breadcrumb}
      title={undefined}
      customTagContent={undefined}
      description={undefined}
      onDescriptionChange={undefined}
      showDescriptionField={false}
      onToggleDescription={undefined}
      editableTitle={false}
      onTitleChange={undefined}
      showHamburgerButton={false}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={handleBack}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Canvas Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--hover-bg)' }}>
                {currentCanvas.icon ? (
                  <span className="text-lg">{currentCanvas.icon}</span>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Title Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="w-full text-lg font-semibold bg-transparent border-none outline-none"
                  style={{ color: 'var(--foreground)' }}
                  placeholder="Untitled Canvas"
                />
              </div>

              {/* Folder Tag */}
              {currentFolder && (
                <div className="flex-shrink-0">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                    style={{ 
                      background: lightenHex(parseHex(currentFolder.color)?.hex ?? FALLBACK_COLOR, 0.7),
                      color: '#374151',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <svg className="w-3 h-3 mr-1" fill={currentFolder.color || '#6b7280'} stroke="none" viewBox="0 0 24 24">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {currentFolder.name}
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Save indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Save indicator removed - React Query handles optimistic updates */}
            </div>
          </div>
        </div>

        {/* Canvas Editor */}
        <div className="flex-1 overflow-hidden">
          <CanvasEditor
            canvas={currentCanvas}
            onSave={async (content) => {
              try {
                await updateCanvas(currentCanvas.id, { content });
              } catch (error) {
                console.error('Failed to save canvas content:', error);
              }
            }}
            onTitleChange={async (newTitle) => {
              try {
                await updateCanvas(currentCanvas.id, { title: newTitle });
              } catch (error) {
                console.error('Failed to save canvas title:', error);
              }
            }}
            className="w-full h-full"
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
