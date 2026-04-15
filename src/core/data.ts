import rawEmojiData from './generated/emoji-data.json';
import {
  getLocalizedCategoryLabel,
  getLocalizedEmojiKeywords,
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
  PreparedCustomEmoji,
  UnicodeEmoji,
} from './types';

type UnicodeEmojiRecord = Omit<
  UnicodeEmoji,
  'kind' | 'searchTokens' | 'categoryLabel'
>;

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

const unicodeEmojiData = (
  rawEmojiData as unknown as UnicodeEmojiRecord[]
).map((emoji) => ({
  ...emoji,
  kind: 'unicode' as const,
  categoryLabel: CATEGORY_META[emoji.categoryId].label,
  searchTokens: createSearchTokens({
    name: emoji.name,
    categoryLabel: CATEGORY_META[emoji.categoryId].label,
    subcategory: emoji.subcategory,
    aliases: emoji.aliases,
    emoticons: emoji.emoticons,
  }),
}));

const unicodeEmojiById = new Map(unicodeEmojiData.map((emoji) => [emoji.id, emoji]));
const unicodeEmojiByNative = new Map(
  unicodeEmojiData.map((emoji) => [emoji.native, emoji]),
);

const unicodeEmojiByCategory = unicodeEmojiData.reduce<
  Record<BuiltInEmojiCategoryId, UnicodeEmoji[]>
>(
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
);

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

export function getUnicodeEmojiData() {
  return unicodeEmojiData;
}

export function getUnicodeEmojiByCategory(categoryId: BuiltInEmojiCategoryId) {
  return unicodeEmojiByCategory[categoryId];
}

export function getUnicodeEmojiById(id: string) {
  return unicodeEmojiById.get(id);
}

export function getUnicodeEmojiByNative(native: string) {
  return unicodeEmojiByNative.get(native);
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
  const localizedCategoryLabel = getLocalizedCategoryLabel(
    emoji.categoryId,
    localeDefinition,
    options.categoryLabel ?? emoji.categoryLabel,
  );

  return {
    id: emoji.id,
    name: localeDefinition.emoji[emoji.id]?.name || emoji.name,
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
    name: localeDefinition.emoji[emoji.id]?.name || emoji.name,
    categoryLabel: getLocalizedCategoryLabel(emoji.categoryId, localeDefinition),
    subcategory: emoji.subcategory,
    aliases: emoji.aliases,
    emoticons: [
      ...emoji.emoticons,
      ...getLocalizedEmojiKeywords(emoji, localeDefinition),
    ],
  });
}
