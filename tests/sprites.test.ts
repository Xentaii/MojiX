import { describe, expect, it } from 'vitest';
import {
  createEmojiSpriteSheet,
  createEmojiCdnUrl,
  createEmojiLocalSpriteSheet,
} from '../src/core/sprites';

describe('sprite presets', () => {
  it('builds a CDN spritesheet config with the expected vendor + variant', () => {
    const sheet = createEmojiSpriteSheet({
      source: 'cdn',
      vendor: 'twitter',
      sheetSize: 64,
      variant: 'indexed-256',
    });

    expect(sheet.vendor).toBe('twitter');
    expect(sheet.sheetSize).toBe(64);
    expect(sheet.variant).toBe('indexed-256');
  });

  it('builds a local spritesheet config pointing at a file', () => {
    const sheet = createEmojiLocalSpriteSheet('/sprites/twitter/sheets-256/64.png', {
      vendor: 'twitter',
      sheetSize: 64,
      variant: 'indexed-256',
    });

    expect(sheet.vendor).toBe('twitter');
    expect(sheet.sheetSize).toBe(64);
  });

  it('createEmojiCdnUrl returns a jsdelivr URL', () => {
    const url = createEmojiCdnUrl({
      vendor: 'twitter',
      sheetSize: 64,
      variant: 'indexed-256',
    });

    expect(url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\//);
    expect(url).toContain('emoji-datasource-twitter');
    expect(url).toContain('64.png');
  });
});
