import { DEFAULT_LABELS } from '../constants';
import { loadEmojiLocalePackFromCdn } from '../data-source';
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
import { getBuiltinLocaleDefinition } from './locales';

const localeRegistryListeners = new Set<() => void>();
const registeredLocaleDefinitions = new Map<string, EmojiLocaleDefinition>();
const pendingLocaleLoads = new Map<string, Promise<EmojiLocaleDefinition>>();
let localeRegistryVersion = 0;

export const fallbackLocaleDefinition: EmojiLocaleDefinition = {
  code: 'en',
  labels: { ...DEFAULT_LABELS },
  categories: {
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
  },
  skinTones: {
    default: 'Default',
    light: 'Light',
    'medium-light': 'Medium light',
    medium: 'Medium',
    'medium-dark': 'Medium dark',
    dark: 'Dark',
  },
  emoji: {},
};

export const emojiPickerLocales: Partial<
  Record<string, EmojiLocaleDefinition>
> = {};

function emitLocaleRegistryChange() {
  localeRegistryVersion += 1;

  for (const listener of localeRegistryListeners) {
    listener();
  }
}

function cloneLocaleDefinition(
  locale: Partial<EmojiLocaleDefinition> & {
    code: EmojiLocaleCode;
  },
): EmojiLocaleDefinition {
  return {
    code: locale.code,
    labels: {
      ...fallbackLocaleDefinition.labels,
      ...(locale.labels ?? {}),
    },
    categories: {
      ...fallbackLocaleDefinition.categories,
      ...(locale.categories ?? {}),
    },
    skinTones: {
      ...fallbackLocaleDefinition.skinTones,
      ...(locale.skinTones ?? {}),
    },
    emoji: {
      ...(locale.emoji ?? {}),
    },
  };
}

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

function getRegisteredLocaleDefinition(locale: string) {
  return registeredLocaleDefinitions.get(locale);
}

function getLocaleDefinition(locale: string) {
  return (
    getRegisteredLocaleDefinition(locale) ??
    getBuiltinLocaleDefinition(locale)
  );
}

function localeExists(
  locale: string,
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>,
) {
  return Boolean(locales?.[locale] || getLocaleDefinition(locale));
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

function createRegisteredLocaleDefinition(locale: string) {
  return cloneLocaleDefinition(
    getLocaleDefinition(locale) ?? {
      ...fallbackLocaleDefinition,
      code: locale,
    },
  );
}

function isLocaleDefinitionPack(
  pack:
    | Record<string, EmojiLocaleEmojiTranslation>
    | Partial<EmojiLocaleDefinition>,
): pack is Partial<EmojiLocaleDefinition> {
  return (
    typeof pack === 'object' &&
    pack !== null &&
    ('labels' in pack || 'categories' in pack || 'skinTones' in pack || 'emoji' in pack)
  );
}

export function subscribeEmojiLocaleRegistry(listener: () => void) {
  localeRegistryListeners.add(listener);

  return () => {
    localeRegistryListeners.delete(listener);
  };
}

export function getEmojiLocaleRegistrySnapshot() {
  return localeRegistryVersion;
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
      getLocaleDefinition(localeCode) ??
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

export function registerEmojiLocalePack(
  locale: EmojiLocaleCode,
  pack:
    | Record<string, EmojiLocaleEmojiTranslation>
    | Partial<EmojiLocaleDefinition>,
) {
  const normalizedLocale = locale.toLowerCase();
  const existing = getRegisteredLocaleDefinition(normalizedLocale) ??
    createRegisteredLocaleDefinition(normalizedLocale);

  if (isLocaleDefinitionPack(pack)) {
    existing.labels = mergeLabels(
      existing.labels,
      pack.labels,
    );
    existing.categories = mergeCategories(
      existing.categories,
      pack.categories,
    );
    existing.skinTones = mergeSkinTones(
      existing.skinTones,
      pack.skinTones,
    );
    existing.emoji = mergeEmojiTranslations(
      existing.emoji,
      pack.emoji,
    );
  } else {
    existing.emoji = mergeEmojiTranslations(existing.emoji, pack);
  }

  registeredLocaleDefinitions.set(normalizedLocale, existing);
  emojiPickerLocales[normalizedLocale] = existing;
  emitLocaleRegistryChange();

  return existing;
}

export async function loadLocale(locale: EmojiLocaleCode) {
  for (const candidate of createLocaleCandidates(locale)) {
    if (candidate === 'en') {
      return resolveLocaleDefinition('en');
    }

    const existing = getRegisteredLocaleDefinition(candidate);

    if (existing && Object.keys(existing.emoji).length > 0) {
      return resolveLocaleDefinition(candidate);
    }

    const pendingLoad = pendingLocaleLoads.get(candidate);

    if (pendingLoad) {
      return pendingLoad;
    }

    const loadPromise = loadEmojiLocalePackFromCdn(candidate)
      .then((pack) => {
        registerEmojiLocalePack(candidate, pack);
        return resolveLocaleDefinition(candidate);
      })
      .finally(() => {
        pendingLocaleLoads.delete(candidate);
      });

    pendingLocaleLoads.set(candidate, loadPromise);

    try {
      return await loadPromise;
    } catch {
      continue;
    }
  }

  throw new Error(`Unable to load locale pack for "${locale}".`);
}
