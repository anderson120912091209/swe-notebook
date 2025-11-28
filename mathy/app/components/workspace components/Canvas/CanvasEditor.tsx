'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Tldraw, TldrawProps } from '@tldraw/tldraw';
import type { Editor } from 'tldraw';
import '@tldraw/tldraw/tldraw.css';
import type { Canvas } from '@/app/types/workspace';

interface CanvasEditorProps {
  canvas: Canvas;
  onSave?: (content: Record<string, unknown>) => void;
  onTitleChange?: (title: string) => void;
  className?: string;
}

export default function CanvasEditor({ 
  canvas, 
  onSave, 
  onTitleChange,
  className = '' 
}: CanvasEditorProps) {
  const [app, setApp] = useState<Editor | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize tldraw document from canvas content
  const initialDocument = React.useMemo(() => {
    try {
      // If canvas has content, use it; otherwise create default document
      if (canvas.content && typeof canvas.content === 'object') {
        return {
          ...canvas.content,
          // Ensure required tldraw document structure
          shapes: canvas.content.shapes || {},
          bindings: canvas.content.bindings || {},
          assets: canvas.content.assets || {},
        };
      }
    } catch (error) {
      console.warn('Failed to parse canvas content:', error);
    }

    // Default empty tldraw document
    return {
      shapes: {},
      bindings: {},
      assets: {},
    };
  }, [canvas.content]);

  // Handle document changes with debounced save
  const handleDocumentChange = useCallback(async (app: Editor) => {
    if (!onSave) return;

    setIsSaving(true);
    
    try {
      // In tldraw v4, get all records from store to build document
      const allRecords = app.store.allRecords();
      const document: Record<string, unknown> = {
        shapes: {},
        bindings: {},
        assets: {},
        // Add other record types as needed
      };
      
      // Organize records by type
      for (const record of allRecords) {
        if (record.typeName === 'shape') {
          (document.shapes as Record<string, unknown>)[record.id] = record;
        } else if (record.typeName === 'binding') {
          (document.bindings as Record<string, unknown>)[record.id] = record;
        } else if (record.typeName === 'asset') {
          (document.assets as Record<string, unknown>)[record.id] = record;
        }
      }
      
      await onSave(document);
    } catch (error) {
      console.error('Failed to save canvas:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Debounced save function
  const debouncedSave = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (app: Editor) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handleDocumentChange(app), 1000);
      };
    }, [handleDocumentChange]),
    [handleDocumentChange]
  );

  // Handle tldraw mount
  const handleMount = useCallback((app: Editor) => {
    setApp(app);
    
    // Load initial document if available
    // Note: In tldraw v4, initial document should be loaded via store prop or other means
    // For now, we'll skip loading initial document and let tldraw use its default
    
    // Set up change listener
    // In tldraw v4, use store.listen() to listen for changes
    const unsubscribe = app.store.listen(() => {
      debouncedSave(app);
    });
    
    // Store unsubscribe function for cleanup
    return unsubscribe;
  }, [debouncedSave]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setApp(null);
    };
  }, []);

  // Custom components for tldraw
  const components: TldrawProps['components'] = {
    // You can customize tldraw components here
    // For example, add custom tools, UI elements, etc.
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Save indicator */}
      {isSaving && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1 rounded-lg text-sm" 
             style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}>
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <span>Saving...</span>
        </div>
      )}

      {/* tldraw Editor */}
      <Tldraw
        onMount={handleMount}
        components={components}
        // Customize tldraw appearance to match your theme
        // Note: tldraw v4 uses store prop instead of document prop
        // Initial document should be loaded via store after mount
      />
    </div>
  );
}

// Custom tldraw components and tools can be defined here
// For example, you could create custom shapes, tools, or UI elements

// Example: Custom shape for embedding page cards
export const PageCardShape = {
  id: 'page-card',
  type: 'geo',
  // Define the shape properties
  // This would allow users to drag page cards into the canvas
};

// Example: Custom tool for inserting page cards
export const PageCardTool = {
  id: 'page-card-tool',
  type: 'custom',
  // Define the tool behavior
  // This would allow users to click and insert page cards
};

// Example: Custom UI component for the toolbar
export const CustomToolbar = () => {
  return (
    <div className="flex items-center gap-2 p-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <button className="px-3 py-1 rounded text-sm hover:bg-[var(--hover-bg)] cursor-pointer" style={{ color: 'var(--foreground)' }}>
        Insert Page
      </button>
      <button className="px-3 py-1 rounded text-sm hover:bg-[var(--hover-bg)] cursor-pointer" style={{ color: 'var(--foreground)' }}>
        Insert PDF
      </button>
    </div>
  );
};
