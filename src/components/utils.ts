import type { CSSProperties } from 'react';
import type {
  EmojiPickerClassNames,
  EmojiPickerSlot,
  EmojiPickerStyles,
} from '../lib/types';

const SLOT_CLASS_NAMES: Record<EmojiPickerSlot, string[]> = {
  root: ['mx-picker'],
  panel: ['mx-picker__panel'],
  toolbar: ['mx-picker__toolbar'],
  search: ['mx-picker__search'],
  searchIcon: ['mx-picker__search-icon'],
  searchInput: ['mx-picker__search-input'],
  searchClear: ['mx-picker__search-clear'],
  tonePicker: ['mx-picker__tone-picker'],
  toneButton: ['mx-picker__tone-button'],
  toneMenu: ['mx-picker__tone-menu'],
  toneOption: ['mx-picker__tone-option'],
  content: ['mx-picker__content'],
  section: ['mx-picker__section'],
  sectionHeader: ['mx-picker__section-header'],
  sectionIcon: ['mx-picker__section-icon'],
  grid: ['mx-picker__grid'],
  gridPlaceholder: ['mx-picker__grid-placeholder'],
  emoji: ['mx-picker__emoji'],
  preview: ['mx-picker__preview'],
  previewCard: ['mx-picker__preview-card'],
  previewCopy: ['mx-picker__preview-copy'],
  previewHeading: ['mx-picker__preview-heading'],
  previewSubline: ['mx-picker__preview-subline'],
  previewMeta: ['mx-picker__preview-meta'],
  chip: ['mx-picker__chip'],
  chipMuted: ['mx-picker__chip', 'mx-picker__chip--muted'],
  empty: ['mx-picker__empty'],
  sidebar: ['mx-picker__sidebar'],
  navButton: ['mx-picker__nav-button'],
};

export interface SlotStyleOptions {
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function createClassName(
  ...values: Array<string | undefined | false>
) {
  return values.filter(Boolean).join(' ');
}

export function getSlotClassName(
  slot: EmojiPickerSlot,
  options?: SlotStyleOptions,
  ...values: Array<string | undefined | false>
) {
  const defaultClasses = options?.unstyled ? [] : SLOT_CLASS_NAMES[slot];

  return createClassName(
    ...defaultClasses,
    options?.classNames?.[slot],
    ...values,
  );
}

export function getSlotStyle(
  slot: EmojiPickerSlot,
  options?: SlotStyleOptions,
  ...styles: Array<CSSProperties | undefined>
) {
  return Object.assign({}, options?.styles?.[slot], ...styles);
}

export function formatEmojiName(name: string) {
  if (name !== name.toUpperCase()) {
    return name.charAt(0).toLocaleUpperCase() + name.slice(1);
  }

  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
