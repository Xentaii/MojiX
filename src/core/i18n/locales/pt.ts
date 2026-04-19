import type {
  EmojiLocaleCategoryLabels,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const portugueseLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Pesquisar emoji, alias ou emoticons',
  noResultsTitle: 'Nada encontrado',
  noResultsBody:
    'Tente uma palavra, um alias ou um emoticon mais curto.',
  recents: 'Recentes',
  custom: 'Personalizados',
  skinToneButton: 'Tom de pele',
  clearSearch: 'Limpar pesquisa',
};

export const portugueseCategories: EmojiLocaleCategoryLabels = {
  recent: 'Recentes',
  smileys: 'Smileys',
  people: 'Pessoas',
  animals: 'Animais',
  food: 'Comida',
  activities: 'Atividades',
  travel: 'Viagens',
  objects: 'Objetos',
  symbols: 'Símbolos',
  flags: 'Bandeiras',
  custom: 'Personalizados',
};

export const portugueseSkinTones: Record<EmojiSkinTone, string> = {
  default: 'Padrão',
  light: 'Claro',
  'medium-light': 'Médio-claro',
  medium: 'Médio',
  'medium-dark': 'Médio-escuro',
  dark: 'Escuro',
};

export const portugueseLocale = createChromeLocaleDefinition({
  code: 'pt',
  labels: portugueseLabels,
  categories: portugueseCategories,
  skinTones: portugueseSkinTones,
});
