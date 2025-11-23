'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Tldraw, TldrawApp, TldrawProps } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import type { Canvas } from '@/app/types/workspace';

interface CanvasEditorProps {
  canvas: Canvas;
  onSave?: (content: any) => void;
  onTitleChange?: (title: string) => void;
  className?: string;
}

export default function CanvasEditor({ 
  canvas, 
  onSave, 
  onTitleChange,
  className = '' 
}: CanvasEditorProps) {
  const [app, setApp] = useState<TldrawApp | null>(null);
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
  const handleDocumentChange = useCallback(async (app: TldrawApp) => {
    if (!onSave) return;

    setIsSaving(true);
    
    try {
      const document = app.document;
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
      return (app: TldrawApp) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handleDocumentChange(app), 1000);
      };
    }, [handleDocumentChange]),
    [handleDocumentChange]
  );

  // Handle tldraw mount
  const handleMount = useCallback((app: TldrawApp) => {
    setApp(app);
    
    // Set up change listener
    app.addListener('change', () => {
      debouncedSave(app);
    });
  }, [debouncedSave]);

  // Handle tldraw unmount
  const handleUnmount = useCallback(() => {
    if (app) {
      app.removeAllListeners();
      setApp(null);
    }
  }, [app]);

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
        document={initialDocument}
        onMount={handleMount}
        onUnmount={handleUnmount}
        components={components}
        // Customize tldraw appearance to match your theme
        options={{
          // You can customize tldraw options here
          // For example, disable certain tools, change UI appearance, etc.
        }}
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
