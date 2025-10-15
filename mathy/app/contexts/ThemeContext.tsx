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
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage and system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Simpler, faster transition for theme switching
    root.style.transition = 'background-color 0.15s ease, color 0.15s ease';
    
    if (theme === 'dark') {
      root.style.setProperty('--background', '#0f0f0f');
      root.style.setProperty('--foreground', '#ffffff');
      root.style.setProperty('--foreground-muted', '#999999');
      root.style.setProperty('--sidebar-bg', '#1a1a1a');
      root.style.setProperty('--card-bg', '#1f1f1f');
      root.style.setProperty('--border-color', '#333333');
      root.style.setProperty('--muted-text', '#a0a0a0');
      root.style.setProperty('--hover-bg', '#2a2a2a');
      root.style.setProperty('--active-bg', '#2d2d2d');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--input-bg', '#252525');
      root.style.setProperty('--input-border', '#4a4a4a');
      root.style.setProperty('--math-bg', '#2a2a2a');
      root.style.setProperty('--math-border', '#444444');
    } else {
      // Warm, cream-based light theme inspired by the reference
      root.style.setProperty('--background', '#f9f5f2'); // Very light warm cream
      root.style.setProperty('--foreground', '#333333'); // Dark grey for primary text
      root.style.setProperty('--foreground-muted', '#666666'); // Muted grey for secondary text
      root.style.setProperty('--sidebar-bg', '#f3ede9'); // Slightly darker warm beige
      root.style.setProperty('--card-bg', '#ffffff'); // Pure white for cards
      root.style.setProperty('--border-color', '#e0d0c0'); // Subtle warm border
      root.style.setProperty('--muted-text', '#6b7280'); // Standard muted text
      root.style.setProperty('--hover-bg', '#f0e0e0'); // Light pinkish hover
      root.style.setProperty('--active-bg', '#e0a0a0'); // Muted pink for active elements
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.08)'); // Subtle shadow
      root.style.setProperty('--input-bg', '#ffffff'); // White inputs
      root.style.setProperty('--input-border', '#d1d5db'); // Standard input border
      root.style.setProperty('--math-bg', '#f5f5f5'); // Light grey for content snippets
      root.style.setProperty('--math-border', '#e0d0c0'); // Warm math border
    }

    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

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

