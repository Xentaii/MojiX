import { describe, expect, it } from 'vitest';
import deLocale from '../src/entries/locales/de';
import esLocale from '../src/entries/locales/es';
import frLocale from '../src/entries/locales/fr';
import jaLocale from '../src/entries/locales/ja';
import ptLocale from '../src/entries/locales/pt';
import ukLocale from '../src/entries/locales/uk';
import {
  emojiPickerLocales,
  getLocalizedEmojiName,
  registerEmojiLocalePack,
  resolveLocaleDefinition,
} from '../src/index';
import type { EmojiRenderable } from '../src/index';

describe('expanded locales', () => {
  it('ships additional chrome locales out of the box', () => {
    expect(resolveLocaleDefinition('de').labels.searchPlaceholder).toContain(
      'Emoji',
    );
    expect(resolveLocaleDefinition('es').categories.flags).toBe('Banderas');
    expect(resolveLocaleDefinition('fr').skinTones.dark).toBe('Foncé');
    expect(resolveLocaleDefinition('ja').labels.custom).toBe('カスタム');
    expect(resolveLocaleDefinition('pt').categories.people).toBe('Pessoas');
    expect(resolveLocaleDefinition('uk').categories.objects).toBe('Обʼєкти');
  });

  it('registers generated emoji translation packs for the new locales', () => {
    registerEmojiLocalePack('de', deLocale);
    registerEmojiLocalePack('es', esLocale);
    registerEmojiLocalePack('fr', frLocale);
    registerEmojiLocalePack('ja', jaLocale);
    registerEmojiLocalePack('pt', ptLocale);
    registerEmojiLocalePack('uk', ukLocale);

    expect(emojiPickerLocales.de?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.es?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.fr?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.ja?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.pt?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.uk?.emoji['1f600']?.name).toBeTruthy();
  });

  it('falls back to the base English name for omitted locale deltas', () => {
    expect(deLocale['1f933']).toBeUndefined();

    registerEmojiLocalePack('de', deLocale);

    const definition = resolveLocaleDefinition('de');
    const fakeEmoji = {
      kind: 'unicode',
      id: '1f933',
      name: 'Selfie',
    } as unknown as EmojiRenderable;

    expect(getLocalizedEmojiName(fakeEmoji, definition)).toBe('Selfie');
  });
});
