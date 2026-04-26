import { DEFAULT_LABELS } from '../constants';
import {
  loadEmojiLocalePackFromCdn,
  loadEmojiLocaleSearchFromCdn,
} from '../data-source';
import type {
  EmojiCategoryId,
  EmojiLocaleCategoryLabels,
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiLocaleEmojiTranslation,
  EmojiLocaleSearchIndex,
  EmojiPickerLabels,
  EmojiRenderable,
  EmojiSkinTone,
} from '../types';
import { getBuiltinLocaleDefinition } from './locales';

const localeRegistryListeners = new Set<() => void>();
const registeredLocaleDefinitions = new Map<string, EmojiLocaleDefinition>();
const pendingLocaleLoads = new Map<string, Promise<EmojiLocaleDefinition>>();
const localeKeywordIndexes = new Map<string, EmojiLocaleSearchIndex>();
const pendingSearchIndexLoads = new Map<
  string,
  Promise<EmojiLocaleSearchIndex>
>();
const regionDisplayNameCache = new Map<string, Intl.DisplayNames | null>();
let localeRegistryVersion = 0;

const FLAG_LABEL_BY_LOCALE: Record<string, string> = {
  de: 'Flagge',
  en: 'Flag',
  es: 'Bandera',
  fr: 'Drapeau',
  ja: '旗',
  pt: 'Bandeira',
  ru: 'Флаг',
  uk: 'Прапор',
};

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const REGIONAL_INDICATOR_LAST = 0x1f1ff;

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

function mergeRecord<T extends object>(
  base: T,
  override?: object,
  keepValue?: (value: unknown) => boolean,
) {
  const merged = { ...base, ...override } as Record<string, unknown>;

  if (!keepValue) {
    return merged as T;
  }

  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => keepValue(value)),
  ) as T;
}

function toSentenceCase(value: string, locale: string) {
  const lower = value.toLocaleLowerCase(locale);
  return lower.charAt(0).toLocaleUpperCase(locale) + lower.slice(1);
}

function parseRegionalIndicatorCode(id: string) {
  const parts = id.split('-').map((segment) => Number.parseInt(segment, 16));

  if (parts.length !== 2) {
    return null;
  }

  const first = parts[0]!;
  const second = parts[1]!;

  if (
    first < REGIONAL_INDICATOR_BASE ||
    first > REGIONAL_INDICATOR_LAST ||
    second < REGIONAL_INDICATOR_BASE ||
    second > REGIONAL_INDICATOR_LAST
  ) {
    return null;
  }

  return (
    String.fromCharCode('A'.charCodeAt(0) + (first - REGIONAL_INDICATOR_BASE)) +
    String.fromCharCode('A'.charCodeAt(0) + (second - REGIONAL_INDICATOR_BASE))
  );
}

function getRegionDisplayNames(locale: string) {
  const normalizedLocale = locale.toLowerCase();

  if (!regionDisplayNameCache.has(normalizedLocale)) {
    try {
      regionDisplayNameCache.set(
        normalizedLocale,
        new Intl.DisplayNames([normalizedLocale, 'en'], {
          type: 'region',
          fallback: 'none',
        }),
      );
    } catch {
      regionDisplayNameCache.set(normalizedLocale, null);
    }
  }

  return regionDisplayNameCache.get(normalizedLocale) ?? null;
}

