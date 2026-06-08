import availability from '../../core/generated/availability.google.json';
import { createEmojiCdnSpriteSheet } from '../../core/sprites';

const googleSprites = createEmojiCdnSpriteSheet({
  vendor: 'google',
  availability,
});

export default googleSprites;
