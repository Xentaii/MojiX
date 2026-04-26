import {
  MojiXRoot,
  useActiveEmoji,
  useEmojiAssets,
  useEmojiCategories,
  useEmojiSearch,
  useEmojiSelection,
  useMojiX,
  useSkinTone,
} from '../components/MojiXRoot';

export {
  MojiXRoot,
  useActiveEmoji,
  useEmojiAssets,
  useEmojiCategories,
  useEmojiSearch,
  useEmojiSelection,
  useMojiX,
  useSkinTone,
} from '../components/MojiXRoot';

export const MojiX = {
  Root: MojiXRoot,
} as const;

export type {
  MojiXRootProps,
  UseEmojiAssetsResult,
} from '../components/MojiXRoot';
export type {
  EmojiAssetRenderContext,
  EmojiAssetRequest,
  EmojiAssetSource,
  EmojiCategoryConfig,
  EmojiCategoryIconConfig,
  EmojiCategoryIconGlyph,
  EmojiCategoryIconInput,
  EmojiCategoryIconPreset,
  EmojiCategoryId,
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiPickerColors,
  EmojiPickerProps,
  EmojiRecentCategoryConfig,
  EmojiRenderable,
  EmojiResolvedAsset,
  EmojiSearchConfigLike,
  EmojiSearchRankContext,
  EmojiSearchTokenizeContext,
  EmojiSelection,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
  EmojiVendor,
  EmojiVendorAvailability,
} from '../core/types';