function getRuntimeFlagName(emojiId: string, locale: string) {
  const regionCode = parseRegionalIndicatorCode(emojiId);

  if (!regionCode) {
    return null;
  }

  const displayNames = getRegionDisplayNames(locale);
  const regionName = displayNames?.of(regionCode);

  if (!regionName) {
    return null;
  }

  const baseLocale = locale.toLowerCase().split('-')[0] ?? 'en';
  const flagLabel =
    FLAG_LABEL_BY_LOCALE[locale.toLowerCase()] ??
    FLAG_LABEL_BY_LOCALE[baseLocale] ??
    FLAG_LABEL_BY_LOCALE.en;

  return toSentenceCase(`${flagLabel}: ${regionName}`, locale);
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

    nextDefinition.labels = mergeRecord(nextDefinition.labels, baseLocale.labels);
    nextDefinition.categories = mergeRecord(
      nextDefinition.categories,
      baseLocale.categories,
      (value) => typeof value === 'string',
    );
    nextDefinition.skinTones = mergeRecord(
      nextDefinition.skinTones,
      baseLocale.skinTones,
    );
    nextDefinition.emoji = mergeRecord(
      nextDefinition.emoji,
      baseLocale.emoji,
    );

    if (override) {
      nextDefinition.labels = mergeRecord(
        nextDefinition.labels,
        override.labels,
      );
      nextDefinition.categories = mergeRecord(
        nextDefinition.categories,
        override.categories,
        (value) => typeof value === 'string',
      );
      nextDefinition.skinTones = mergeRecord(
        nextDefinition.skinTones,
        override.skinTones,
      );
      nextDefinition.emoji = mergeRecord(
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
  return (
    translation.name ||
    getRuntimeFlagName(emoji.id, localeDefinition.code) ||
    emoji.name
  );
}

export function getLocalizedEmojiKeywords(
  emoji: EmojiRenderable,
  localeDefinition: EmojiLocaleDefinition,
) {
  if (emoji.kind === 'custom') {
    return [];
  }

  const indexedKeywords =
    localeKeywordIndexes.get(localeDefinition.code)?.[emoji.id];

  if (indexedKeywords) {
    return indexedKeywords;
  }

  return (
    getLocalizedEmojiTranslation(emoji.id, localeDefinition).keywords ?? []
  );
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

function extractKeywordIndex(
  pack: Record<string, EmojiLocaleEmojiTranslation> | undefined,
): EmojiLocaleSearchIndex | null {
  if (!pack) {
    return null;
  }

  const entries: Array<[string, string[]]> = [];

  for (const [emojiId, translation] of Object.entries(pack)) {
    if (translation.keywords && translation.keywords.length > 0) {
      entries.push([emojiId, translation.keywords]);
    }
  }

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function mergeSearchIndexInto(
  locale: string,
  partial: EmojiLocaleSearchIndex,
) {
  const existing = localeKeywordIndexes.get(locale) ?? {};
  localeKeywordIndexes.set(locale, { ...existing, ...partial });
}

export function registerEmojiLocaleSearchIndex(
  locale: EmojiLocaleCode,
  index: EmojiLocaleSearchIndex,
) {
  const normalizedLocale = locale.toLowerCase();
  mergeSearchIndexInto(normalizedLocale, index);
  emitLocaleRegistryChange();
}

export function preloadEmojiLocaleSearchIndex(
  locale: EmojiLocaleCode,
  index: EmojiLocaleSearchIndex,
) {
  registerEmojiLocaleSearchIndex(locale, index);
}

export async function loadEmojiLocaleSearchIndex(
  locale: EmojiLocaleCode,
): Promise<EmojiLocaleSearchIndex> {
  const candidates = createLocaleCandidates(locale);

  for (const candidate of candidates) {
    const cached = localeKeywordIndexes.get(candidate);

    if (cached) {
      return cached;
    }

    const pendingLoad = pendingSearchIndexLoads.get(candidate);

    if (pendingLoad) {
      return pendingLoad;
    }

    const loadPromise = loadEmojiLocaleSearchFromCdn(candidate)
      .then((index) => {
        mergeSearchIndexInto(candidate, index);
        emitLocaleRegistryChange();
        return localeKeywordIndexes.get(candidate) ?? index;
      })
      .finally(() => {
        pendingSearchIndexLoads.delete(candidate);
      });

    pendingSearchIndexLoads.set(candidate, loadPromise);

    try {
      return await loadPromise;
    } catch {
      continue;
    }
  }

  throw new Error(`Unable to load search index for "${locale}".`);
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
    existing.labels = mergeRecord(
      existing.labels,
      pack.labels,
    );
    existing.categories = mergeRecord(
      existing.categories,
      pack.categories,
      (value) => typeof value === 'string',
    );
    existing.skinTones = mergeRecord(
      existing.skinTones,
      pack.skinTones,
    );
    existing.emoji = mergeRecord(
      existing.emoji,
      pack.emoji,
    );

    const definitionKeywords = extractKeywordIndex(pack.emoji);

    if (definitionKeywords) {
      mergeSearchIndexInto(normalizedLocale, definitionKeywords);
    }
  } else {
    existing.emoji = mergeRecord(existing.emoji, pack);

    const inlineKeywords = extractKeywordIndex(pack);

    if (inlineKeywords) {
      mergeSearchIndexInto(normalizedLocale, inlineKeywords);
    }
  }

  registeredLocaleDefinitions.set(normalizedLocale, existing);
  emojiPickerLocales[normalizedLocale] = existing;
  emitLocaleRegistryChange();

  return existing;
}

export async function loadLocale(
  locale: EmojiLocaleCode,
): Promise<EmojiLocaleDefinition> {
  for (const candidate of createLocaleCandidates(locale)) {
    const existing = getRegisteredLocaleDefinition(candidate);

    if (existing && Object.keys(existing.emoji).length > 0) {
      return resolveLocaleDefinition(candidate);
    }

    const pendingLoad = pendingLocaleLoads.get(candidate);

    if (pendingLoad) {
      return pendingLoad;
    }

    const loadPromise: Promise<EmojiLocaleDefinition> = (candidate === 'en'
      ? Promise.resolve()
      : loadLocale('en').then(() => undefined))
      .then(() => loadEmojiLocalePackFromCdn(candidate))
      .then((pack: Record<string, EmojiLocaleEmojiTranslation>) => {
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
