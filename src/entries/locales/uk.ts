import generatedUkrainianEmoji from '../../core/generated/emoji-locale.uk.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const ukrainianEmojiPack = generatedUkrainianEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default ukrainianEmojiPack;
export { ukrainianEmojiPack };
