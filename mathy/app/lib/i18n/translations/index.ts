import { common } from './common';
import { navigation } from './navigation';
import { marketing } from './marketing';
import { auth } from './auth';
import { math } from './math';

export const translations = {
  common,
  navigation,
  marketing,
  auth,
  math,
} as const;

export type TranslationNamespace = keyof typeof translations;
export type Language = keyof typeof translations.common;
export type TranslationKeys<T extends TranslationNamespace> = keyof typeof translations[T][Language];
