import generatedSpanishEmoji from '../../core/generated/emoji-locale.es.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const spanishEmojiPack = generatedSpanishEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default spanishEmojiPack;
export { spanishEmojiPack };
