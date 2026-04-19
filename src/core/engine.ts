import { createEmojiSelection } from './data';
import { resolveLocaleDefinition } from './i18n';
import type {
  EmojiLocaleCode,
  EmojiLocaleDefinition,
  EmojiRenderable,
  EmojiSelection,
  EmojiSkinTone,
} from './types';

export interface ResolveEmojiSelectionOptions {
  skinTone?: EmojiSkinTone;
  localeDefinition?: EmojiLocaleDefinition;
  locale?: EmojiLocaleCode;
  fallbackLocale?: EmojiLocaleCode | EmojiLocaleCode[];
  locales?: Partial<Record<string, Partial<EmojiLocaleDefinition>>>;
  categoryLabel?: string;
}

export function resolveEmojiSelection(
  emoji: EmojiRenderable,
  options: ResolveEmojiSelectionOptions = {},
): EmojiSelection {
  const localeDefinition =
    options.localeDefinition ??
    resolveLocaleDefinition(
      options.locale,
      options.locales,
      options.fallbackLocale,
    );

  return createEmojiSelection(
    emoji,
    options.skinTone ?? 'default',
    localeDefinition,
    { categoryLabel: options.categoryLabel },
  );
}
