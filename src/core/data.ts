import { loadEmojiDataFromCdn } from './data-source';
import {
  getLocalizedCategoryLabel,
  getLocalizedEmojiKeywords,
  getLocalizedEmojiName,
} from './i18n';
import {
  CATEGORY_META,
  humanizeCategoryId,
  isSystemCategoryId,
} from './constants';
import type {
  BuiltInEmojiCategoryId,
  CustomEmoji,
  EmojiLocaleDefinition,
  EmojiRenderable,
  EmojiSelection,
  EmojiSkinTone,
  EmojiSkinVariant,
  PreparedCustomEmoji,
  UnicodeEmoji,
  UnicodeEmojiAvailability,
} from './types';

type PreparedUnicodeEmojiRecord = Omit<
  UnicodeEmoji,
  'kind' | 'searchTokens' | 'categoryLabel'
>;

type EmojiDataAvailabilityInput = UnicodeEmojiAvailability | number;

type EmojiSkinVariantInput = Omit<EmojiSkinVariant, 'unified'> & {
  unified?: string;
};

type EmojiSkinToneWithoutDefault = Exclude<EmojiSkinTone, 'default'>;

type UnicodeEmojiColumnField =
  | 'id'
  | 'native'
  | 'name'
  | 'aliases'
  | 'emoticons'
  | 'categoryId'
  | 'category'
  | 'cat'
  | 'subcategory'
  | 'sub'
  | 'sheetX'
  | 'x'
  | 'sheetY'
  | 'y'
  | 'availability'
  | 'av'
  | 'skins';

type UnicodeEmojiCanonicalColumnField =
  | 'id'
  | 'native'
  | 'name'
  | 'aliases'
  | 'emoticons'
  | 'categoryId'
  | 'subcategory'
  | 'sheetX'
  | 'sheetY'
  | 'availability'
  | 'skins';

type UnicodeEmojiColumnValue =
  | string
  | number
  | string[]
  | EmojiSkinVariantColumnRow[]
  | null;

export type EmojiSkinVariantColumnRow = [
  tone: number | EmojiSkinToneWithoutDefault,
  unified: string,
  native: string,
  sheetX: number,
  sheetY: number,
];

export type UnicodeEmojiDataRecord = Omit<
  PreparedUnicodeEmojiRecord,
  'unified' | 'availability' | 'skins' | 'subcategory'
> & {
  unified?: string;
  subcategory?: string;
  availability?: EmojiDataAvailabilityInput;
  skins: EmojiSkinVariantInput[];
};

export interface UnicodeEmojiColumnData {
  version?: 1;
  fields: readonly UnicodeEmojiColumnField[];
  categories?: readonly BuiltInEmojiCategoryId[];
  subcategories?: readonly string[];
  skinTones?: readonly EmojiSkinToneWithoutDefault[];
  rows: readonly (readonly UnicodeEmojiColumnValue[])[];
}

export type EmojiDataPayload =
  | UnicodeEmojiDataRecord[]
  | UnicodeEmojiColumnData;

export type EmojiDataInput =
  | EmojiDataPayload
  | {
      default: EmojiDataPayload;
    };

type EmojiDataStoreStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PreparedUnicodeEmojiData {
  list: UnicodeEmoji[];
  byId: Map<string, UnicodeEmoji>;
  byNative: Map<string, UnicodeEmoji>;
  byCategory: Record<BuiltInEmojiCategoryId, UnicodeEmoji[]>;
}

export interface EmojiDataStoreSnapshot {
  ready: boolean;
  status: EmojiDataStoreStatus;
  error: unknown;
  version: number;
}

const emojiDataStoreListeners = new Set<() => void>();
const emojiDataStore: {
  status: EmojiDataStoreStatus;
  prepared: PreparedUnicodeEmojiData | null;
  error: unknown;
  promise: Promise<UnicodeEmoji[]> | null;
  version: number;
} = {
  status: 'idle',
  prepared: null,
  error: null,
  promise: null,
  version: 0,
};
let emojiDataStoreSnapshot: EmojiDataStoreSnapshot = {
  ready: false,
  status: 'idle',
  error: null,
  version: 0,
};

