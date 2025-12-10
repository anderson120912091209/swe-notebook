'use client';

import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { WorkspaceProvider } from '@/app/contexts/WorkspaceContext';
import QueryProvider from '@/app/lib/react-query/QueryProvider';
import Sidebar from '@/app/components/workspace components/Workspace View/Sidebar';

function ProductLayoutContent({ children }: { children: React.ReactNode }) {
  const COLLAPSE_THRESHOLD = 1;
  const HIDDEN_PANEL_SIZE = 0.0001;
  const FIXED_SIDEBAR_WIDTH_PX = 240; // Fixed sidebar width in pixels (always the same size)
  const MIN_SIDEBAR_WIDTH_PX = 180; // Minimum usable width in pixels

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const lastSidebarSizePercentRef = useRef<number | null>(null); // Store as percentage for Panel
  const [shouldAnimateLayout, setShouldAnimateLayout] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suppressAnimationResetRef = useRef(false);
  
  // CRITICAL: Use consistent initial values for SSR and client hydration
  // This prevents hydration mismatches. We'll calculate actual sizes after mount.
  // Always return the same values - never check window during initial render!
  const INITIAL_PANEL_SIZES = { defaultSize: 20, minSize: 15, maxSize: 25 };
  
  const [panelSizes, setPanelSizes] = useState(INITIAL_PANEL_SIZES);
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted after hydration completes
  // This ensures we only calculate window-dependent values after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Convert fixed pixel width to percentage for Panel component
  // Panel uses percentages, so we need to convert our fixed pixel width
  // IMPORTANT: Only run this AFTER hydration (isMounted === true)
  useEffect(() => {
    if (!isMounted) return; // Wait for hydration to complete first!
    
    const calculatePanelSizes = () => {
      if (typeof window === 'undefined') return;
      const screenWidth = window.innerWidth;
      
      // Convert fixed pixel width to percentage
      const defaultSizePercent = (FIXED_SIDEBAR_WIDTH_PX / screenWidth) * 100;
      const minSizePercent = (MIN_SIDEBAR_WIDTH_PX / screenWidth) * 100;
      
      // Cap max size at 40% to prevent sidebar from taking too much space
      const maxSizePercent = Math.min((FIXED_SIDEBAR_WIDTH_PX * 1.5 / screenWidth) * 100, 40);
      
      const newSizes = {
        defaultSize: Math.min(defaultSizePercent, 30), // Cap at 30% for very small screens
        minSize: Math.min(minSizePercent, 25),
        maxSize: maxSizePercent,
      };
      
      setPanelSizes(newSizes);
      
      // If sidebar is open, maintain the fixed pixel width by resizing to the new percentage
      if (sidebarOpen && sidebarPanelRef.current) {
        const panel = sidebarPanelRef.current;
        const currentSize = panel.getSize();
        // Only resize if the calculated size differs significantly from current
        if (Math.abs(currentSize - newSizes.defaultSize) > 1) {
          panel.resize(newSizes.defaultSize);
        }
      }
    };

    calculatePanelSizes();
    window.addEventListener('resize', calculatePanelSizes);
    return () => window.removeEventListener('resize', calculatePanelSizes);
  }, [sidebarOpen, isMounted]);

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
      // Always use fixed pixel width (240px) converted to percentage when opening
      // This ensures consistent size regardless of screen size
      const targetSize = panelSizes.defaultSize;

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
        lastSidebarSizePercentRef.current = currentSize;
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
  }, [sidebarOpen, panelSizes.defaultSize]);

  return (
    <WorkspaceProvider sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <div className="h-screen overflow-hidden" style={{ background: 'var(--outer-bg)', color: 'var(--foreground)' }}>
        <PanelGroup direction="horizontal" className="h-screen">
          <Panel
            ref={sidebarPanelRef}
            defaultSize={panelSizes.defaultSize}
            minSize={sidebarOpen ? panelSizes.minSize : 0}
            maxSize={panelSizes.maxSize}
            onResize={(size) => {
              if (!suppressAnimationResetRef.current && shouldAnimateLayout) {
                setShouldAnimateLayout(false);
                if (animationTimeoutRef.current) {
                  clearTimeout(animationTimeoutRef.current);
                  animationTimeoutRef.current = null;
                }
              }
              if (size > COLLAPSE_THRESHOLD) {
                lastSidebarSizePercentRef.current = size;
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
              width: sidebarOpen ? '4px' : '0px',
              transition: shouldAnimateLayout ? 'width 0.3s ease' : 'none',
              zIndex: 50,
              marginLeft: '-2px',
              marginRight: '-2px',
              position: 'relative'
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
          <ProductLayoutContent>{children}</ProductLayoutContent>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

