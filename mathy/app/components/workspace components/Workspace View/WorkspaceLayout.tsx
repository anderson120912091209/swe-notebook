'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  rightHeader?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  title?: string;
  customTagContent?: React.ReactNode;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  showDescriptionField?: boolean;
  onToggleDescription?: () => void;
  showHamburgerButton?: boolean;
  editableTitle?: boolean;
  onTitleChange?: (title: string) => void;
}

// Constants for consistent styling
const HEADER_SPACING = {
  container: 'px-6 py-6 sm:px-8',
  title: 'text-3xl font-bold mb-3',
  section: 'mb-3',
  element: 'gap-3',
  rightSide: 'gap-3'
};

const BUTTON_STYLES = {
  base: 'flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--hover-bg)] cursor-pointer',
  hamburger: 'flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--hover-bg)] cursor-pointer',
  color: 'var(--foreground-muted)'
};

export default function WorkspaceLayout({
  children,
  header,
  rightHeader,
  breadcrumb,
  title,
  customTagContent,
  description,
  onDescriptionChange,
  showDescriptionField,
  onToggleDescription,
  showHamburgerButton = true,
  editableTitle = false,
  onTitleChange
}: WorkspaceLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useWorkspace();

  // Navigation handlers
  const handleBack = () => window.history.back();
  const handleForward = () => window.history.forward();
  const handleRefresh = () => window.location.reload();

  return (
    <div className="h-screen overflow-hidden" style={{ background: 'var(--outer-bg)' }}>
      {/* Top Navigation Bar */}
      <TopNavigationBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        breadcrumb={breadcrumb}
        onBack={handleBack}
        onForward={handleForward}
        onRefresh={handleRefresh}
      />

      {/* Main Content Container */}
      <MainContentContainer>
        {/* Page Header */}
        <PageHeader
          title={title}
          customTagContent={customTagContent}
          description={description}
          onDescriptionChange={onDescriptionChange}
          showDescriptionField={showDescriptionField}
          onToggleDescription={onToggleDescription}
          showHamburgerButton={showHamburgerButton}
          editableTitle={editableTitle}
          onTitleChange={onTitleChange}
          header={header}
          rightHeader={rightHeader}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </MainContentContainer>
    </div>
  );
}

// Top Navigation Bar Component
function TopNavigationBar({
  sidebarOpen,
  setSidebarOpen,
  breadcrumb,
  onBack,
  onForward,
  onRefresh
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  breadcrumb?: React.ReactNode;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between px-4 backdrop-blur" style={{ background: 'var(--outer-bg)' }}>
      <div className="flex items-center gap-1">
        {/* Sidebar Toggle */}
        {!sidebarOpen && (
          <NavButton onClick={() => setSidebarOpen(true)} title="Show sidebar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </NavButton>
        )}

        {/* Navigation Buttons */}
        <NavButton onClick={onBack} title="Back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </NavButton>

        <NavButton onClick={onForward} title="Forward">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </NavButton>

        <NavButton onClick={onRefresh} title="Refresh">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </NavButton>

        {/* Breadcrumb */}
        {breadcrumb && (
          <div className="ml-3">
            {breadcrumb}
          </div>
        )}
      </div>

      <div></div>
    </header>
  );
}

// Main Content Container Component
function MainContentContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        height: 'calc(100vh - 4rem - 0.8em)',
        width: 'calc(100vw - 1rem)',
        maxWidth: 'calc(100% - 1rem)',
        marginLeft: '0.5rem',
        marginRight: '0.5rem',
        marginTop: '0.25rem',
        marginBottom: '0.75rem',
        background: 'var(--page-bg)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col h-full">
        {children}
      </div>
    </div>
  );
}

