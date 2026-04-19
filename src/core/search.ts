import {
  filterEmoji,
  getLocalizedSearchTokens,
  getUnicodeEmojiData,
  prepareCustomEmojis,
} from './data';
import { resolveLocaleDefinition } from './i18n';
import type {
  CustomEmoji,
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiRenderable,
  EmojiSearchConfigLike,
  EmojiSearchRankContext,
  EmojiSearchTokenizeContext,
} from './types';

export type {
  EmojiSearchConfigLike as EmojiSearchConfig,
  EmojiSearchRankContext,
  EmojiSearchTokenizeContext,
};

export interface CreateEmojiIndexOptions {
  locale?: EmojiLocaleCode;
  fallbackLocale?: EmojiLocaleCode | EmojiLocaleCode[];
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>;
  customEmojis?: CustomEmoji[];
  searchConfig?: EmojiSearchConfigLike;
  includeUnicode?: boolean;
}

export interface EmojiSearchOptions {
  searchConfig?: EmojiSearchConfigLike;
  localeDefinition?: EmojiLocaleDefinition;
}

export interface EmojiIndex {
  readonly emojis: EmojiRenderable[];
  readonly localeDefinition: EmojiLocaleDefinition;
  search: (query: string) => EmojiRenderable[];
  getById: (id: string) => EmojiRenderable | undefined;
  getByNative: (native: string) => EmojiRenderable | undefined;
}

function defaultNormalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/gu, ' ')
    .replace(/[^\p{L}\p{N}:+()<> ]+/gu, ' ')
    .replace(/\s+/gu, ' ');
}

function getQueryTerms(query: string, normalize: (value: string) => string) {
  return normalize(query)
    .split(' ')
    .map((term) => term.trim())
    .filter(Boolean);
}

function scoreToken(token: string, term: string) {
  if (token === term) return 240;
  if (token.startsWith(term)) return 180;
  if (token.includes(` ${term}`)) return 120;
  if (token.includes(term)) return 70;
  return -1;
}

function defaultRank({ tokens, queryTerms }: EmojiSearchRankContext) {
  if (queryTerms.length === 0) {
    return 0;
  }

  let total = 0;

  for (const term of queryTerms) {
    let best = -1;

    for (const token of tokens) {
      const value = scoreToken(token, term);

      if (value > best) {
        best = value;
      }
    }

    if (best < 0) {
      return -1;
    }

    total += best;
  }

  return total;
}

function defaultTokenize({
  emoji,
  localeDefinition,
}: EmojiSearchTokenizeContext) {
  if (emoji.kind === 'custom') {
    return emoji.searchTokens;
  }

  return [
    ...emoji.searchTokens,
    ...getLocalizedSearchTokens(emoji, localeDefinition),
  ];
}

export function searchEmoji(
  emojis: EmojiRenderable[],
  query: string,
  options: EmojiSearchOptions = {},
): EmojiRenderable[] {
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return emojis;
  }

  const localeDefinition =
    options.localeDefinition ?? resolveLocaleDefinition('en');
  const config = options.searchConfig ?? {};
  const normalize = config.normalize ?? defaultNormalize;
  const tokenize = config.tokenize ?? defaultTokenize;
  const rank = config.rank ?? defaultRank;
  const queryTerms = getQueryTerms(query, normalize);

  if (queryTerms.length === 0) {
    return emojis;
  }

  const ranked = emojis
    .map((emoji, index) => {
      const tokens = tokenize({ emoji, localeDefinition }).map(normalize);
      const score = rank({
        emoji,
        query: trimmed,
        queryTerms,
        tokens,
        localeDefinition,
      });

      if (score < 0) {
        return null;
      }

      return { emoji, index, score };
    })
    .filter(
      (
        entry,
      ): entry is { emoji: EmojiRenderable; index: number; score: number } =>
        Boolean(entry),
    )
    .sort((left, right) => {
      if (right.score === left.score) {
        return left.index - right.index;
      }

      return right.score - left.score;
    });

  return ranked.map((entry) => entry.emoji);
}

export function createEmojiIndex(
  options: CreateEmojiIndexOptions = {},
): EmojiIndex {
  const localeDefinition = resolveLocaleDefinition(
    options.locale,
    options.locales,
    options.fallbackLocale,
  );
  const includeUnicode = options.includeUnicode ?? true;
  const unicodeEmoji = includeUnicode
    ? (getUnicodeEmojiData() as EmojiRenderable[])
    : [];
  const customEmoji = prepareCustomEmojis(options.customEmojis ?? []);
  const emojis: EmojiRenderable[] = [...unicodeEmoji, ...customEmoji];
  const byId = new Map(emojis.map((emoji) => [emoji.id, emoji]));
  const byNative = new Map<string, EmojiRenderable>();

  for (const emoji of emojis) {
    const native =
      emoji.kind === 'unicode' ? emoji.native : emoji.native ?? '';

    if (native) {
      byNative.set(native, emoji);
    }
  }

  return {
    emojis,
    localeDefinition,
    search(query: string) {
      return searchEmoji(emojis, query, {
        searchConfig: options.searchConfig,
        localeDefinition,
      });
    },
    getById(id: string) {
      return byId.get(id);
    },
    getByNative(native: string) {
      return byNative.get(native);
    },
  };
}

export function filterEmojiWithSearchConfig(
  emojis: EmojiRenderable[],
  query: string,
  localeDefinition: EmojiLocaleDefinition,
  searchConfig: EmojiSearchConfigLike | undefined,
): EmojiRenderable[] {
  if (!searchConfig) {
    return filterEmoji(
      emojis,
      query,
      (emoji) =>
        emoji.kind === 'custom'
          ? []
          : getLocalizedSearchTokens(emoji, localeDefinition),
    );
  }

  return searchEmoji(emojis, query, {
    searchConfig,
    localeDefinition,
  });
}
