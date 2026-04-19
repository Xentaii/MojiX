import type {
  EmojiLocaleCategoryLabels,
  EmojiLocaleDefinition,
  EmojiLocaleEmojiTranslation,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const russianLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Найти эмодзи, алиас или смайлик',
  noResultsTitle: 'Ничего не найдено',
  noResultsBody: 'Попробуйте короче запрос, алиас или смайлик.',
  recents: 'Недавние',
  custom: 'Кастомные',
  skinToneButton: 'Оттенок кожи',
  clearSearch: 'Очистить поиск',
};

export const russianCategories: EmojiLocaleCategoryLabels = {
  recent: 'Недавние',
  smileys: 'Смайлы',
  people: 'Люди',
  animals: 'Животные',
  food: 'Еда',
  activities: 'Активности',
  travel: 'Путешествия',
  objects: 'Объекты',
  symbols: 'Символы',
  flags: 'Флаги',
  custom: 'Кастомные',
};

export const russianSkinTones: Record<EmojiSkinTone, string> = {
  default: 'По умолчанию',
  light: 'Светлый',
  'medium-light': 'Светло-средний',
  medium: 'Средний',
  'medium-dark': 'Темно-средний',
  dark: 'Темный',
};

// Emoji translations for 'ru' are shipped as a separate entry
// (`mojix-picker/locales/ru`) to keep the default bundle small.
// Register them at runtime via `registerEmojiLocalePack('ru', pack)`.
export const russianEmojiTranslations: Record<
  string,
  EmojiLocaleEmojiTranslation
> = {};

export const russianLocale: EmojiLocaleDefinition = {
  ...createChromeLocaleDefinition({
    code: 'ru',
    labels: russianLabels,
    categories: russianCategories,
    skinTones: russianSkinTones,
  }),
  emoji: russianEmojiTranslations,
};
