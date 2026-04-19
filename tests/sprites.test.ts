import { describe, expect, it } from 'vitest';
import { getSpriteStyle } from '../src/core/sprites';

describe('sprite style helpers', () => {
  it('renders scaled sprite tiles with percentage-based sprite positioning', () => {
    expect(
      getSpriteStyle({
        sheetX: 2,
        sheetY: 3,
        renderSize: 22,
        spriteSheet: {
          sheetSize: 64,
          padding: 1,
          gridSize: 64,
          source: 'custom',
          url: 'https://example.com/emoji.png',
        },
      }),
    ).toMatchObject({
      width: '22px',
      height: '22px',
      backgroundSize: '6600% 6600%',
      backgroundPosition:
        '3.1971153846153846% 4.783653846153846%',
    });
  });

  it('matches emoji-mart style math when the spritesheet has no padding', () => {
    expect(
      getSpriteStyle({
        sheetX: 2,
        sheetY: 3,
        renderSize: 22,
        spriteSheet: {
          sheetSize: 64,
          padding: 0,
          gridSize: 64,
          source: 'custom',
          url: 'https://example.com/emoji.png',
        },
      }),
    ).toMatchObject({
      backgroundSize: '6400% 6400%',
      backgroundPosition:
        '3.1746031746031744% 4.761904761904762%',
    });
  });
});
