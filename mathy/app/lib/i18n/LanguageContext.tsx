'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations } from './translations';
import type { 
  Language, 
  TranslationNamespace, 
  LanguageContextType, 
  LanguageProviderProps,
  TranslationFunction,
  NamespaceTranslationFunction
} from './types';

// Language detection utilities
const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check for Traditional Chinese variants
  if (browserLang.startsWith('zh-TW') || browserLang.startsWith('zh-HK') || browserLang.startsWith('zh-MO')) {
    return 'zh-TW';
  }
  
  // Check for Simplified Chinese (default to Traditional for now)
  if (browserLang.startsWith('zh')) {
    return 'zh-TW';
  }
  
  // Default to English for all other languages
  return 'en';
};

const getStoredLanguage = (): Language | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('mathy-language');
    if (stored && (stored === 'en' || stored === 'zh-TW')) {
      return stored as Language;
    }
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
  }
  
  return null;
};

const storeLanguage = (language: Language): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('mathy-language', language);
  } catch (error) {
    console.warn('Failed to store language in localStorage:', error);
  }
};

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export function LanguageProvider({ children, defaultLanguage }: LanguageProviderProps) {
  // Always start with default language to prevent hydration mismatch
  const [language, setLanguageState] = useState<Language>(defaultLanguage || 'en');
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag and detect language after hydration
  useEffect(() => {
    setIsClient(true);
    
    // Only detect and set language after client-side hydration
    const detectedLanguage = getStoredLanguage() || detectBrowserLanguage();
    if (detectedLanguage !== language) {
      setLanguageState(detectedLanguage);
    }
  }, []);

  // Update language and persist to localStorage
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    storeLanguage(newLanguage);
    
    // Update document language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage;
    }
  };

  // Translation function
  const t: TranslationFunction = <T extends TranslationNamespace>(
    namespace: T,
    key: keyof typeof translations[T][Language]
  ): string => {
    const translation = translations[namespace][language][key];
    return typeof translation === 'string' ? translation : String(translation);
  };

  // RTL detection (currently only supports LTR languages)
  const isRTL = false; // Could be extended for Arabic, Hebrew, etc.

  // Number formatting
  const formatNumber = (number: number): string => {
    if (!isClient) return number.toString();
    
    try {
      return new Intl.NumberFormat(language === 'zh-TW' ? 'zh-TW' : 'en-US').format(number);
    } catch (error) {
      return number.toString();
    }
  };

  // Date formatting
  const formatDate = (date: Date): string => {
    if (!isClient) return date.toLocaleDateString();
    
    try {
      return new Intl.DateTimeFormat(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  };

  // Relative time formatting
  const formatRelativeTime = (date: Date): string => {
    if (!isClient) return '';
    
    try {
      const rtf = new Intl.RelativeTimeFormat(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
        numeric: 'auto',
      });
      
      const now = new Date();
      const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
      
      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(diffInSeconds, 'second');
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
      } else {
        return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
      }
    } catch (error) {
      return '';
    }
  };

  // Update document language on language change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
    formatNumber,
    formatDate,
    formatRelativeTime,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
}

// Hook for translations (shorthand)
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}

// Hook for specific namespace translations
export function useNamespaceTranslation<T extends TranslationNamespace>(namespace: T) {
  const { t } = useLanguage();
  
  const namespaceT: NamespaceTranslationFunction<T> = (key: keyof typeof translations[T][Language]) => 
    t(namespace, key);
  
  return {
    t: namespaceT,
  };
}
