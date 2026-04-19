import generatedUkrainianEmoji from '../../core/generated/emoji-locale.uk.json';
import { registerEmojiLocalePack } from '../../core/i18n';
import type { EmojiLocaleEmojiTranslation } from '../../core/types';

export const ukrainianEmojiPack = generatedUkrainianEmoji as Record<
  string,
  EmojiLocaleEmojiTranslation
>;

registerEmojiLocalePack('uk', ukrainianEmojiPack);