// Editable Title Component
function EditableTitle({
  value,
  onChange,
  className,
  style
}: {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== value) {
      const trimmedValue = editValue.trim();
      if (trimmedValue.length > 25) {
        alert('Folder name must be 25 characters or less.');
        setEditValue(value);
        setIsEditing(false);
        return;
      }
      onChange?.(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        maxLength={25}
        className={`${className} bg-transparent border-none outline-none`}
        style={style}
      />
    );
  }

  return (
    <h1
      className={`${className} cursor-text rounded px-1 py-0.5 transition-colors`}
      style={style}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value}
    </h1>
  );
}

// Page Header Component
function PageHeader({
  title,
  customTagContent,
  description,
  onDescriptionChange,
  showDescriptionField,
  onToggleDescription,
  showHamburgerButton,
  editableTitle,
  onTitleChange,
  header,
  rightHeader
}: {
  title?: string;
  customTagContent?: React.ReactNode;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  showDescriptionField?: boolean;
  onToggleDescription?: () => void;
  showHamburgerButton?: boolean;
  editableTitle?: boolean;
  onTitleChange?: (title: string) => void;
  header?: React.ReactNode;
  rightHeader?: React.ReactNode;
}) {
  return (
    <header className={`${HEADER_SPACING.container} backdrop-blur`} style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-start justify-between">
        {/* Left Side */}
        <div className="flex-1">
          {/* Title */}
          {title && (
            editableTitle ? (
              <EditableTitle
                value={title}
                onChange={onTitleChange}
                className={HEADER_SPACING.title}
                style={{ color: 'var(--foreground)' }}
              />
            ) : (
              <h1 className={HEADER_SPACING.title} style={{ color: 'var(--foreground)' }}>
                {title}
              </h1>
            )
          )}

          {/* Description Field - Below title, same alignment */}
          {showDescriptionField && (
            <div className="mb-3">
              <AutoSizingInput
                value={description || ''}
                onChange={(e) => onDescriptionChange?.(e.target.value)}
                placeholder="Add a description..."
                className="text-sm focus:outline-none bg-transparent"
                style={{
                  color: 'var(--foreground-muted)',
                  paddingBottom: '4px'
                }}
                autoFocus
              />
            </div>
          )}

          {/* Tag Content and Hamburger */}
          {customTagContent && (
            <div className={`flex items-center ${HEADER_SPACING.element} ${HEADER_SPACING.section}`}>
              {customTagContent}

              {/* Hamburger Button - only show if enabled */}
              {showHamburgerButton && (
                <button
                  onClick={onToggleDescription}
                  className={BUTTON_STYLES.hamburger}
                  style={{ color: BUTTON_STYLES.color }}
                  title="Add description"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Custom Header Content */}
          {header && (
            <div className={`flex items-center ${HEADER_SPACING.element}`}>
              {header}
            </div>
          )}
        </div>

        {/* Right Side */}
        {rightHeader && (
          <div className={`flex flex-col items-end ${HEADER_SPACING.rightSide}`}>
            <div className="flex items-center gap-2">
              {rightHeader}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Auto-sizing Input Component
function AutoSizingInput({
  value,
  onChange,
  placeholder,
  className,
  style,
  autoFocus
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className: string;
  style: React.CSSProperties;
  autoFocus?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [width, setWidth] = React.useState(200);

  React.useEffect(() => {
    if (inputRef.current) {
      // Create a temporary span to measure text width
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.style.fontSize = '14px'; // text-sm equivalent
      span.style.fontFamily = 'inherit';
      span.textContent = value || placeholder;

      document.body.appendChild(span);
      const textWidth = span.offsetWidth;
      document.body.removeChild(span);

      // Set width with some padding, minimum 200px
      setWidth(Math.max(textWidth + 20, 200));
    }
  }, [value, placeholder]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={{
        ...style,
        width: `${width}px`
      }}
      autoFocus={autoFocus}
    />
  );
}

// Reusable Navigation Button Component
function NavButton({
  onClick,
  title,
  children
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={BUTTON_STYLES.base}
      style={{ color: BUTTON_STYLES.color }}
      title={title}
    >
      {children}
    </button>
  );
}