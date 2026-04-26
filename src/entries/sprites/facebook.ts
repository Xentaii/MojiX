import { createEmojiCdnSpriteSheet } from '../../core/sprites';
import availability from '../../core/generated/availability.facebook.json';

const facebookSprites = createEmojiCdnSpriteSheet({
  vendor: 'facebook',
  availability,
});

export default facebookSprites;
