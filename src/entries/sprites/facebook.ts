import availability from '../../core/generated/availability.facebook.json';
import { createEmojiCdnSpriteSheet } from '../../core/sprites';

const facebookSprites = createEmojiCdnSpriteSheet({
  vendor: 'facebook',
  availability,
});

export default facebookSprites;
