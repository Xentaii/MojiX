import generatedFrenchEmoji from '../../core/generated/emoji-locale.fr.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const frenchEmojiPack = generatedFrenchEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default frenchEmojiPack;
export { frenchEmojiPack };
