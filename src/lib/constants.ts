import emojiMeta from './generated/emoji-meta.json';
import type {
  EmojiCategoryId,
  EmojiCategoryMeta,
  EmojiPickerLabels,
  EmojiSpriteSheetCacheMode,
  EmojiSkinTone,
} from './types';

export const EMOJI_DATASET_VERSION = emojiMeta.version;
export const EMOJI_SHEET_GRID_SIZE = emojiMeta.gridSize;
export const EMOJI_SHEET_PADDING = 1;
export const DEFAULT_SPRITE_BASE_PATH = '/sprites';
export const DEFAULT_SPRITE_CACHE_MODE: EmojiSpriteSheetCacheMode = 'browser';
export const DEFAULT_SPRITE_CACHE_NAME = 'mojix:sprite-sheets';

export const DEFAULT_EMOJI_SIZE = 24;
export const DEFAULT_COLUMNS = 8;
export const DEFAULT_RECENT_LIMIT = 28;
export const DEFAULT_RECENT_STORAGE_KEY = 'mojix:recent';
export const DEFAULT_SKIN_TONE_STORAGE_KEY = 'mojix:skin-tone';

export const CATEGORY_ORDER: EmojiCategoryId[] = [
  'recent',
  'smileys',
  'people',
  'animals',
  'food',
  'activities',
  'travel',
  'objects',
  'symbols',
  'flags',
  'custom',
];

export const CATEGORY_META: Record<EmojiCategoryId, EmojiCategoryMeta> = {
  recent: { id: 'recent', label: 'Recent', icon: '\u{1F558}' },
  smileys: { id: 'smileys', label: 'Smileys', icon: '\u{1F642}' },
  people: { id: 'people', label: 'People', icon: '\u{1FAF6}' },
  animals: { id: 'animals', label: 'Animals', icon: '\u{1F98A}' },
  food: { id: 'food', label: 'Food', icon: '\u{1F35C}' },
  activities: { id: 'activities', label: 'Activities', icon: '\u26BD' },
  travel: { id: 'travel', label: 'Travel', icon: '\u2708\uFE0F' },
  objects: { id: 'objects', label: 'Objects', icon: '\u{1F4A1}' },
  symbols: { id: 'symbols', label: 'Symbols', icon: '\u{1F4AF}' },
  flags: { id: 'flags', label: 'Flags', icon: '\u{1F3F3}\uFE0F' },
  custom: { id: 'custom', label: 'Custom', icon: '\u2728' },
};

export const DEFAULT_LABELS: EmojiPickerLabels = {
  searchPlaceholder: 'Search emoji, aliases, emoticons',
  noResultsTitle: 'Nothing found',
  noResultsBody: 'Try a shorter word, alias, or emoticon.',
  recents: 'Recent',
  custom: 'Custom',
  skinToneButton: 'Skin tone',
  clearSearch: 'Clear search',
};

export const SKIN_TONE_OPTIONS: Array<{
  tone: EmojiSkinTone;
  icon: string;
  label: string;
}> = [
  { tone: 'default', icon: '\u{1F590}', label: 'Default' },
  { tone: 'light', icon: '\u{1F3FB}', label: 'Light' },
  { tone: 'medium-light', icon: '\u{1F3FC}', label: 'Medium light' },
  { tone: 'medium', icon: '\u{1F3FD}', label: 'Medium' },
  { tone: 'medium-dark', icon: '\u{1F3FE}', label: 'Medium dark' },
  { tone: 'dark', icon: '\u{1F3FF}', label: 'Dark' },
];
