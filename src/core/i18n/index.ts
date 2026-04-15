import type {
  EmojiCategoryId,
  EmojiLocaleCategoryLabels,
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiLocaleEmojiTranslation,
  EmojiPickerLabels,
  EmojiRenderable,
  EmojiSkinTone,
} from '../types';
import {
  builtinLocales,
  fallbackLocaleDefinition,
} from './locales';

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

export function registerEmojiLocalePack(
  locale: EmojiLocaleCode,
  pack: Record<string, EmojiLocaleEmojiTranslation>,
) {
  const existing = builtinLocales[locale];
  if (!existing) {
    builtinLocales[locale] = {
      code: locale,
      labels: { ...fallbackLocaleDefinition.labels },
      categories: { ...fallbackLocaleDefinition.categories },
      skinTones: { ...fallbackLocaleDefinition.skinTones },
      emoji: { ...pack },
    };
    return;
  }

  for (const [id, translation] of Object.entries(pack)) {
    existing.emoji[id] = translation;
  }
}
