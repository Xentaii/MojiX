import type {
  EmojiLocaleCategoryLabels,
  EmojiLocaleDefinition,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../../types';

export function createChromeLocaleDefinition(options: {
  code: EmojiLocaleDefinition['code'];
  labels: EmojiPickerLabels;
  categories: EmojiLocaleCategoryLabels;
  skinTones: Record<EmojiSkinTone, string>;
}): EmojiLocaleDefinition {
  return {
    code: options.code,
    labels: options.labels,
    categories: options.categories,
    skinTones: options.skinTones,
    emoji: {},
  };
}
