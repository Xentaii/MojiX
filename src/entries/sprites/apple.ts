import availability from '../../core/generated/availability.apple.json';
import { createEmojiCdnSpriteSheet } from '../../core/sprites';

const appleSprites = createEmojiCdnSpriteSheet({
  vendor: 'apple',
  availability,
});

export default appleSprites;
