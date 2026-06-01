import availability from '../../core/generated/availability.twitter.json';
import { createEmojiCdnSpriteSheet } from '../../core/sprites';

const twitterSprites = createEmojiCdnSpriteSheet({
  vendor: 'twitter',
  availability,
});

export default twitterSprites;
