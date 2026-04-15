import generatedRussianEmoji from '../../core/generated/emoji-locale.ru.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const russianEmojiPack = generatedRussianEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('ru', russianEmojiPack);
