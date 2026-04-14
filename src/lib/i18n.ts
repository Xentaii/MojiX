import generatedEmojiLocales from './generated/emoji-locales.json';
import type {
  EmojiCategoryId,
  EmojiLocaleCategoryLabels,
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

const englishCategories: EmojiLocaleCategoryLabels = {
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

const russianCategories: EmojiLocaleCategoryLabels = {
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

function createLocaleCandidates(locale?: EmojiLocaleCode) {
  if (!locale) {
    return [] as string[];
  }

  const lowerLocale = locale.toLowerCase();
  const baseLocale = lowerLocale.split('-')[0];

  return Array.from(
    new Set(
      [lowerLocale, baseLocale].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
}

function localeExists(
  locale: string,
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>,
) {
  return Boolean(locales?.[locale] || builtinLocales[locale]);
}

function normalizeFallbackLocales(
  fallbackLocale?: EmojiLocaleCode | EmojiLocaleCode[],
) {
  const localeList = Array.isArray(fallbackLocale)
    ? fallbackLocale
    : fallbackLocale
      ? [fallbackLocale]
      : [];

  return localeList.flatMap((locale) => createLocaleCandidates(locale));
}

function resolveRequestedLocale(
  requestedLocale?: EmojiLocaleCode,
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>,
  fallbackLocale?: EmojiLocaleCode | EmojiLocaleCode[],
) {
  for (const locale of [
    ...createLocaleCandidates(requestedLocale),
    ...normalizeFallbackLocales(fallbackLocale),
  ]) {
    if (localeExists(locale, locales)) {
      return locale;
    }
  }

  return 'en';
}

function resolveLocaleChain(
  resolvedLocale: string,
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>,
  fallbackLocale?: EmojiLocaleCode | EmojiLocaleCode[],
) {
  return Array.from(
    new Set([
      ...createLocaleCandidates(resolvedLocale),
      ...normalizeFallbackLocales(fallbackLocale),
      'en',
    ]),
  ).filter((locale) => locale === 'en' || localeExists(locale, locales));
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
  base: EmojiLocaleCategoryLabels,
  override?: Partial<Record<string, string>>,
) {
  return Object.fromEntries(
    Object.entries({
      ...base,
      ...override,
    }).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  ) as EmojiLocaleCategoryLabels;
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
  fallbackLocale?: EmojiLocaleCode | EmojiLocaleCode[],
) {
  const resolvedLocale = resolveRequestedLocale(
    locale,
    locales,
    fallbackLocale,
  );
  const localeChain = resolveLocaleChain(
    resolvedLocale,
    locales,
    fallbackLocale,
  );
  const nextDefinition = {
    ...fallbackLocaleDefinition,
    code: resolvedLocale,
    labels: { ...fallbackLocaleDefinition.labels },
    categories: { ...fallbackLocaleDefinition.categories },
    skinTones: { ...fallbackLocaleDefinition.skinTones },
    emoji: { ...fallbackLocaleDefinition.emoji },
  } satisfies EmojiLocaleDefinition;

  for (const localeCode of [...localeChain].reverse()) {
    const baseLocale =
      (builtinLocales[localeCode] as EmojiLocaleDefinition | undefined) ??
      fallbackLocaleDefinition;
    const override = locales?.[localeCode];

    nextDefinition.labels = mergeLabels(nextDefinition.labels, baseLocale.labels);
    nextDefinition.categories = mergeCategories(
      nextDefinition.categories,
      baseLocale.categories,
    );
    nextDefinition.skinTones = mergeSkinTones(
      nextDefinition.skinTones,
      baseLocale.skinTones,
    );
    nextDefinition.emoji = mergeEmojiTranslations(
      nextDefinition.emoji,
      baseLocale.emoji,
    );

    if (override) {
      nextDefinition.labels = mergeLabels(
        nextDefinition.labels,
        override.labels,
      );
      nextDefinition.categories = mergeCategories(
        nextDefinition.categories,
        override.categories,
      );
      nextDefinition.skinTones = mergeSkinTones(
        nextDefinition.skinTones,
        override.skinTones,
      );
      nextDefinition.emoji = mergeEmojiTranslations(
        nextDefinition.emoji,
        override.emoji,
      );
    }
  }

  return nextDefinition;
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
  fallbackLabel?: string,
) {
  return (
    localeDefinition.categories[categoryId] ??
    fallbackLabel ??
    fallbackLocaleDefinition.categories[categoryId] ??
    categoryId
  );
}

export function getLocalizedSkinToneLabel(
  skinTone: EmojiSkinTone,
  localeDefinition: EmojiLocaleDefinition,
) {
  return localeDefinition.skinTones[skinTone] ?? fallbackLocaleDefinition.skinTones[skinTone];
}

export const emojiPickerLocales = builtinLocales;
