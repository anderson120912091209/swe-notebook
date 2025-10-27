'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { useRouter } from 'next/navigation';
import type { Canvas } from '@/app/types/workspace';
import CanvasEditor from './CanvasEditor';

const FALLBACK_COLOR = '#9CC5FF';

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!/^#?[0-9a-f]{3,6}$/i.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function expandToSixDigit(hex: string): string {
  if (hex.length === 7) return hex.toUpperCase();
  if (hex.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  return hex.toUpperCase();
}

function parseHex(hex?: string | null): { hex: string; r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  
  const expanded = expandToSixDigit(normalized);
  const r = parseInt(expanded.slice(1, 3), 16);
  const g = parseInt(expanded.slice(3, 5), 16);
  const b = parseInt(expanded.slice(5, 7), 16);
  
  return { hex: expanded, r, g, b };
}

function lightenHex(hex: string, amount: number): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  
  const lighten = (value: number) => Math.round(value + (255 - value) * amount);
  
  return `rgb(${lighten(parsed.r)}, ${lighten(parsed.g)}, ${lighten(parsed.b)})`;
}

interface CanvasEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasId: string;
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getUserDisplayName = (user: User | null): string => {
  return user?.user_metadata?.preferred_name || 
         user?.user_metadata?.given_name || 
         user?.user_metadata?.full_name || 
         user?.email?.split('@')[0] || 
         'you';
};

export default function CanvasEditorModal({ isOpen, onClose, canvasId }: CanvasEditorModalProps) {
  const { user } = useAuth();
  const { canvas, folders, updateCanvas } = useWorkspace();
  const router = useRouter();
  
  const [currentCanvas, setCurrentCanvas] = useState(canvas.find(c => c.id === canvasId));
  const [title, setTitle] = useState(currentCanvas?.title || 'Untitled Canvas');
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showAddTags, setShowAddTags] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current folder for display
  const currentFolder = currentCanvas?.folder_id ? folders.find(f => f.id === currentCanvas.folder_id) : null;

  // Debounce timers
  const contentSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update canvas when data changes (but not while user is actively editing)
  useEffect(() => {
    const currentCanvasData = canvas.find(c => c.id === canvasId);
    if (currentCanvasData) {
      setCurrentCanvas(currentCanvasData);
      
      // Only update title if user is not actively editing it
      if (!titleSaveTimerRef.current) {
        setTitle(currentCanvasData.title);
      }
    }
  }, [canvasId, canvas]);

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
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.canvas-menu-container')) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Save title with debounce
  const saveTitle = useCallback(async (newTitle: string) => {
    if (!currentCanvas || newTitle === currentCanvas.title) return;

    setIsSaving(true);
    try {
      await updateCanvas(currentCanvas.id, { title: newTitle });
    } catch (error) {
      console.error('Failed to save canvas title:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentCanvas, updateCanvas]);

  // Handle title change with debounce
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    // Clear existing timer
    if (titleSaveTimerRef.current) {
      clearTimeout(titleSaveTimerRef.current);
    }

    // Set new timer
    titleSaveTimerRef.current = setTimeout(() => {
      saveTitle(newTitle);
    }, 1000);
  }, [saveTitle]);

  // Handle title blur (save immediately)
  const handleTitleBlur = useCallback(() => {
    if (titleSaveTimerRef.current) {
      clearTimeout(titleSaveTimerRef.current);
    }
    saveTitle(title);
  }, [title, saveTitle]);

  // Handle expand to full page
  const handleExpandToFullPage = useCallback(() => {
    setIsExpanding(true);
    setTimeout(() => {
      router.push(`/notebook/canvas/${canvasId}`);
    }, 300);
  }, [router, canvasId]);

  if (!currentCanvas) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="full"
      classNames={{
        base: `w-full h-[95vh] max-w-full mt-[5vh] sm:max-w-[95vw] sm:w-[95vw] sm:h-[95vh] sm:mt-0 md:max-w-[85vw] md:w-[85vw] md:h-[90vh] lg:max-w-[70vw] lg:w-[68vw] lg:h-[85vh] transition-all duration-300 ease-out ${
          isExpanding ? 'opacity-0 scale-95' : ''
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
      <ModalContent className="w-full h-full flex flex-col bg-transparent shadow-none">
        <ModalHeader className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between w-full">
            {/* Left side - Title and folder info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
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
                  onChange={handleTitleChange}
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

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Save indicator */}
              {isSaving && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              )}

              {/* Last edited info */}
              <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                {formatRelativeTime(currentCanvas.last_edited_at)}
              </div>

              {/* Menu */}
              <div className="relative canvas-menu-container">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {showMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-50"
                    style={{ 
                      background: 'var(--card-bg)', 
                      borderColor: 'var(--border-color)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div className="py-1">
                      <button
                        onClick={handleExpandToFullPage}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2 cursor-pointer"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Expand to full page
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="flex-1 p-0 overflow-hidden">
          {/* Canvas Editor */}
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
