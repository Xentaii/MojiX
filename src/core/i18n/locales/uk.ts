import type {
  EmojiLocaleCategoryLabels,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const ukrainianLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Шукати емодзі, аліаси чи смайлики',
  noResultsTitle: 'Нічого не знайдено',
  noResultsBody: 'Спробуйте коротше слово, аліас або смайлик.',
  recents: 'Нещодавні',
  custom: 'Користувацькі',
  skinToneButton: 'Тон шкіри',
  clearSearch: 'Очистити пошук',
};

export const ukrainianCategories: EmojiLocaleCategoryLabels = {
  recent: 'Нещодавні',
  smileys: 'Смайли',
  people: 'Люди',
  animals: 'Тварини',
  food: 'Їжа',
  activities: 'Активності',
  travel: 'Подорожі',
  objects: 'Обʼєкти',
  symbols: 'Символи',
  flags: 'Прапори',
  custom: 'Користувацькі',
};

export const ukrainianSkinTones: Record<EmojiSkinTone, string> = {
  default: 'За замовчуванням',
  light: 'Світлий',
  'medium-light': 'Світло-середній',
  medium: 'Середній',
  'medium-dark': 'Темно-середній',
  dark: 'Темний',
};

export const ukrainianLocale = createChromeLocaleDefinition({
  code: 'uk',
  labels: ukrainianLabels,
  categories: ukrainianCategories,
  skinTones: ukrainianSkinTones,
});
