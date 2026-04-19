import type {
  EmojiLocaleCategoryLabels,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const frenchLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Rechercher un emoji, un alias ou une émoticône',
  noResultsTitle: 'Aucun résultat',
  noResultsBody:
    'Essaie un terme, un alias ou une émoticône plus court.',
  recents: 'Récents',
  custom: 'Personnalisés',
  skinToneButton: 'Teinte de peau',
  clearSearch: 'Effacer la recherche',
};

export const frenchCategories: EmojiLocaleCategoryLabels = {
  recent: 'Récents',
  smileys: 'Smileys',
  people: 'Personnes',
  animals: 'Animaux',
  food: 'Nourriture',
  activities: 'Activités',
  travel: 'Voyages',
  objects: 'Objets',
  symbols: 'Symboles',
  flags: 'Drapeaux',
  custom: 'Personnalisés',
};

export const frenchSkinTones: Record<EmojiSkinTone, string> = {
  default: 'Par défaut',
  light: 'Clair',
  'medium-light': 'Moyen clair',
  medium: 'Moyen',
  'medium-dark': 'Moyen foncé',
  dark: 'Foncé',
};

export const frenchLocale = createChromeLocaleDefinition({
  code: 'fr',
  labels: frenchLabels,
  categories: frenchCategories,
  skinTones: frenchSkinTones,
});
