import type {
  EmojiLocaleCategoryLabels,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const germanLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Emoji, Aliase oder Emoticons suchen',
  noResultsTitle: 'Nichts gefunden',
  noResultsBody:
    'Versuche ein kürzeres Wort, einen Alias oder ein Emoticon.',
  recents: 'Zuletzt verwendet',
  custom: 'Eigene',
  skinToneButton: 'Hautfarbe',
  clearSearch: 'Suche löschen',
};

export const germanCategories: EmojiLocaleCategoryLabels = {
  recent: 'Zuletzt verwendet',
  smileys: 'Smileys',
  people: 'Personen',
  animals: 'Tiere',
  food: 'Essen',
  activities: 'Aktivitäten',
  travel: 'Reisen',
  objects: 'Objekte',
  symbols: 'Symbole',
  flags: 'Flaggen',
  custom: 'Eigene',
};

export const germanSkinTones: Record<EmojiSkinTone, string> = {
  default: 'Standard',
  light: 'Hell',
  'medium-light': 'Mittelhell',
  medium: 'Mittel',
  'medium-dark': 'Mitteldunkel',
  dark: 'Dunkel',
};

export const germanLocale = createChromeLocaleDefinition({
  code: 'de',
  labels: germanLabels,
  categories: germanCategories,
  skinTones: germanSkinTones,
});
