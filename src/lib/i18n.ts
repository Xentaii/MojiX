import generatedEmojiLocales from './generated/emoji-locales.json';
import type {
  EmojiCategoryId,
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiLocaleEmojiTranslation,
  EmojiPickerLabels,
  EmojiRenderable,
  EmojiSkinTone,
} from './types';

const generatedLocaleMap =
  generatedEmojiLocales as Record<string, Record<string, EmojiLocaleEmojiTranslation>>;

const englishLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Search emoji, aliases, emoticons',
  noResultsTitle: 'Nothing found',
  noResultsBody: 'Try a shorter word, alias, or emoticon.',
  recents: 'Recent',
  custom: 'Custom',
  skinToneButton: 'Skin tone',
  clearSearch: 'Clear search',
};

const englishCategories: Record<EmojiCategoryId, string> = {
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

const englishSkinTones: Record<EmojiSkinTone, string> = {
  default: 'Default',
  light: 'Light',
  'medium-light': 'Medium light',
  medium: 'Medium',
  'medium-dark': 'Medium dark',
  dark: 'Dark',
};

const russianLabels: EmojiPickerLabels = {
  searchPlaceholder: 'Найти эмодзи, алиас или смайлик',
  noResultsTitle: 'Ничего не найдено',
  noResultsBody: 'Попробуйте короче запрос, алиас или смайлик.',
  recents: 'Недавние',
  custom: 'Кастомные',
  skinToneButton: 'Оттенок кожи',
  clearSearch: 'Очистить поиск',
};

const russianCategories: Record<EmojiCategoryId, string> = {
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

const russianSkinTones: Record<EmojiSkinTone, string> = {
  default: 'По умолчанию',
  light: 'Светлый',
  'medium-light': 'Светло-средний',
  medium: 'Средний',
  'medium-dark': 'Темно-средний',
  dark: 'Темный',
};

const builtinLocales: Record<string, EmojiLocaleDefinition> = {
  en: {
    code: 'en',
    labels: englishLabels,
    categories: englishCategories,
    skinTones: englishSkinTones,
    emoji: generatedLocaleMap.en ?? {},
  },
  ru: {
    code: 'ru',
    labels: russianLabels,
    categories: russianCategories,
    skinTones: russianSkinTones,
    emoji: generatedLocaleMap.ru ?? {},
  },
};

const fallbackLocaleDefinition = builtinLocales.en as EmojiLocaleDefinition;

function resolveRequestedLocale(
  requestedLocale?: EmojiLocaleCode,
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>,
) {
  const fallback = 'en';

  if (!requestedLocale) {
    return fallback;
  }

  const lowerLocale = requestedLocale.toLowerCase();
  const baseLocale = lowerLocale.split('-')[0];

  if (locales?.[lowerLocale] || builtinLocales[lowerLocale]) {
    return lowerLocale;
  }

  if (baseLocale && (locales?.[baseLocale] || builtinLocales[baseLocale])) {
    return baseLocale;
  }

  return fallback;
}

function mergeLabels(
  base: EmojiPickerLabels,
  override?: Partial<EmojiPickerLabels>,
) {
  return {
    ...base,
    ...override,
  };
}

function mergeCategories(
  base: Record<EmojiCategoryId, string>,
  override?: Partial<Record<EmojiCategoryId, string>>,
) {
  return {
    ...base,
    ...override,
  };
}

function mergeSkinTones(
  base: Record<EmojiSkinTone, string>,
  override?: Partial<Record<EmojiSkinTone, string>>,
) {
  return {
    ...base,
    ...override,
  };
}

function mergeEmojiTranslations(
  base: Record<string, EmojiLocaleEmojiTranslation>,
  override?: Record<string, EmojiLocaleEmojiTranslation>,
) {
  return {
    ...base,
    ...override,
  };
}

export function resolveLocaleDefinition(
  locale?: EmojiLocaleCode,
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>,
) {
  const resolvedLocale = resolveRequestedLocale(locale, locales);
  const baseLocale =
    (builtinLocales[resolvedLocale] as EmojiLocaleDefinition | undefined) ??
    fallbackLocaleDefinition;
  const override = locales?.[resolvedLocale];

  return {
    code: resolvedLocale,
    labels: mergeLabels(baseLocale.labels, override?.labels),
    categories: mergeCategories(baseLocale.categories, override?.categories),
    skinTones: mergeSkinTones(baseLocale.skinTones, override?.skinTones),
    emoji: mergeEmojiTranslations(baseLocale.emoji, override?.emoji),
  } satisfies EmojiLocaleDefinition;
}

export function getLocalizedEmojiTranslation(
  emojiId: string,
  localeDefinition: EmojiLocaleDefinition,
) {
  return (
    localeDefinition.emoji[emojiId] ??
    fallbackLocaleDefinition.emoji[emojiId] ?? {
      name: '',
      keywords: [],
    }
  );
}

export function getLocalizedEmojiName(
  emoji: EmojiRenderable,
  localeDefinition: EmojiLocaleDefinition,
) {
  if (emoji.kind === 'custom') {
    return emoji.name;
  }

  const translation = getLocalizedEmojiTranslation(emoji.id, localeDefinition);
  return translation.name || emoji.name;
}

export function getLocalizedEmojiKeywords(
  emoji: EmojiRenderable,
  localeDefinition: EmojiLocaleDefinition,
) {
  if (emoji.kind === 'custom') {
    return [];
  }

  return getLocalizedEmojiTranslation(emoji.id, localeDefinition).keywords;
}

export function getLocalizedCategoryLabel(
  categoryId: EmojiCategoryId,
  localeDefinition: EmojiLocaleDefinition,
) {
  return localeDefinition.categories[categoryId] ?? fallbackLocaleDefinition.categories[categoryId];
}

export function getLocalizedSkinToneLabel(
  skinTone: EmojiSkinTone,
  localeDefinition: EmojiLocaleDefinition,
) {
  return localeDefinition.skinTones[skinTone] ?? fallbackLocaleDefinition.skinTones[skinTone];
}

export const emojiPickerLocales = builtinLocales;
