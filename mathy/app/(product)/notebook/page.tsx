'use client';

import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import Sidebar from '@/app/components/workspace components/Sidebar';
import WorkspaceView from '@/app/components/workspace components/WorkspaceView';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

export default function NotebookPage() {
  const COLLAPSE_THRESHOLD = 1;
  const HIDDEN_PANEL_SIZE = 0.0001;
  const DEFAULT_SIDEBAR_SIZE = 20;

  const { sidebarOpen, setSidebarOpen } = useWorkspace();
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const lastSidebarSizeRef = useRef<number>(DEFAULT_SIDEBAR_SIZE);
  const [shouldAnimateLayout, setShouldAnimateLayout] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suppressAnimationResetRef = useRef(false);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

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
          <WorkspaceView />
        </Panel>
      </PanelGroup>
    </div>
  );
}
