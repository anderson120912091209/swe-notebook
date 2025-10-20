'use client';

import React, { useState, useCallback } from 'react';

interface SearchAndNewButtonsProps {
  onNewClick: () => void;
  newButtonText: string;
  newButtonDisabled?: boolean;
  newButtonLoading?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export default function SearchAndNewButtons({
  onNewClick,
  newButtonText,
  newButtonDisabled = false,
  newButtonLoading = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  searchQuery: externalSearchQuery
}: SearchAndNewButtonsProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

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
        onHover={() => cursor = 'pointer'}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--hover-bg)] transition-colors"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search</span>
      </button>

      {/* New Button - Split Design */}
      <div className="flex items-center rounded-md" style={{ border: '1px solid var(--border-color)' }}>
        <button
          onClick={onNewClick}
          disabled={newButtonDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-l-md hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span>{newButtonText}</span>
        </button>
        
        <div className="w-px" style={{ background: 'var(--border-color)' }} />
        
        <button
          disabled={newButtonDisabled}
          className="px-2 py-1.5 text-sm hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
