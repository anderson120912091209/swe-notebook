'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import dynamic from 'next/dynamic';
import { customSchema, getMathMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';

type NavigationItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: 'Workspace',
    items: [
      {
        id: 'quick-captures',
        icon: 'Q',
        title: 'Quick Captures',
        description: 'Scratchpad for experiments',
        badge: 'Today',
      },
      {
        id: 'daily-notes',
        icon: 'D',
        title: 'Daily Research Notes',
        description: 'Chronological lab stream',
      },
    ],
  },
  {
    label: 'Projects',
    items: [
      {
        id: 'quantum-field',
        icon: 'QF',
        title: 'Quantum Field Playbook',
        description: 'Reference equations and heuristics',
      },
      {
        id: 'fusion-roadmap',
        icon: 'FR',
        title: 'Fusion Roadmap',
        description: 'Milestones and open questions',
      },
      {
        id: 'ml-simulations',
        icon: 'ML',
        title: 'ML Assisted Simulations',
        description: 'Dataset notes and outputs',
      },
    ],
  },
];

const DEFAULT_PAGE_ID =
  NAVIGATION_SECTIONS.flatMap((section) => section.items)[0]?.id ?? 'workspace-page';

const MathEditor = dynamic(() => import('./MathEditor'), {
  ssr: false,
});

