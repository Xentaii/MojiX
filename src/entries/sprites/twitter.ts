import { createEmojiCdnSpriteSheet } from '../../core/sprites';
import availability from '../../core/generated/availability.twitter.json';

const twitterSprites = createEmojiCdnSpriteSheet({
  vendor: 'twitter',
  availability,
});

export default twitterSprites;
