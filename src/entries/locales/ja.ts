import generatedJapaneseEmoji from '../../core/generated/emoji-locale.ja.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const japaneseEmojiPack = generatedJapaneseEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('ja', japaneseEmojiPack);
