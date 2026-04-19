import generatedPortugueseEmoji from '../../core/generated/emoji-locale.pt.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const portugueseEmojiPack = generatedPortugueseEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('pt', portugueseEmojiPack);
