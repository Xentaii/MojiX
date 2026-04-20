import generatedGermanEmoji from '../../core/generated/emoji-locale.de.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const germanEmojiPack = generatedGermanEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default germanEmojiPack;
export { germanEmojiPack };
