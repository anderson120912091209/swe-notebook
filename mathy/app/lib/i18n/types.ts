import { translations } from './translations';

// Extract types from the translations object
export type Language = keyof typeof translations.common;
export type TranslationNamespace = keyof typeof translations;

// Type for translation keys in a specific namespace
export type TranslationKeys<T extends TranslationNamespace> = keyof typeof translations[T][Language];

// Type for getting a specific translation value
export type TranslationValue<T extends TranslationNamespace, K extends TranslationKeys<T>> = 
  typeof translations[T][Language][K];

// Utility type for all possible translation paths
export type TranslationPath = {
  [N in TranslationNamespace]: {
    [K in TranslationKeys<N>]: `${N}.${string & K}`;
  }[TranslationKeys<N>];
}[TranslationNamespace];

// Type for the translation function parameters
export interface TranslationFunction {
  <T extends TranslationNamespace>(
    namespace: T,
    key: TranslationKeys<T>
  ): string;
}

// Type for namespace-specific translation functions
export interface NamespaceTranslationFunction<T extends TranslationNamespace> {
  (key: TranslationKeys<T>): string;
}

// Type for the language context
export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationFunction;
  isRTL: boolean;
  formatNumber: (number: number) => string;
  formatDate: (date: Date) => string;
  formatRelativeTime: (date: Date) => string;
}

// Type for language options
export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
  nativeName: string;
}

// Type for translation validation
export type TranslationValidation = {
  [N in TranslationNamespace]: {
    [K in TranslationKeys<N>]: {
      namespace: N;
      key: K;
      value: TranslationValue<N, K>;
    };
  };
};

// Helper type to check if all translation keys are present
export type ValidateTranslations<T extends TranslationNamespace> = {
  [K in TranslationKeys<T>]: TranslationValue<T, K> extends string ? true : never;
};

// Type for missing translations detection
export type MissingTranslations = {
  [N in TranslationNamespace]: {
    [K in TranslationKeys<N>]: TranslationValue<N, K> extends string 
      ? never 
      : `${N}.${string & K}`;
  }[TranslationKeys<N>];
}[TranslationNamespace];

// Type for translation metadata
export interface TranslationMetadata {
  lastUpdated: string;
  version: string;
  contributors: string[];
  languages: Language[];
}

// Type for translation statistics
export interface TranslationStats {
  totalKeys: number;
  translatedKeys: Record<Language, number>;
  missingKeys: Record<Language, string[]>;
  completionPercentage: Record<Language, number>;
}

// Type for translation import/export
export interface TranslationExport {
  metadata: TranslationMetadata;
  translations: typeof translations;
  stats: TranslationStats;
}

// Type for translation validation results
export interface TranslationValidationResult {
  isValid: boolean;
  errors: Array<{
    namespace: TranslationNamespace;
    key: string;
    language: Language;
    message: string;
  }>;
  warnings: Array<{
    namespace: TranslationNamespace;
    key: string;
    language: Language;
    message: string;
  }>;
}

// Type for translation search results
export interface TranslationSearchResult {
  namespace: TranslationNamespace;
  key: string;
  value: string;
  language: Language;
  path: string;
}

// Type for translation batch operations
export interface TranslationBatch {
  namespace: TranslationNamespace;
  updates: Array<{
    key: string;
    value: string;
    language: Language;
  }>;
}

// Type for translation hooks
export interface UseTranslationReturn {
  t: TranslationFunction;
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  formatNumber: (number: number) => string;
  formatDate: (date: Date) => string;
  formatRelativeTime: (date: Date) => string;
}

export interface UseNamespaceTranslationReturn<T extends TranslationNamespace> {
  t: NamespaceTranslationFunction<T>;
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  formatNumber: (number: number) => string;
  formatDate: (date: Date) => string;
  formatRelativeTime: (date: Date) => string;
}

// Type for translation component props
export interface TranslationComponentProps {
  namespace: TranslationNamespace;
  key: string;
  fallback?: string;
  values?: Record<string, string | number>;
}

// Type for translation provider props
export interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
  fallbackLanguage?: Language;
  enableBrowserDetection?: boolean;
  enableLocalStorage?: boolean;
  storageKey?: string;
}

// Type for language switcher props
export interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'minimal';
  showFlags?: boolean;
  showNativeNames?: boolean;
  showEnglishNames?: boolean;
  className?: string;
  onLanguageChange?: (language: Language) => void;
}

// Type for translation utilities
export interface TranslationUtils {
  validateTranslations: () => TranslationValidationResult;
  getMissingTranslations: () => MissingTranslations[];
  getTranslationStats: () => TranslationStats;
  searchTranslations: (query: string) => TranslationSearchResult[];
  exportTranslations: () => TranslationExport;
  importTranslations: (data: TranslationExport) => boolean;
}

// Type for translation middleware
export interface TranslationMiddleware {
  beforeTranslate?: (namespace: TranslationNamespace, key: string, language: Language) => string | null;
  afterTranslate?: (namespace: TranslationNamespace, key: string, language: Language, result: string) => string;
  onError?: (error: Error, namespace: TranslationNamespace, key: string, language: Language) => void;
}

// Type for translation configuration
export interface TranslationConfig {
  defaultLanguage: Language;
  fallbackLanguage: Language;
  enableBrowserDetection: boolean;
  enableLocalStorage: boolean;
  storageKey: string;
  middleware: TranslationMiddleware[];
  validation: {
    enabled: boolean;
    strict: boolean;
    logErrors: boolean;
  };
  formatting: {
    numberFormat: Intl.NumberFormatOptions;
    dateFormat: Intl.DateTimeFormatOptions;
    relativeTimeFormat: Intl.RelativeTimeFormatOptions;
  };
}

// Re-export commonly used types
export type {
  Language,
  TranslationNamespace,
  TranslationKeys,
  TranslationValue,
  TranslationFunction,
  NamespaceTranslationFunction,
  LanguageContextType,
  LanguageOption,
  UseTranslationReturn,
  UseNamespaceTranslationReturn,
  LanguageProviderProps,
  LanguageSwitcherProps,
  TranslationConfig,
};
