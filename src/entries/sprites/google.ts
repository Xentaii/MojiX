import { createEmojiCdnSpriteSheet } from '../../core/sprites';
import availability from '../../core/generated/availability.google.json';

const googleSprites = createEmojiCdnSpriteSheet({
  vendor: 'google',
  availability,
});

export default googleSprites;
