import generatedEnglishEmoji from '../../generated/emoji-locale.en.json';
import type {
  EmojiLocaleCategoryLabels,
  EmojiLocaleDefinition,
  EmojiLocaleEmojiTranslation,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';

const englishEmojiTranslations = generatedEnglishEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

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

export const englishLocale: EmojiLocaleDefinition = {
  code: 'en',
  labels: englishLabels,
  categories: englishCategories,
  skinTones: englishSkinTones,
  emoji: englishEmojiTranslations,
};
