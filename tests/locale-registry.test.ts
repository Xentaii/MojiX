import { describe, expect, it } from 'vitest';
import {
  emojiPickerLocales,
  getLocalizedEmojiName,
  getLocalizedEmojiKeywords,
  preloadEmojiLocaleSearchIndex,
  registerEmojiLocalePack,
  resolveLocaleDefinition,
} from '../src/core/i18n';
import type { EmojiRenderable } from '../src/core/types';

describe('registerEmojiLocalePack', () => {
  it('seeds an empty built-in locale with a translation pack', () => {
    expect(emojiPickerLocales.ru).toBeUndefined();

    registerEmojiLocalePack('ru', {
      '1f600': { name: 'Улыбающееся лицо', keywords: ['смайл'] },
    });

    expect(emojiPickerLocales.ru).toBeDefined();

    const definition = resolveLocaleDefinition('ru');
    expect(definition.emoji['1f600']?.name).toBe('Улыбающееся лицо');
  });

  it('routes inline keywords from legacy packs into the search index', () => {
    const definition = resolveLocaleDefinition('ru');
    const fakeEmoji = {
      kind: 'unicode',
      id: '1f600',
    } as unknown as EmojiRenderable;

    expect(getLocalizedEmojiKeywords(fakeEmoji, definition)).toEqual([
      'смайл',
    ]);
  });

  it('computes regional flag names when locale packs omit them', () => {
    const definition = resolveLocaleDefinition('ru');
    const fakeEmoji = {
      kind: 'unicode',
      id: '1f1f7-1f1fa',
      name: 'Flag: Russia',
    } as unknown as EmojiRenderable;

    expect(getLocalizedEmojiName(fakeEmoji, definition)).toBe(
      '\u0424\u043b\u0430\u0433: \u0440\u043e\u0441\u0441\u0438\u044f',
    );
  });

  it('preloadEmojiLocaleSearchIndex registers keywords without a pack', () => {
    preloadEmojiLocaleSearchIndex('uk', { '1f600': ['усмішка'] });

    const definition = resolveLocaleDefinition('uk');
    const fakeEmoji = {
      kind: 'unicode',
      id: '1f600',
    } as unknown as EmojiRenderable;

    expect(getLocalizedEmojiKeywords(fakeEmoji, definition)).toEqual([
      'усмішка',
    ]);
  });

  it('creates a new locale entry when the code is unknown', () => {
    registerEmojiLocalePack('de', {
      '1f600': { name: 'Grinsendes Gesicht' },
    });

    expect(emojiPickerLocales.de).toBeDefined();
    expect(emojiPickerLocales.de?.emoji['1f600']?.name).toBe('Grinsendes Gesicht');
  });
});
