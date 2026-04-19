import { describe, expect, it } from 'vitest';
import * as api from '../src/index';

describe('public API surface', () => {
  it('exports the default EmojiPicker preset', () => {
    expect(api.EmojiPicker).toBeTypeOf('function');
  });

  it('exports the headless MojiX namespace with core primitives', () => {
    expect(api.MojiX).toBeDefined();
    expect(api.MojiX.Root).toBeTypeOf('function');
    expect(api.MojiX.Search).toBeTypeOf('function');
    expect(api.MojiX.List).toBeTypeOf('function');
    expect(api.MojiX.Viewport).toBeTypeOf('function');
  });

  it('exports hooks', () => {
    expect(api.useMojiX).toBeTypeOf('function');
    expect(api.useEmojiSearch).toBeTypeOf('function');
    expect(api.useEmojiCategories).toBeTypeOf('function');
  });

  it('exports asset source factories', () => {
    expect(api.createNativeAssetSource).toBeTypeOf('function');
    expect(api.createSpriteSheetAssetSource).toBeTypeOf('function');
    expect(api.createImageAssetSource).toBeTypeOf('function');
    expect(api.createSvgAssetSource).toBeTypeOf('function');
    expect(api.createMixedAssetSource).toBeTypeOf('function');
  });

  it('exports sprite helpers', () => {
    expect(api.createEmojiSpriteSheet).toBeTypeOf('function');
    expect(api.createEmojiCdnUrl).toBeTypeOf('function');
    expect(api.createEmojiLocalSpriteSheet).toBeTypeOf('function');
    expect(api.defaultSpriteSheet).toBeDefined();
  });

  it('exports i18n helpers', () => {
    expect(api.emojiPickerLocales).toBeDefined();
    expect(api.resolveLocaleDefinition).toBeTypeOf('function');
  });

  it('exports the engine layer', () => {
    expect(api.createEmojiIndex).toBeTypeOf('function');
    expect(api.searchEmoji).toBeTypeOf('function');
    expect(api.resolveEmojiSelection).toBeTypeOf('function');
    expect(api.createRecentEmojiStore).toBeTypeOf('function');
    expect(api.createSkinToneStore).toBeTypeOf('function');
  });

  it('createEmojiIndex search returns ranked results', () => {
    const index = api.createEmojiIndex();
    const hits = index.search('smile');
    expect(Array.isArray(hits)).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });

  it('createRecentEmojiStore works without DOM (memory adapter fallback)', () => {
    const recents = api.createRecentEmojiStore({
      adapter: {
        read: () => [],
        write: () => undefined,
      },
    });
    const pushed = recents.push(
      { id: 'abc', custom: false, skinTone: 'default' },
      5,
    );
    expect(pushed).toHaveLength(1);
    expect(pushed[0]?.id).toBe('abc');
  });
});
