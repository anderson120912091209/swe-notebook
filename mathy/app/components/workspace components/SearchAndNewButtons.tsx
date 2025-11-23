'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SearchAndNewButtonsProps {
  onNewClick: () => void;
  onNewFolder?: () => void;
  onNewPage?: () => void;
  onNewCanvas?: () => void;
  newButtonDisabled?: boolean;
  newButtonLoading?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export default function SearchAndNewButtons({
  onNewClick,
  onNewFolder,
  onNewPage,
  onNewCanvas,
  newButtonDisabled = false,
  newButtonLoading = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  searchQuery: externalSearchQuery
}: SearchAndNewButtonsProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use external search query if provided, otherwise use local state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = onSearchChange || setLocalSearchQuery;

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the parent component through onSearchChange
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleSearchBlur = useCallback(() => {
    if (!searchQuery.trim()) {
      setIsSearchActive(false);
    }
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = useCallback(() => {
    setShowDropdown(!showDropdown);
  }, [showDropdown]);

  const handleNewItem = useCallback((type: 'folder' | 'page' | 'canvas') => {
    setShowDropdown(false);
    switch (type) {
      case 'folder':
        onNewFolder?.();
        break;
      case 'page':
        onNewPage?.();
        break;
      case 'canvas':
        onNewCanvas?.();
        break;
      default:
        onNewClick();
    }
  }, [onNewFolder, onNewPage, onNewCanvas, onNewClick]);

  if (isSearchActive) {
    return (
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-1.5 text-sm rounded-md border-none outline-none bg-transparent"
            style={{ 
              color: 'var(--foreground)', 
              background: 'var(--input-bg)', 
              border: '1px solid var(--border-color)' 
            }}
            autoFocus
          />
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Search Button */}
      <button
        onClick={() => setIsSearchActive(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search</span>
      </button>

      {/* New Button with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center rounded-xl" style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <button
            onClick={onNewClick}
            disabled={newButtonDisabled}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-l-xl hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ 
              color: 'var(--foreground)',
              background: newButtonLoading ? 'var(--hover-bg)' : 'transparent'
            }}
          >
            {newButtonLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span>New</span>
          </button>
          
          <div className="w-px" style={{ background: 'var(--border-color)' }} />
          
          <button
            onClick={handleDropdownToggle}
            disabled={newButtonDisabled}
            className="px-3 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-xl cursor-pointer"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <svg className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div 
            className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-lg border z-50"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="py-1">
              <button
                onClick={() => handleNewItem('folder')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-3 cursor-pointer"
                style={{ color: 'var(--foreground)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>Folder</span>
              </button>
              <button
                onClick={() => handleNewItem('page')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-3 cursor-pointer"
                style={{ color: 'var(--foreground)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Page</span>
              </button>
              <button
                onClick={() => handleNewItem('canvas')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-3 cursor-pointer"
                style={{ color: 'var(--foreground)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Canvas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
