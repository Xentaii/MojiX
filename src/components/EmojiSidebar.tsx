import { useEffect, useRef, type ReactNode } from 'react';
import type {
  EmojiCategoryIconRenderProps,
  EmojiCategoryId,
  EmojiPickerClassNames,
  EmojiPickerStyles,
  EmojiSection,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { EmojiCategoryIcon } from './EmojiCategoryIcon';
import { getSlotClassName, getSlotStyle } from './utils';

export interface EmojiSidebarProps {
  sections: EmojiSection[];
  activeCategory: EmojiCategoryId;
  onCategoryClick: (id: EmojiCategoryId) => void;
  renderCategoryIcon?: (props: EmojiCategoryIconRenderProps) => ReactNode;
  spriteSheet?: EmojiSpriteSheetConfig;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiSidebar({
  sections,
  activeCategory,
  onCategoryClick,
  renderCategoryIcon,
  spriteSheet,
  unstyled,
  classNames,
  styles,
}: EmojiSidebarProps) {
  const slotOptions = { unstyled, classNames, styles };
  const sidebarRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const container = sidebarRef.current;
    const target = buttonRefs.current[activeCategory];
    if (!container || !target) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (targetRect.left < containerRect.left) {
      container.scrollBy({
        left: targetRect.left - containerRect.left - 12,
        behavior: 'smooth',
      });
    } else if (targetRect.right > containerRect.right) {
      container.scrollBy({
        left: targetRect.right - containerRect.right + 12,
        behavior: 'smooth',
      });
    }
  }, [activeCategory]);

  return (
    <div
      ref={sidebarRef}
      className={getSlotClassName('sidebar', slotOptions)}
      style={getSlotStyle('sidebar', slotOptions)}
      aria-label="Emoji categories"
      data-mx-slot="sidebar"
    >
      {sections.map((section) => (
        <button
          key={section.id}
          ref={(node) => {
            buttonRefs.current[section.id] = node;
          }}
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
          {renderCategoryIcon?.({
            categoryId: section.id,
            label: section.label,
            icon: section.icon,
            context: 'sidebar',
            size: 18,
            active: activeCategory === section.id,
            spriteSheet,
          }) ?? (
            <EmojiCategoryIcon
              icon={section.icon}
              label={section.label}
              spriteSheet={spriteSheet}
            />
          )}
        </button>
      ))}
    </div>
  );
}
