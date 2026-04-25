import { describe, expect, it } from 'vitest';
import * as headless from '../src/entries/headless';

describe('headless entry', () => {
  it('exports root and hooks without the styled picker preset', () => {
    expect(headless.MojiX.Root).toBeTypeOf('function');
    expect(headless.MojiXRoot).toBeTypeOf('function');
    expect(headless.useMojiX).toBeTypeOf('function');
    expect(headless.useEmojiSearch).toBeTypeOf('function');
    expect(headless.useEmojiCategories).toBeTypeOf('function');
    expect(
      (headless as typeof headless & { EmojiPicker?: unknown }).EmojiPicker,
    ).toBeUndefined();
  });
});