const DEFAULT_COLUMN_CATEGORIES: readonly BuiltInEmojiCategoryId[] = [
  'smileys',
  'people',
  'animals',
  'food',
  'activities',
  'travel',
  'objects',
  'symbols',
  'flags',
];

const DEFAULT_COLUMN_SKIN_TONES: readonly EmojiSkinToneWithoutDefault[] = [
  'light',
  'medium-light',
  'medium',
  'medium-dark',
  'dark',
];

const COLUMN_FIELD_ALIASES: Record<
  UnicodeEmojiCanonicalColumnField,
  readonly UnicodeEmojiColumnField[]
> = {
  id: ['id'],
  native: ['native'],
  name: ['name'],
  aliases: ['aliases'],
  emoticons: ['emoticons'],
  categoryId: ['categoryId', 'category', 'cat'],
  subcategory: ['subcategory', 'sub'],
  sheetX: ['sheetX', 'x'],
  sheetY: ['sheetY', 'y'],
  availability: ['availability', 'av'],
  skins: ['skins'],
};

function syncEmojiDataStoreSnapshot() {
  emojiDataStoreSnapshot = {
    ready: emojiDataStore.prepared !== null,
    status: emojiDataStore.status,
    error: emojiDataStore.error,
    version: emojiDataStore.version,
  };
}

function emitEmojiDataStoreChange() {
  emojiDataStore.version += 1;
  syncEmojiDataStoreSnapshot();

  for (const listener of emojiDataStoreListeners) {
    listener();
  }
}

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/gu, ' ')
    .replace(/[^\p{L}\p{N}:+()<> ]+/gu, ' ')
    .replace(/\s+/gu, ' ');
}

function createSearchTokens(options: {
  name: string;
  categoryLabel: string;
  subcategory: string;
  aliases: string[];
  emoticons: string[];
}) {
  return Array.from(
    new Set(
      [
        options.name,
        options.categoryLabel,
        options.subcategory,
        ...options.aliases,
        ...options.aliases.map((alias) => alias.replaceAll('_', ' ')),
        ...options.aliases.map((alias) => `:${alias}:`),
        ...options.emoticons,
      ]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .map((value) => normalizeQuery(value))
        .filter(Boolean),
    ),
  );
}

function unwrapEmojiDataInput(raw: EmojiDataInput): EmojiDataPayload {
  if (
    raw &&
    typeof raw === 'object' &&
    'default' in raw &&
    raw.default &&
    typeof raw.default === 'object'
  ) {
    return raw.default;
  }

  return raw as EmojiDataPayload;
}

function isColumnEmojiData(
  raw: EmojiDataPayload,
): raw is UnicodeEmojiColumnData {
  return (
    raw !== null &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    Array.isArray(raw.fields) &&
    Array.isArray(raw.rows)
  );
}

function createColumnFieldIndexes(fields: readonly UnicodeEmojiColumnField[]) {
  const indexes: Partial<Record<UnicodeEmojiCanonicalColumnField, number>> = {};

  for (const [field, aliases] of Object.entries(COLUMN_FIELD_ALIASES) as Array<
    [
      UnicodeEmojiCanonicalColumnField,
      readonly UnicodeEmojiColumnField[],
    ]
  >) {
    const index = fields.findIndex((candidate) => aliases.includes(candidate));

    if (index >= 0) {
      indexes[field] = index;
    }
  }

  return indexes;
}

function getColumnValue(
  row: readonly UnicodeEmojiColumnValue[],
  indexes: Partial<Record<UnicodeEmojiCanonicalColumnField, number>>,
  field: UnicodeEmojiCanonicalColumnField,
) {
  const index = indexes[field];

  return index === undefined ? undefined : row[index];
}

function requireColumnString(
  row: readonly UnicodeEmojiColumnValue[],
  indexes: Partial<Record<UnicodeEmojiCanonicalColumnField, number>>,
  field: UnicodeEmojiCanonicalColumnField,
) {
  const value = getColumnValue(row, indexes, field);

  if (typeof value !== 'string') {
    throw new Error(`Emoji data column is missing string field: ${field}`);
  }

  return value;
}

