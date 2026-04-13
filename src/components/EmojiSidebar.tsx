import type {
  EmojiCategoryId,
  EmojiPickerClassNames,
  EmojiPickerStyles,
  EmojiSection,
} from '../lib/types';
import { getSlotClassName, getSlotStyle } from './utils';

export interface EmojiSidebarProps {
  sections: EmojiSection[];
  activeCategory: EmojiCategoryId;
  onCategoryClick: (id: EmojiCategoryId) => void;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiSidebar({
  sections,
  activeCategory,
  onCategoryClick,
  unstyled,
  classNames,
  styles,
}: EmojiSidebarProps) {
  const slotOptions = { unstyled, classNames, styles };

  return (
    <div
      className={getSlotClassName('sidebar', slotOptions)}
      style={getSlotStyle('sidebar', slotOptions)}
      aria-label="Emoji categories"
      data-mx-slot="sidebar"
    >
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={getSlotClassName(
            'navButton',
            slotOptions,
            !unstyled && activeCategory === section.id && 'is-active',
          )}
          style={getSlotStyle('navButton', slotOptions)}
          onClick={() => onCategoryClick(section.id)}
          aria-label={section.label}
          title={section.label}
          data-mx-slot="navButton"
          data-active={
            activeCategory === section.id ? 'true' : undefined
          }
          data-category-id={section.id}
        >
          <span aria-hidden="true">{section.icon}</span>
        </button>
      ))}
    </div>
  );
}
