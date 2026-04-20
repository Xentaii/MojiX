import type {
  EmojiLocaleCategoryLabels,
  EmojiLocaleDefinition,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const englishLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Search emoji, aliases, emoticons',
  noResultsTitle: 'Nothing found',
  noResultsBody: 'Try a shorter word, alias, or emoticon.',
  recents: 'Recent',
  custom: 'Custom',
  skinToneButton: 'Skin tone',
  clearSearch: 'Clear search',
};

export const englishCategories: EmojiLocaleCategoryLabels = {
  recent: 'Recent',
  smileys: 'Smileys',
  people: 'People',
  animals: 'Animals',
  food: 'Food',
  activities: 'Activities',
  travel: 'Travel',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
  custom: 'Custom',
};

export const englishSkinTones: Record<EmojiSkinTone, string> = {
  default: 'Default',
  light: 'Light',
  'medium-light': 'Medium light',
  medium: 'Medium',
  'medium-dark': 'Medium dark',
  dark: 'Dark',
};

export const englishLocale: EmojiLocaleDefinition = createChromeLocaleDefinition({
  code: 'en',
  labels: englishLabels,
  categories: englishCategories,
  skinTones: englishSkinTones,
});