export const ScienceEditor: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [mathPosition, setMathPosition] = useState({ x: 0, y: 0 });
  const [activePageId, setActivePageId] = useState(DEFAULT_PAGE_ID);
  const [pageTitle, setPageTitle] = useState<string>('Research Notebook');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Create the BlockNote editor instance with custom schema including math block.
  const editor = useCreateBlockNote({ schema: customSchema });

  const navigationItems = useMemo(
    () => NAVIGATION_SECTIONS.flatMap((section) => section.items),
    [],
  );

  const activePage = useMemo(
    () => navigationItems.find((item) => item.id === activePageId),
    [activePageId, navigationItems],
  );

  useEffect(() => {
    if (activePage) {
      setPageTitle(activePage.title);
    }
  }, [activePage]);

  const handleSlashCommand = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setMathPosition({ x: rect.left, y: rect.bottom + window.scrollY });
    }
    setShowMathEditor(true);
  };

  const handleMathSave = (latex: string) => {
    if (!latex.trim()) {
      setShowMathEditor(false);
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      const mathSpan = document.createElement('span');
      mathSpan.className = 'math-inline';
      mathSpan.contentEditable = 'false';
      mathSpan.setAttribute('data-math', latex);

      try {
        if (window.katex) {
          const html = window.katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
          });
          mathSpan.innerHTML = html;

          range.deleteContents();
          range.insertNode(mathSpan);

          const space = document.createTextNode('\u00A0');
          range.setStartAfter(mathSpan);
          range.insertNode(space);

          range.setStartAfter(space);
          range.setEndAfter(space);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (error) {
        console.error('Error rendering math:', error);
      }
    }

    setShowMathEditor(false);
  };

  const handleMathCancel = () => {
    setShowMathEditor(false);
  };

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <aside 
        className="relative shrink-0 px-6 py-8 lg:flex lg:flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{ 
          background: 'var(--sidebar-bg)', 
          borderRight: '1px solid var(--border-color)',
          width: sidebarOpen ? '288px' : '0px',
          padding: sidebarOpen ? '32px 24px' : '32px 0px',
          opacity: sidebarOpen ? 1 : 0,
        }}
      >
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
              MN
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Math Note</p>
              <p className="text-xs" style={{ color: 'var(--muted-text)' }}>Knowledge workspace</p>
            </div>
          </div>
          <button
            className="mt-4 w-full rounded-md px-3 py-2 text-sm font-medium transition"
            style={{ 
              border: '1px solid var(--border-color)', 
              background: 'var(--card-bg)', 
              color: 'var(--foreground)' 
            }}
          >
            + New page
          </button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto pb-16">
          {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-text)' }}>
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePageId(item.id)}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition"
                    style={{
                      background: activePageId === item.id ? 'var(--active-bg)' : 'transparent',
                      color: activePageId === item.id ? 'var(--foreground)' : 'var(--muted-text)',
                    }}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold" style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)' }}>
                      {item.icon}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{item.title}</span>
                        {item.badge ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: 'var(--hover-bg)', color: 'var(--muted-text)' }}>
                            {item.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs" style={{ color: 'var(--muted-text)' }}>
                        {item.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-8 text-xs" style={{ color: 'var(--muted-text)' }}>
          Storage 62% — upgrade for more space
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between px-4 backdrop-blur sm:px-8" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--sidebar-bg)' }}>
          <div className="flex flex-1 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--hover-bg)]"
              style={{ color: 'var(--foreground)' }}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarOpen ? (
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </>
                )}
              </svg>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold" style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)' }}>
              {pageTitle
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="hidden w-full max-w-sm items-center gap-2 rounded-md px-3 py-1.5 text-sm sm:flex" style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted-text)' }}>Search</span>
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search knowledge base"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="relative h-9 w-16 rounded-full transition-all duration-300 ease-in-out"
              style={{ 
                background: theme === 'light' ? '#e0e0e0' : '#4a4a4a',
              }}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <div 
                className="absolute top-1 left-1 h-7 w-7 rounded-full transition-all duration-300 ease-in-out flex items-center justify-center"
                style={{
                  background: theme === 'light' ? '#fbbf24' : '#1e293b',
                  transform: theme === 'light' ? 'translateX(0)' : 'translateX(28px)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                {theme === 'light' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
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
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8" stroke="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </div>
            </button>
            <button className="hidden rounded-md px-3 py-1.5 text-sm font-medium transition sm:inline-flex" style={{ border: '1px solid var(--border-color)', color: 'var(--muted-text)', background: 'var(--card-bg)' }}>
              Share
            </button>
            <button
              onClick={handleSlashCommand}
              className="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              style={{ background: 'var(--foreground)', color: 'var(--background)' }}
            >
              Export
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 pb-16 pt-10 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md text-base font-semibold" style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)' }}>
                  {activePage?.icon ?? 'NB'}
                </div>
                <div className="flex flex-1 flex-col">
                  <input
                    value={pageTitle}
                    onChange={(event) => setPageTitle(event.target.value)}
                    className="w-full bg-transparent text-3xl font-semibold outline-none"
                    style={{ color: 'var(--foreground)' }}
                  />
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-text)' }}>
                    <span>Last edited just now</span>
                    <span>•</span>
                    <span>Created by you</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full px-3 py-1 font-semibold uppercase tracking-wide" style={{ border: '1px solid var(--border-color)', color: 'var(--muted-text)' }}>
                  Status: Draft
                </span>
                <span className="rounded-full px-3 py-1 font-semibold uppercase tracking-wide" style={{ border: '1px solid var(--border-color)', color: 'var(--muted-text)' }}>
                  Area: {activePage?.title ?? 'Notebook'}
                </span>
                <span className="rounded-full px-3 py-1 font-semibold uppercase tracking-wide" style={{ border: '1px solid var(--border-color)', color: 'var(--muted-text)' }}>
                  Priority: High
                </span>
              </div>
            </div>

            <div className="rounded-2xl p-8 shadow-sm" style={{ background: 'var(--card-bg)', boxShadow: '0 1px 3px var(--shadow)', border: '1px solid var(--border-color)', minHeight: 'calc(100vh - 400px)' }}>
              <BlockNoteView editor={editor} theme={theme} className="notion-blocknote" style={{ minHeight: '600px' }}>
                {/* Adds a math menu which opens with the "$" key */}
                {/* @ts-expect-error - SuggestionMenuController API is correct but TypeScript inference has issues */}
                <SuggestionMenuController
                  triggerCharacter="$"
                  getItems={async (query) =>
                    filterSuggestionItems(getMathMenuItems(editor), query)
                  }
                />
              </BlockNoteView>
            </div>
          </div>
        </div>
      </div>

      {showMathEditor && (
        <div
          style={{
            position: 'fixed',
            left: `${mathPosition.x}px`,
            top: `${mathPosition.y + 5}px`,
            zIndex: 1000,
          }}
        >
          <MathEditor onSave={handleMathSave} onCancel={handleMathCancel} autoFocus />
        </div>
      )}
    </div>
  );
};

export default ScienceEditor;

