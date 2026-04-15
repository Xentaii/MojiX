import type { EmojiLocaleDefinition } from '../../types';
import { englishLocale } from './en';
import { russianLocale } from './ru';

export { englishLocale } from './en';
export { russianLocale } from './ru';

export const builtinLocales: Record<string, EmojiLocaleDefinition> = {
  en: englishLocale,
  ru: russianLocale,
};

export const fallbackLocaleDefinition: EmojiLocaleDefinition = englishLocale;
