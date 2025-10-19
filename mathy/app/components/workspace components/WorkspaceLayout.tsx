'use client';

import React from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  rightHeader?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export default function WorkspaceLayout({ children, header, rightHeader, breadcrumb }: WorkspaceLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useWorkspace();

  // Navigation handlers
  const handleBack = () => {
    window.history.back();
  };

  const handleForward = () => {
    window.history.forward();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="h-screen overflow-hidden" style={{ background: 'var(--outer-bg)' }}>
      {/* Top-level header with navigation buttons */}
      <header className="flex h-16 items-center justify-between px-4 backdrop-blur" style={{ background: 'var(--outer-bg)' }}>
        {/* Left side - Navigation buttons + Sidebar toggle (when hidden) + Breadcrumb */}
        <div className="flex items-center gap-1">
          {/* Sidebar toggle - only show when sidebar is hidden */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--hover-bg)]"
              style={{ color: 'var(--foreground-muted)' }}
              title="Show sidebar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
          )}
          
          <button
            onClick={handleBack}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--foreground-muted)' }}
            title="Back"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            onClick={handleForward}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--foreground-muted)' }}
            title="Forward"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <button
            onClick={handleRefresh}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--foreground-muted)' }}
            title="Refresh"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          {/* Breadcrumb navigation - right next to buttons */}
          {breadcrumb && (
            <div className="ml-3">
              {breadcrumb}
            </div>
          )}
        </div>

        {/* Right side - Empty for now, could add global actions */}
        <div></div>
      </header>

      {/* Main content container - fixed layout */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{ 
          height: 'calc(100vh - 4rem - 0.8em)', // 4rem header + 1rem total margins
          width: 'calc(100vw - 1rem)',
          maxWidth: 'calc(100% - 1rem)',
          marginLeft: '0.5rem',
          marginRight: '0.5rem',
          marginTop: '0.25rem',
          marginBottom: '0.75rem',
          background: 'var(--background)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col h-full">
          {/* Container Header */}
          <header className="flex h-8 items-center justify-between px-4 backdrop-blur sm:px-8" style={{ background: 'var(--background)' }}>
            {/* Left side - Custom header content */}
            <div className="flex items-center gap-3 flex-1">
              {header}
            </div>

            {/* Right side - Custom content */}
            <div className="flex items-center gap-2">
              {rightHeader}
            </div>
          </header>

          {/* Content - scrollable within container */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
