import generatedPortugueseEmoji from '../../core/generated/emoji-locale.pt.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const portugueseEmojiPack = generatedPortugueseEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default portugueseEmojiPack;
export { portugueseEmojiPack };