function requireColumnNumber(
  row: readonly UnicodeEmojiColumnValue[],
  indexes: Partial<Record<UnicodeEmojiCanonicalColumnField, number>>,
  field: UnicodeEmojiCanonicalColumnField,
) {
  const value = getColumnValue(row, indexes, field);

  if (typeof value !== 'number') {
    throw new Error(`Emoji data column is missing number field: ${field}`);
  }

  return value;
}

function toStringArray(value: UnicodeEmojiColumnValue | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function isBuiltInCategoryId(value: string): value is BuiltInEmojiCategoryId {
  return DEFAULT_COLUMN_CATEGORIES.includes(value as BuiltInEmojiCategoryId);
}

function resolveColumnCategory(
  value: UnicodeEmojiColumnValue | undefined,
  categories: readonly BuiltInEmojiCategoryId[],
) {
  if (typeof value === 'number') {
    const categoryId = categories[value];

    if (categoryId) {
      return categoryId;
    }
  }

  if (typeof value === 'string' && isBuiltInCategoryId(value)) {
    return value;
  }

  throw new Error('Emoji data column contains an invalid category reference.');
}

function resolveColumnSubcategory(
  value: UnicodeEmojiColumnValue | undefined,
  subcategories: readonly string[],
) {
  if (typeof value === 'number') {
    return subcategories[value] ?? '';
  }

  return typeof value === 'string' ? value : '';
}

function isSkinToneWithoutDefault(
  value: string,
): value is EmojiSkinToneWithoutDefault {
  return DEFAULT_COLUMN_SKIN_TONES.includes(
    value as EmojiSkinToneWithoutDefault,
  );
}

function resolveColumnSkinTone(
  value: EmojiSkinVariantColumnRow[0],
  skinTones: readonly EmojiSkinToneWithoutDefault[],
) {
  if (typeof value === 'number') {
    return skinTones[value] ?? null;
  }

  return isSkinToneWithoutDefault(value) ? value : null;
}

function expandColumnSkinVariant(
  skin: EmojiSkinVariantColumnRow,
  skinTones: readonly EmojiSkinToneWithoutDefault[],
) {
  const [toneRef, unified, native, sheetX, sheetY] = skin;
  const tone = resolveColumnSkinTone(toneRef, skinTones);

  if (
    !tone ||
    typeof unified !== 'string' ||
    typeof native !== 'string' ||
    typeof sheetX !== 'number' ||
    typeof sheetY !== 'number'
  ) {
    throw new Error('Emoji data column contains an invalid skin variant.');
  }

  return {
    tone,
    unified,
    native,
    sheetX,
    sheetY,
  };
}

function expandColumnSkins(
  value: UnicodeEmojiColumnValue | undefined,
  skinTones: readonly EmojiSkinToneWithoutDefault[],
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((skin): skin is EmojiSkinVariantColumnRow =>
      Array.isArray(skin),
    )
    .map((skin) => expandColumnSkinVariant(skin, skinTones));
}

function expandColumnEmojiData(
  raw: UnicodeEmojiColumnData,
): UnicodeEmojiDataRecord[] {
  const indexes = createColumnFieldIndexes(raw.fields);
  const categories = raw.categories ?? DEFAULT_COLUMN_CATEGORIES;
  const subcategories = raw.subcategories ?? [];
  const skinTones = raw.skinTones ?? DEFAULT_COLUMN_SKIN_TONES;

  return raw.rows.map((row) => ({
    id: requireColumnString(row, indexes, 'id'),
    native: requireColumnString(row, indexes, 'native'),
    name: requireColumnString(row, indexes, 'name'),
    aliases: toStringArray(getColumnValue(row, indexes, 'aliases')),
    emoticons: toStringArray(getColumnValue(row, indexes, 'emoticons')),
    categoryId: resolveColumnCategory(
      getColumnValue(row, indexes, 'categoryId'),
      categories,
    ),
    subcategory: resolveColumnSubcategory(
      getColumnValue(row, indexes, 'subcategory'),
      subcategories,
    ),
    sheetX: requireColumnNumber(row, indexes, 'sheetX'),
    sheetY: requireColumnNumber(row, indexes, 'sheetY'),
    availability: getColumnValue(row, indexes, 'availability') as
      | EmojiDataAvailabilityInput
      | undefined,
    skins: expandColumnSkins(
      getColumnValue(row, indexes, 'skins'),
      skinTones,
    ),
  }));
}

function normalizeEmojiDataInput(raw: EmojiDataInput): UnicodeEmojiDataRecord[] {
  const payload = unwrapEmojiDataInput(raw);

  return isColumnEmojiData(payload) ? expandColumnEmojiData(payload) : payload;
}

function idToUnified(id: string) {
  return id.toUpperCase();
}

function normalizeAvailability(
  availability: EmojiDataAvailabilityInput | undefined,
): UnicodeEmojiAvailability {
  if (typeof availability === 'number') {
    return {
      apple: (availability & 1) !== 0,
      google: (availability & 2) !== 0,
      twitter: (availability & 4) !== 0,
      facebook: (availability & 8) !== 0,
    };
  }

  if (availability) {
    return {
      apple: Boolean(availability.apple),
      google: Boolean(availability.google),
      twitter: Boolean(availability.twitter),
      facebook: Boolean(availability.facebook),
    };
  }

  return {
    apple: true,
    google: true,
    twitter: true,
    facebook: true,
  };
}

function normalizeUnicodeEmojiRecord(
  emoji: UnicodeEmojiDataRecord,
): PreparedUnicodeEmojiRecord {
  return {
    ...emoji,
    unified: emoji.unified ?? idToUnified(emoji.id),
    subcategory: emoji.subcategory ?? '',
    availability: normalizeAvailability(emoji.availability),
    skins: emoji.skins.map((skin) => ({
      ...skin,
      unified: skin.unified ?? idToUnified(emoji.id),
    })),
  };
}

function prepareUnicodeEmojiData(
  raw: UnicodeEmojiDataRecord[],
): PreparedUnicodeEmojiData {
  const list = raw.map((record) => {
    const emoji = normalizeUnicodeEmojiRecord(record);
    const categoryLabel = CATEGORY_META[emoji.categoryId].label;

    return {
      ...emoji,
      kind: 'unicode' as const,
      categoryLabel,
      searchTokens: createSearchTokens({
        name: emoji.name,
        categoryLabel,
        subcategory: emoji.subcategory,
        aliases: emoji.aliases,
        emoticons: emoji.emoticons,
      }),
    };
  });

  return {
    list,
    byId: new Map(list.map((emoji) => [emoji.id, emoji])),
    byNative: new Map(list.map((emoji) => [emoji.native, emoji])),
    byCategory: list.reduce<Record<BuiltInEmojiCategoryId, UnicodeEmoji[]>>(
      (groups, emoji) => {
        groups[emoji.categoryId].push(emoji);
        return groups;
      },
      {
        smileys: [],
        people: [],
        animals: [],
        food: [],
        activities: [],
        travel: [],
        objects: [],
        symbols: [],
        flags: [],
      },
    ),
  };
}

function getLoadedPreparedUnicodeEmojiData() {
  if (!emojiDataStore.prepared) {
    throw new Error(
      'Emoji data has not been loaded yet. Call preloadEmojiData(...) or await loadEmojiData() first.',
    );
  }

  return emojiDataStore.prepared;
}

function getQueryTerms(query: string) {
  return normalizeQuery(query)
    .split(' ')
    .map((term) => term.trim())
    .filter(Boolean);
}

function getTokenScore(token: string, term: string) {
  if (token === term) {
    return 240;
  }

  if (token.startsWith(term)) {
    return 180;
  }

  if (token.includes(` ${term}`)) {
    return 120;
  }

  if (token.includes(term)) {
    return 70;
  }

  return -1;
}

function getSearchScore(tokens: string[], queryTerms: string[]) {
  if (queryTerms.length === 0) {
    return 0;
  }

  let score = 0;

  for (const term of queryTerms) {
    let bestScore = -1;

    for (const token of tokens) {
      const tokenScore = getTokenScore(token, term);

      if (tokenScore > bestScore) {
        bestScore = tokenScore;
      }
    }

    if (bestScore < 0) {
      return -1;
    }

    score += bestScore;
  }

  return score;
}

export function subscribeEmojiDataStore(listener: () => void) {
  emojiDataStoreListeners.add(listener);

  return () => {
    emojiDataStoreListeners.delete(listener);
  };
}

export function getEmojiDataStoreSnapshot(): EmojiDataStoreSnapshot {
  return emojiDataStoreSnapshot;
}

export function hasEmojiData() {
  return emojiDataStore.prepared !== null;
}

export function preloadEmojiData(raw: EmojiDataInput) {
  const prepared = prepareUnicodeEmojiData(normalizeEmojiDataInput(raw));

  emojiDataStore.prepared = prepared;
  emojiDataStore.status = 'ready';
  emojiDataStore.error = null;
  emojiDataStore.promise = Promise.resolve(prepared.list);
  emitEmojiDataStoreChange();

  return prepared.list;
}

export function loadEmojiData(): Promise<UnicodeEmoji[]> {
  if (emojiDataStore.prepared) {
    return Promise.resolve(emojiDataStore.prepared.list);
  }

  if (emojiDataStore.promise) {
    return emojiDataStore.promise;
  }

  emojiDataStore.status = 'loading';
  emojiDataStore.error = null;

  const loadPromise = loadEmojiDataFromCdn()
    .then((raw) => preloadEmojiData(raw))
    .catch((error) => {
      emojiDataStore.status = 'error';
      emojiDataStore.error = error;
      emojiDataStore.promise = null;
      emitEmojiDataStoreChange();
      throw error;
    });

  emojiDataStore.promise = loadPromise;
  emitEmojiDataStoreChange();

  return loadPromise;
}

export function peekUnicodeEmojiData() {
  return emojiDataStore.prepared?.list ?? null;
}

export function peekUnicodeEmojiByCategory(
  categoryId: BuiltInEmojiCategoryId,
) {
  return emojiDataStore.prepared?.byCategory[categoryId] ?? [];
}

export function peekUnicodeEmojiById(id: string) {
  return emojiDataStore.prepared?.byId.get(id);
}

export function peekUnicodeEmojiByNative(native: string) {
  return emojiDataStore.prepared?.byNative.get(native);
}

export function getUnicodeEmojiData() {
  return getLoadedPreparedUnicodeEmojiData().list;
}

export function getUnicodeEmojiByCategory(categoryId: BuiltInEmojiCategoryId) {
  return getLoadedPreparedUnicodeEmojiData().byCategory[categoryId];
}

export function getUnicodeEmojiById(id: string) {
  return getLoadedPreparedUnicodeEmojiData().byId.get(id);
}

export function getUnicodeEmojiByNative(native: string) {
  return getLoadedPreparedUnicodeEmojiData().byNative.get(native);
}

export function resolveUnicodeEmojiVariant(
  emoji: UnicodeEmoji,
  skinTone: EmojiSkinTone,
) {
  if (skinTone === 'default') {
    return {
      native: emoji.native,
      unified: emoji.unified,
      sheetX: emoji.sheetX,
      sheetY: emoji.sheetY,
    };
  }

  const variant = emoji.skins.find((skin) => skin.tone === skinTone);

  if (!variant) {
    return {
      native: emoji.native,
      unified: emoji.unified,
      sheetX: emoji.sheetX,
      sheetY: emoji.sheetY,
    };
  }

  return {
    native: variant.native,
    unified: variant.unified,
    sheetX: variant.sheetX,
    sheetY: variant.sheetY,
  };
}

export function filterEmoji<T extends { searchTokens: string[] }>(
  emojiList: T[],
  query: string,
  getLocalizedSearchTokens?: (emoji: T) => string[],
) {
  if (!query.trim()) {
    return emojiList;
  }

  const queryTerms = getQueryTerms(query);

  return emojiList
    .map((emoji, index) => {
      const englishScore = getSearchScore(emoji.searchTokens, queryTerms);
      const localizedTokens = getLocalizedSearchTokens?.(emoji) ?? [];
      const localizedScore = getSearchScore(localizedTokens, queryTerms);

      if (englishScore < 0 && localizedScore < 0) {
        return null;
      }

      const finalScore =
        englishScore >= 0
          ? 1000 + englishScore + Math.max(localizedScore, 0) * 0.01
          : localizedScore;

      return {
        emoji,
        index,
        score: finalScore,
      };
    })
    .filter((entry): entry is { emoji: T; index: number; score: number } => Boolean(entry))
    .sort((left, right) => {
      if (right.score === left.score) {
        return left.index - right.index;
      }

      return right.score - left.score;
    })
    .map((entry) => entry.emoji);
}

export function prepareCustomEmojis(customEmojis: CustomEmoji[] = []) {
  return customEmojis.map<PreparedCustomEmoji>((emoji) => {
    const categoryId = emoji.categoryId?.trim() || 'custom';
    const categoryLabel =
      emoji.categoryLabel?.trim() ||
      (isSystemCategoryId(categoryId)
        ? CATEGORY_META[categoryId].label
        : humanizeCategoryId(categoryId));
    const shortcodes = Array.from(
      new Set(
        (emoji.shortcodes ?? []).filter(
          (value): value is string => typeof value === 'string' && value.length > 0,
        ),
      ),
    );
    const emoticons = Array.from(
      new Set(
        (emoji.emoticons ?? []).filter(
          (value): value is string => typeof value === 'string' && value.length > 0,
        ),
      ),
    );
    const searchTokens = Array.from(
      new Set(
        [
          emoji.name,
          emoji.categoryLabel,
          ...shortcodes,
          ...shortcodes.map((shortcode) => shortcode.replaceAll('_', ' ')),
          ...shortcodes.map((shortcode) => `:${shortcode}:`),
          ...(emoji.keywords ?? []),
          ...emoticons,
        ]
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
          .map((value) => normalizeQuery(value))
          .filter(Boolean),
      ),
    );

    return {
      ...emoji,
      kind: 'custom',
      shortcodes,
      emoticons,
      searchTokens,
      categoryId,
      categoryLabel,
    };
  });
}

export function createEmojiSelection(
  emoji: EmojiRenderable,
  skinTone: EmojiSkinTone,
  localeDefinition: EmojiLocaleDefinition,
  options: {
    categoryLabel?: string;
  } = {},
): EmojiSelection {
  if (emoji.kind === 'custom') {
    const localizedCategoryLabel =
      options.categoryLabel ??
      getLocalizedCategoryLabel(
        emoji.categoryId,
        localeDefinition,
        emoji.categoryLabel,
      );

    return {
      id: emoji.id,
      name: emoji.name,
      englishName: emoji.name,
      native: emoji.native,
      shortcodes: emoji.shortcodes,
      emoticons: emoji.emoticons,
      categoryId: emoji.categoryId,
      categoryLabel: localizedCategoryLabel,
      englishCategoryLabel: emoji.categoryLabel || localizedCategoryLabel,
      custom: true,
      imageUrl: emoji.imageUrl,
      skinTone,
      locale: localeDefinition.code,
    };
  }

  const variant = resolveUnicodeEmojiVariant(emoji, skinTone);
  const localizedName = getLocalizedEmojiName(emoji, localeDefinition);
  const localizedCategoryLabel = getLocalizedCategoryLabel(
    emoji.categoryId,
    localeDefinition,
    options.categoryLabel ?? emoji.categoryLabel,
  );

  return {
    id: emoji.id,
    name: localizedName,
    englishName: emoji.name,
    native: variant.native,
    unified: variant.unified,
    shortcodes: emoji.aliases,
    emoticons: emoji.emoticons,
    categoryId: emoji.categoryId,
    categoryLabel: localizedCategoryLabel,
    englishCategoryLabel: emoji.categoryLabel,
    custom: false,
    skinTone,
    locale: localeDefinition.code,
  };
}

export function getLocalizedSearchTokens(
  emoji: EmojiRenderable,
  localeDefinition: EmojiLocaleDefinition,
) {
  if (emoji.kind === 'custom') {
    return [];
  }

  return createSearchTokens({
    name: getLocalizedEmojiName(emoji, localeDefinition),
    categoryLabel: getLocalizedCategoryLabel(emoji.categoryId, localeDefinition),
    subcategory: emoji.subcategory,
    aliases: emoji.aliases,
    emoticons: [
      ...emoji.emoticons,
      ...getLocalizedEmojiKeywords(emoji, localeDefinition),
    ],
  });
}
