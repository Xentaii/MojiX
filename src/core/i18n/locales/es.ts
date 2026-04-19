import type {
  EmojiLocaleCategoryLabels,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';
import { createChromeLocaleDefinition } from './createChromeLocale';

export const spanishLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Buscar emoji, alias o emoticonos',
  noResultsTitle: 'No se encontró nada',
  noResultsBody:
    'Prueba una palabra, un alias o un emoticono más corto.',
  recents: 'Recientes',
  custom: 'Personalizados',
  skinToneButton: 'Tono de piel',
  clearSearch: 'Borrar búsqueda',
};

export const spanishCategories: EmojiLocaleCategoryLabels = {
  recent: 'Recientes',
  smileys: 'Caritas',
  people: 'Personas',
  animals: 'Animales',
  food: 'Comida',
  activities: 'Actividades',
  travel: 'Viajes',
  objects: 'Objetos',
  symbols: 'Símbolos',
  flags: 'Banderas',
  custom: 'Personalizados',
};

export const spanishSkinTones: Record<EmojiSkinTone, string> = {
  default: 'Predeterminado',
  light: 'Claro',
  'medium-light': 'Medio claro',
  medium: 'Medio',
  'medium-dark': 'Medio oscuro',
  dark: 'Oscuro',
};

export const spanishLocale = createChromeLocaleDefinition({
  code: 'es',
  labels: spanishLabels,
  categories: spanishCategories,
  skinTones: spanishSkinTones,
});
