import generatedEnglishEmoji from '../../core/generated/emoji-locale.en.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const englishEmojiPack = generatedEnglishEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('en', englishEmojiPack);
