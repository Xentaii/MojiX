import { describe, expect, it } from 'vitest';
import {
  emojiPickerLocales,
  registerEmojiLocalePack,
  resolveLocaleDefinition,
} from '../src/core/i18n';

describe('registerEmojiLocalePack', () => {
  it('seeds an empty built-in locale with a translation pack', () => {
    expect(emojiPickerLocales.ru).toBeDefined();
    expect(Object.keys(emojiPickerLocales.ru.emoji)).toHaveLength(0);

    registerEmojiLocalePack('ru', {
      '1f600': { name: 'Улыбающееся лицо', keywords: ['смайл'] },
    });

    const definition = resolveLocaleDefinition('ru');
    expect(definition.emoji['1f600']?.name).toBe('Улыбающееся лицо');
  });

  it('creates a new locale entry when the code is unknown', () => {
    registerEmojiLocalePack('de', {
      '1f600': { name: 'Grinsendes Gesicht', keywords: [] },
    });

    expect(emojiPickerLocales.de).toBeDefined();
    expect(emojiPickerLocales.de.emoji['1f600']?.name).toBe('Grinsendes Gesicht');
  });
});
