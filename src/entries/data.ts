import type { EmojiDataPayload } from '../core/data';
import rawEmojiData from '../core/generated/emoji-data.json';

const emojiData = rawEmojiData as EmojiDataPayload;

export default emojiData;
