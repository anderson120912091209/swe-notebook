'use client';

import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { WorkspaceProvider } from '@/app/contexts/WorkspaceContext';
import ProtectedRoute from '@/app/components/auth components/ProtectedRoute';
import QueryProvider from '@/app/lib/react-query/QueryProvider';
import Sidebar from '@/app/components/workspace components/Sidebar';

function ProductLayoutContent({ children }: { children: React.ReactNode }) {
  const COLLAPSE_THRESHOLD = 1;
  const HIDDEN_PANEL_SIZE = 0.0001;
  const DEFAULT_SIDEBAR_SIZE = 20;

  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <WorkspaceProvider sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <div className="h-screen overflow-hidden" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <PanelGroup direction="horizontal" className="h-screen">
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
            className="h-screen"
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
            className="h-screen"
            style={{
              transition: shouldAnimateLayout ? 'flex-grow 0.3s ease' : 'none',
            }}
          >
            {children}
          </Panel>
        </PanelGroup>
      </div>
    </WorkspaceProvider>
  );
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <ProtectedRoute>
            <ProductLayoutContent>{children}</ProductLayoutContent>
          </ProtectedRoute>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

