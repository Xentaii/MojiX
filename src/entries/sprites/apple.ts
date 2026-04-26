import { createEmojiCdnSpriteSheet } from '../../core/sprites';
import availability from '../../core/generated/availability.apple.json';

const appleSprites = createEmojiCdnSpriteSheet({
  vendor: 'apple',
  availability,
});

export default appleSprites;
