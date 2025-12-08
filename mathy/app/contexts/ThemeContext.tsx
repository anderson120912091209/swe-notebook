'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first, otherwise default to dark theme
    // This ensures user preferences are restored on subsequent visits
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Default to dark theme regardless of system preference
      setThemeState('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    // Batch all CSS variable updates in a single frame to prevent layout thrashing
    // Use requestAnimationFrame to ensure smooth updates
    requestAnimationFrame(() => {
      // Temporarily disable transitions during bulk update for instant change
      const originalRootTransition = root.style.transition;
      const originalBodyTransition = body.style.transition;

      root.style.transition = 'none';
      body.style.transition = 'none';

      if (theme === 'dark') {
        root.style.setProperty('--background', '#0b0b0bff');
        root.style.setProperty('--foreground', '#ffffff');
        root.style.setProperty('--foreground-muted', '#999999');
        root.style.setProperty('--sidebar-bg', '#1a1a1a');
        root.style.setProperty('--card-bg', '#1f1f1f');
        root.style.setProperty('--card-preview-bg', '#191919ff');
        root.style.setProperty('--border-color', '#282828ff');
        root.style.setProperty('--muted-text', '#a0a0a0');
        root.style.setProperty('--hover-bg', '#2a2a2a');
        root.style.setProperty('--active-bg', '#2d2d2d');
        root.style.setProperty('--active-bg', '#2d2d2d');
        root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--card-shadow', '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)');
        root.style.setProperty('--input-bg', '#252525');
        root.style.setProperty('--input-border', '#4a4a4a');
        root.style.setProperty('--math-bg', '#2a2a2a');
        root.style.setProperty('--math-border', '#444444');
        root.style.setProperty('--outer-bg', '#111111ff');
        root.style.setProperty('--page-bg', '#171717'); // Dark grey for page containers
      } else {
        // Warm, cream-based light theme inspired by the reference
        root.style.setProperty('--background', '#f9f5f2'); // Very light warm cream
        root.style.setProperty('--foreground', '#333333'); // Dark grey for primary text
        root.style.setProperty('--foreground-muted', '#666666'); // Muted grey for secondary text
        root.style.setProperty('--sidebar-bg', '#f3ede9'); // Slightly darker warm beige
        root.style.setProperty('--card-bg', '#ffffff'); // Pure white for cards
        root.style.setProperty('--card-preview-bg', '#f5f5f5'); // Slightly darker for preview areas
        root.style.setProperty('--border-color', '#e0d0c0'); // Subtle warm border
        root.style.setProperty('--muted-text', '#6b7280'); // Standard muted text
        root.style.setProperty('--hover-bg', '#f0e0e0'); // Light pinkish hover
        root.style.setProperty('--active-bg', '#e0a0a0'); // Muted pink for active elements
        root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.08)'); // Subtle shadow
        root.style.setProperty('--card-shadow', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'); // Lighter, softer shadow for light mode
        root.style.setProperty('--input-bg', '#ffffff'); // White inputs
        root.style.setProperty('--input-border', '#d1d5db'); // Standard input border
        root.style.setProperty('--math-bg', '#f5f5f5'); // Light grey for content snippets
        root.style.setProperty('--math-border', '#e0d0c0'); // Warm math border
        root.style.setProperty('--outer-bg', '#f0ebe7'); // Slightly darker warm background
        root.style.setProperty('--page-bg', '#f3ede9'); // Match sidebar background for seamless warm look
      }

      // Also update body background to ensure it matches
      body.style.backgroundColor = root.style.getPropertyValue('--background');

      // Re-enable transitions after a microtask to allow smooth animation
      requestAnimationFrame(() => {
        root.style.transition = originalRootTransition || 'background-color 0.15s ease, color 0.15s ease';
        body.style.transition = originalBodyTransition || 'background-color 0.15s ease, color 0.15s ease';
      });
    });

    // Save theme preference to localStorage whenever it changes
    // This ensures user preferences persist across sessions:
    // - First visit: defaults to dark, saves 'dark'
    // - User changes to light: saves 'light'
    // - Next visit: loads 'light' from localStorage and applies it
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Always provide the context, even before mounting
  // This prevents "useTheme must be used within a ThemeProvider" errors
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

