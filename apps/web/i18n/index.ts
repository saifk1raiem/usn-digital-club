import { ar } from './ar'; import { fr } from './fr';
export type WebLocale = 'ar' | 'fr';
export function isLocale(value: string): value is WebLocale { return value === 'ar' || value === 'fr'; }
export function getMessages(locale: WebLocale) { return locale === 'fr' ? fr : ar; }
