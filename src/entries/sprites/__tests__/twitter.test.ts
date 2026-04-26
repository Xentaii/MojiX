import { describe, expect, it } from 'vitest';
import twitterSprites from '../twitter';

describe('twitter sprite preset entry', () => {
  it('exports a twitter CDN sprite-sheet preset', () => {
    expect(twitterSprites.vendor).toBe('twitter');
    expect(twitterSprites.source).toBe('cdn');
    expect(twitterSprites.availability).toEqual([]);
    expect(typeof twitterSprites.url).toBe('string');
    expect(String(twitterSprites.url)).toContain('cdn.jsdelivr.net');
  });
});
