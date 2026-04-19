import generatedFrenchEmoji from '../../core/generated/emoji-locale.fr.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const frenchEmojiPack = generatedFrenchEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('fr', frenchEmojiPack);
