import generatedGermanEmoji from '../../core/generated/emoji-locale.de.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const germanEmojiPack = generatedGermanEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('de', germanEmojiPack);
