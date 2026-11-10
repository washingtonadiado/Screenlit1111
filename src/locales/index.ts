/**
 * Screenlit Localization Registry
 * Supports English, Arabic with RTL, and Swahili
 * Marks Arabic and Swahili as requiring native clinical review
 */

import en from './en.json';
import ar from './ar.json';
import sw from './sw.json';
import { SupportedLanguage } from '@shared/types';

export const LOCALES: Record<SupportedLanguage, typeof en> = {
  en,
  ar,
  sw,
};

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  reviewNotice?: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    reviewNotice: 'Arabic translation requires native clinical review',
  },
  {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    dir: 'ltr',
    reviewNotice: 'Swahili translation requires native clinical review',
  },
];

export function getDictionary(lang: SupportedLanguage): typeof en {
  return LOCALES[lang] || LOCALES.en;
}

export function isRtl(lang: SupportedLanguage): boolean {
  return lang === 'ar';
}

export function getReviewNotice(lang: SupportedLanguage): string | undefined {
  const opt = LANGUAGE_OPTIONS.find((l) => l.code === lang);
  return opt?.reviewNotice;
}
