import generatedEnglishEmoji from '../../core/generated/emoji-locale.en.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const englishEmojiPack = generatedEnglishEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default englishEmojiPack;
export { englishEmojiPack };
