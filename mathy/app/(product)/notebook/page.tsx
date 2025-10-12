'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

    const currentSize = panel.getSize();

    if (sidebarOpen) {
      const targetSize =
        lastSidebarSizeRef.current > COLLAPSE_THRESHOLD
          ? lastSidebarSizeRef.current
          : DEFAULT_SIDEBAR_SIZE;

      if (Math.abs(currentSize - targetSize) > 0.5) {
        requestAnimationFrame(() => panel.resize(targetSize));
      } else {
        panel.resize(targetSize);
      }
    } else {
      if (currentSize > COLLAPSE_THRESHOLD) {
        lastSidebarSizeRef.current = currentSize;
      }
      requestAnimationFrame(() => panel.resize(HIDDEN_PANEL_SIZE));
    }
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
            transition: 'flex-grow 0.3s ease, min-width 0.3s ease, width 0.3s ease',
          }}
        >
          <Sidebar />
        </Panel>
        <PanelResizeHandle
          className="bg-transparent transition-colors duration-200"
          style={{
            backgroundColor: 'transparent',
            width: sidebarOpen ? '1px' : '0px',
            transition: 'width 0.3s ease, background-color 0.2s ease',
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
            transition: 'flex-grow 0.3s ease',
          }}
        >
          <WorkspaceView />
        </Panel>
      </PanelGroup>
    </div>
  );
}
