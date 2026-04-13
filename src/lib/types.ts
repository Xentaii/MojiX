import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type EmojiVendor =
  | 'apple'
  | 'google'
  | 'twitter'
  | 'facebook'
  | (string & {});

export type EmojiLocaleCode = 'en' | 'ru' | (string & {});

export type EmojiSkinTone =
  | 'default'
  | 'light'
  | 'medium-light'
  | 'medium'
  | 'medium-dark'
  | 'dark';

export type EmojiCategoryId =
  | 'recent'
  | 'smileys'
  | 'people'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags'
  | 'custom';

export type BuiltInEmojiCategoryId = Exclude<
  EmojiCategoryId,
  'recent' | 'custom'
>;

export type EmojiSpriteSheetVariant =
  | 'default'
  | 'indexed-128'
  | 'indexed-256'
  | 'clean';

export type EmojiSpriteSheetSource = 'cdn' | 'local' | 'custom';

export type EmojiSpriteSheetCacheMode = 'off' | 'browser' | 'custom';

export interface EmojiSkinVariant {
  tone: Exclude<EmojiSkinTone, 'default'>;
  unified: string;
  native: string;
  sheetX: number;
  sheetY: number;
}

export interface UnicodeEmoji {
  kind: 'unicode';
  id: string;
  unified: string;
  native: string;
  name: string;
  aliases: string[];
  emoticons: string[];
  searchTokens: string[];
  categoryId: BuiltInEmojiCategoryId;
  categoryLabel: string;
  subcategory: string;
  sheetX: number;
  sheetY: number;
  availability: {
    apple: boolean;
    google: boolean;
    twitter: boolean;
    facebook: boolean;
  };
  skins: EmojiSkinVariant[];
}

export interface CustomEmojiSprite {
  sheetUrl?: string;
  sheetX: number;
  sheetY: number;
  sheetSize?: number;
  padding?: number;
  gridSize?: number;
}

export interface CustomEmoji {
  id: string;
  name: string;
  native?: string;
  shortcodes?: string[];
  keywords?: string[];
  emoticons?: string[];
  categoryLabel?: string;
  imageUrl?: string;
  sprite?: CustomEmojiSprite;
}

export interface PreparedCustomEmoji extends CustomEmoji {
  kind: 'custom';
  shortcodes: string[];
  emoticons: string[];
  searchTokens: string[];
  categoryId: 'custom';
  categoryLabel: string;
}

export type EmojiRenderable = UnicodeEmoji | PreparedCustomEmoji;

export interface EmojiSelection {
  id: string;
  name: string;
  englishName: string;
  native?: string;
  unified?: string;
  shortcodes: string[];
  emoticons: string[];
  categoryId: EmojiCategoryId;
  categoryLabel: string;
  englishCategoryLabel: string;
  custom: boolean;
  imageUrl?: string;
  skinTone: EmojiSkinTone;
  locale: EmojiLocaleCode;
}

export interface EmojiSpriteSheetContext {
  vendor: EmojiVendor;
  sheetSize: number;
  variant: EmojiSpriteSheetVariant;
  source: EmojiSpriteSheetSource;
  version: string;
  packageName: string;
  basePath: string;
}

export interface EmojiSpriteSheetCacheRequest {
  key: string;
  url: string;
  vendor: EmojiVendor;
  sheetSize: number;
  variant: EmojiSpriteSheetVariant;
  source: EmojiSpriteSheetSource;
  version: string;
  packageName: string;
}

export interface EmojiSpriteSheetCachedAsset {
  url: string;
  cached: boolean;
  release?: () => void;
}

export interface EmojiSpriteSheetCacheAdapter {
  load: (
    request: EmojiSpriteSheetCacheRequest,
  ) => Promise<EmojiSpriteSheetCachedAsset | null>;
  save: (
    request: EmojiSpriteSheetCacheRequest,
    response: Response,
  ) => Promise<EmojiSpriteSheetCachedAsset>;
}

export interface EmojiSpriteSheetCacheConfig {
  enabled?: boolean;
  mode?: EmojiSpriteSheetCacheMode;
  preload?: 'mount' | 'manual';
  key?: string;
  adapter?: EmojiSpriteSheetCacheAdapter;
}

export interface EmojiSpriteSheetConfig {
  url?: string | ((context: EmojiSpriteSheetContext) => string);
  vendor?: EmojiVendor;
  sheetSize?: number;
  padding?: number;
  gridSize?: number;
  variant?: EmojiSpriteSheetVariant;
  fallbackNative?: boolean;
  source?: EmojiSpriteSheetSource;
  version?: string;
  packageName?: string;
  basePath?: string;
  cache?: EmojiSpriteSheetCacheConfig;
}

export interface EmojiPickerLabels {
  searchPlaceholder: string;
  noResultsTitle: string;
  noResultsBody: string;
  recents: string;
  custom: string;
  skinToneButton: string;
  clearSearch: string;
}

export interface EmojiLocaleEmojiTranslation {
  name: string;
  keywords: string[];
}

export interface EmojiLocaleDefinition {
  code: EmojiLocaleCode;
  labels: EmojiPickerLabels;
  categories: Record<EmojiCategoryId, string>;
  skinTones: Record<EmojiSkinTone, string>;
  emoji: Record<string, EmojiLocaleEmojiTranslation>;
}

export interface EmojiRenderState {
  active: boolean;
  selected: boolean;
  skinTone: EmojiSkinTone;
  size: number;
}

export interface EmojiPickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  defaultSearchQuery?: string;
  emojiSize?: number;
  columns?: number;
  showPreview?: boolean;
  showRecents?: boolean;
  showSkinTones?: boolean;
  recentLimit?: number;
  recentStorageKey?: string;
  skinToneStorageKey?: string;
  locale?: EmojiLocaleCode;
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>;
  defaultSkinTone?: EmojiSkinTone;
  labels?: Partial<EmojiPickerLabels>;
  spriteSheet?: EmojiSpriteSheetConfig;
  customEmojis?: CustomEmoji[];
  emptyState?: ReactNode;
  renderEmoji?: (
    emoji: EmojiRenderable,
    state: EmojiRenderState,
  ) => ReactNode;
  renderPreview?: (
    emoji: EmojiRenderable,
    selection: EmojiSelection,
  ) => ReactNode;
  onEmojiSelect?: (emoji: EmojiSelection) => void;
  style?: CSSProperties;
}

export interface EmojiCategoryMeta {
  id: EmojiCategoryId;
  label: string;
  icon: string;
}

export interface RecentEmojiRecord {
  id: string;
  custom: boolean;
  skinTone: EmojiSkinTone;
  count: number;
  usedAt: number;
}
