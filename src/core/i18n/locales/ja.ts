import type {
  EmojiLocaleCategoryLabels,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const japaneseLabels: EmojiPickerLabels = {
  searchPlaceholder: '絵文字、エイリアス、顔文字を検索',
  noResultsTitle: '見つかりませんでした',
  noResultsBody:
    'もっと短い単語、エイリアス、または顔文字で試してください。',
  recents: '最近使ったもの',
  custom: 'カスタム',
  skinToneButton: '肌の色',
  clearSearch: '検索をクリア',
};

export const japaneseCategories: EmojiLocaleCategoryLabels = {
  recent: '最近使ったもの',
  smileys: 'スマイリー',
  people: '人',
  animals: '動物',
  food: '食べ物',
  activities: 'アクティビティ',
  travel: '旅行',
  objects: 'オブジェクト',
  symbols: '記号',
  flags: '旗',
  custom: 'カスタム',
};

export const japaneseSkinTones: Record<EmojiSkinTone, string> = {
  default: 'デフォルト',
  light: '明るい',
  'medium-light': 'やや明るい',
  medium: '中間',
  'medium-dark': 'やや暗い',
  dark: '暗い',
};

export const japaneseLocale = createChromeLocaleDefinition({
  code: 'ja',
  labels: japaneseLabels,
  categories: japaneseCategories,
  skinTones: japaneseSkinTones,
});
