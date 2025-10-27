'use client';

import React from 'react';

type TabType = 'items' | 'notebooks' | 'canvases';

interface WorkspaceHeaderSwitchProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function WorkspaceHeaderSwitch({ activeTab, onTabChange }: WorkspaceHeaderSwitchProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      {(['items', 'notebooks', 'canvases'] as TabType[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === tab
              ? 'text-white'
              : ''
          }`}
          style={{
            background: activeTab === tab ? 'var(--active-bg)' : 'transparent',
            color: activeTab === tab ? 'var(--foreground)' : 'var(--foreground-muted)',
          }}
        >
          {tab === 'items' && (
            <>
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Papers
            </>
          )}
          {tab === 'notebooks' && (
            <>
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              Notebooks
            </>
          )}
          {tab === 'canvases' && (
            <>
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Canvases
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// Export the TabType for use in other components
export type { TabType };
