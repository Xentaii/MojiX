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

export type EmojiAssetRenderContext = 'grid' | 'preview';

export interface EmojiAssetRequest {
  emoji: EmojiRenderable;
  skinTone: EmojiSkinTone;
  context: EmojiAssetRenderContext;
  spriteSheet?: EmojiSpriteSheetConfig;
}

export interface EmojiNativeAsset {
  kind: 'native';
  native: string;
}

export interface EmojiSpriteAsset {
  kind: 'sprite';
  sheetX: number;
  sheetY: number;
  spriteSheet?: EmojiSpriteSheetConfig;
  sheetUrl?: string;
  sheetSize?: number;
  padding?: number;
  gridSize?: number;
}

export interface EmojiImageAsset {
  kind: 'image';
  src: string;
  alt?: string;
}

export interface EmojiSvgAsset {
  kind: 'svg';
  src: string;
  alt?: string;
}

export type EmojiResolvedAsset =
  | EmojiNativeAsset
  | EmojiSpriteAsset
  | EmojiImageAsset
  | EmojiSvgAsset;

export interface EmojiImageAssetSource {
  type: 'image';
  resolveUrl: (
    request: EmojiAssetRequest,
  ) => string | null | undefined;
}

export interface EmojiSvgAssetSource {
  type: 'svg';
  resolveUrl: (
    request: EmojiAssetRequest,
  ) => string | null | undefined;
}

export interface EmojiNativeAssetSource {
  type: 'native';
}

export interface EmojiSpriteSheetAssetSource {
  type: 'spriteSheet';
  spriteSheet?: EmojiSpriteSheetConfig;
}

export interface EmojiMixedAssetSource {
  type: 'mixed';
  unicode?: EmojiAssetSource;
  custom?: EmojiAssetSource;
  fallback?: EmojiAssetSource;
}

export type EmojiAssetSource =
  | EmojiImageAssetSource
  | EmojiSvgAssetSource
  | EmojiNativeAssetSource
  | EmojiSpriteSheetAssetSource
  | EmojiMixedAssetSource;

export type EmojiPickerSlot =
  | 'root'
  | 'panel'
  | 'toolbar'
  | 'search'
  | 'searchIcon'
  | 'searchInput'
  | 'searchClear'
  | 'tonePicker'
  | 'toneButton'
  | 'toneMenu'
  | 'toneOption'
  | 'content'
  | 'section'
  | 'sectionHeader'
  | 'sectionIcon'
  | 'grid'
  | 'gridPlaceholder'
  | 'emoji'
  | 'preview'
  | 'previewCard'
  | 'previewCopy'
  | 'previewHeading'
  | 'previewSubline'
  | 'previewMeta'
  | 'chip'
  | 'chipMuted'
  | 'empty'
  | 'sidebar'
  | 'navButton';

export type EmojiPickerClassNames = Partial<
  Record<EmojiPickerSlot, string>
>;

export type EmojiPickerStyles = Partial<
  Record<EmojiPickerSlot, CSSProperties>
>;

export interface EmojiPickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  searchQuery?: string;
  defaultSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
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
  skinTone?: EmojiSkinTone;
  defaultSkinTone?: EmojiSkinTone;
  onSkinToneChange?: (tone: EmojiSkinTone) => void;
  labels?: Partial<EmojiPickerLabels>;
  spriteSheet?: EmojiSpriteSheetConfig;
  assetSource?: EmojiAssetSource;
  gridAssetSource?: EmojiAssetSource;
  previewAssetSource?: EmojiAssetSource;
  customEmojis?: CustomEmoji[];
  emptyState?: ReactNode;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
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

export interface EmojiSection {
  id: EmojiCategoryId;
  label: string;
  icon: string;
  emojis: EmojiRenderable[];
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
