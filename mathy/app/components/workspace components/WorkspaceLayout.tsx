'use client';

import React from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  rightHeader?: React.ReactNode;
}

export default function WorkspaceLayout({ children, header, rightHeader }: WorkspaceLayoutProps) {
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen" style={{ background: 'var(--outer-bg)' }}>
      {/* Top-level header with navigation buttons */}
      <header className="flex h-16 items-center justify-between px-4 backdrop-blur" style={{ background: 'var(--outer-bg)' }}>
        {/* Left side - Navigation buttons */}
        <div className="flex items-center gap-1">
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
        </div>

        {/* Right side - Empty for now, could add global actions */}
        <div></div>
      </header>

      {/* Main content container - fixed layout */}
      <div 
        className="h-[calc(100vh-4rem)] w-calc[100%] m-2.5 mt-1 rounded-lg overflow-hidden"
        style={{ 
          background: 'var(--background)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col h-full">
          {/* Container Header */}
          <header className="flex h-16 items-center justify-between px-4 backdrop-blur sm:px-8" style={{ background: 'var(--background)' }}>
            {/* Left side - Custom header content */}
            <div className="flex items-center gap-3 flex-1">
              {header}
            </div>

            {/* Right side - Custom content + Theme toggle */}
            <div className="flex items-center gap-2">
              {rightHeader}
              <button 
                onClick={toggleTheme}
                className="theme-toggle relative h-7 w-12 rounded-full hover:opacity-90 active:scale-95"
                style={{ 
                  background: `var(--${theme === 'light' ? 'border-color' : 'hover-bg'})`,
                  border: '1px solid var(--border-color)',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease, opacity 0.2s ease, transform 0.1s ease',
                }}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                <div 
                  className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full flex items-center justify-center"
                  style={{
                    background: theme === 'light' ? 'var(--active-bg)' : 'var(--foreground)',
                    transform: theme === 'light' ? 'translateX(0) scale(1)' : 'translateX(20px) scale(1)',
                    boxShadow: `0 2px 8px var(--shadow), 0 1px 3px var(--shadow)`,
                    transition: 'transform 0.25s ease, background-color 0.25s ease, box-shadow 0.2s ease',
                  }}
                >
                  <div style={{
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    opacity: theme === 'light' ? 1 : 0,
                    transform: theme === 'light' ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(180deg)',
                    position: 'absolute',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  </div>
                  <div style={{
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    opacity: theme === 'dark' ? 1 : 0,
                    transform: theme === 'dark' ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-180deg)',
                    position: 'absolute',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--foreground-muted)" stroke="none">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  </div>
                </div>
              </button>
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
