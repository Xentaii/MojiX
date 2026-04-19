import { describe, expect, it } from 'vitest';
import '../src/entries/locales/de';
import '../src/entries/locales/es';
import '../src/entries/locales/fr';
import '../src/entries/locales/ja';
import '../src/entries/locales/pt';
import '../src/entries/locales/uk';
import { emojiPickerLocales, resolveLocaleDefinition } from '../src/index';

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
    expect(emojiPickerLocales.de?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.es?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.fr?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.ja?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.pt?.emoji['1f600']?.name).toBeTruthy();
    expect(emojiPickerLocales.uk?.emoji['1f600']?.name).toBeTruthy();
  });
});
