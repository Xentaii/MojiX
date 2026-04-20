import generatedRussianEmoji from '../../core/generated/emoji-locale.ru.json';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

const russianEmojiPack = generatedRussianEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

export default russianEmojiPack;
export { russianEmojiPack };
