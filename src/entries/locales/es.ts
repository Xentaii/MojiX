import generatedSpanishEmoji from '../../core/generated/emoji-locale.es.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const spanishEmojiPack = generatedSpanishEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('es', spanishEmojiPack);
