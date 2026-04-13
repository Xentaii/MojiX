import './components/EmojiPicker.css';

export { EmojiPicker } from './components/EmojiPicker';
export { EmojiSprite } from './components/EmojiSprite';
export {
  createEmojiSpriteSheet,
  createEmojiCdnSpriteSheet,
  createEmojiCdnUrl,
  createEmojiLocalSpriteSheet,
  createEmojiLocalUrl,
  defaultSpriteSheet,
  resolveVendorPackageName,
} from './lib/sprites';
export {
  createBrowserSpriteSheetCacheAdapter,
  warmEmojiSpriteSheet,
} from './lib/sprite-cache';
export {
  emojiPickerLocales,
  getLocalizedCategoryLabel,
  getLocalizedEmojiKeywords,
  getLocalizedEmojiName,
  getLocalizedSkinToneLabel,
  resolveLocaleDefinition,
} from './lib/i18n';
export { getUnicodeEmojiData } from './lib/data';
export type {
  CustomEmoji,
  EmojiCategoryId,
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiLocaleEmojiTranslation,
  EmojiPickerProps,
  EmojiRenderState,
  EmojiRenderable,
  EmojiSelection,
  EmojiSkinTone,
  EmojiSpriteSheetCacheAdapter,
  EmojiSpriteSheetCacheConfig,
  EmojiSpriteSheetCacheMode,
  EmojiSpriteSheetCachedAsset,
  EmojiSpriteSheetCacheRequest,
  EmojiSpriteSheetConfig,
  EmojiSpriteSheetContext,
  EmojiSpriteSheetSource,
  EmojiSpriteSheetVariant,
  EmojiVendor,
  UnicodeEmoji,
} from './lib/types';
