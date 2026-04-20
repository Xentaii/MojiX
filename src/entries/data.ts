import rawEmojiData from '../core/generated/emoji-data.json';
import type { UnicodeEmoji } from '../core/types';

type UnicodeEmojiRecord = Omit<
  UnicodeEmoji,
  'kind' | 'searchTokens' | 'categoryLabel'
>;

const emojiData = rawEmojiData as UnicodeEmojiRecord[];

export default emojiData;
