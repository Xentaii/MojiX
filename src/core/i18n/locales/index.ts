import type { EmojiLocaleDefinition } from '../../types';
import { germanLocale } from './de';
import { englishLocale } from './en';
import { spanishLocale } from './es';
import { frenchLocale } from './fr';
import { japaneseLocale } from './ja';
import { portugueseLocale } from './pt';
import { russianLocale } from './ru';
import { ukrainianLocale } from './uk';

export { germanLocale } from './de';
export { englishLocale } from './en';
export { spanishLocale } from './es';
export { frenchLocale } from './fr';
export { japaneseLocale } from './ja';
export { portugueseLocale } from './pt';
export { russianLocale } from './ru';
export { ukrainianLocale } from './uk';

export const builtinLocales: Record<string, EmojiLocaleDefinition> = {
  de: germanLocale,
  en: englishLocale,
  es: spanishLocale,
  fr: frenchLocale,
  ja: japaneseLocale,
  pt: portugueseLocale,
  ru: russianLocale,
  uk: ukrainianLocale,
};

export const fallbackLocaleDefinition: EmojiLocaleDefinition = englishLocale;
