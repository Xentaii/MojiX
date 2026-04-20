import generatedJapaneseEmoji from '../../core/generated/emoji-locale.ja.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const japaneseEmojiPack = generatedJapaneseEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default japaneseEmojiPack;
export { japaneseEmojiPack };
