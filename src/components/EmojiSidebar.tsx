import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type {
  EmojiCategoryIconRenderProps,
  EmojiCategoryId,
  EmojiPickerClassNames,
  EmojiPickerStyles,
  EmojiSection,
  EmojiSpriteSheetConfig,
} from '../core/types';
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
  resolveCategoryHoverColor?: (categoryId: EmojiCategoryId) => string | undefined;
  autoScrollOnHover?: boolean;
}

const AUTOSCROLL_EDGE_PX = 48;
const AUTOSCROLL_MAX_SPEED = 14;

export function EmojiSidebar({
  sections,
  activeCategory,
  onCategoryClick,
  renderCategoryIcon,
  spriteSheet,
  unstyled,
  classNames,
  styles,
  resolveCategoryHoverColor,
  autoScrollOnHover = true,
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

  useEffect(() => {
    if (!autoScrollOnHover) {
      return;
    }
    const container = sidebarRef.current;
    if (!container) {
      return;
    }

    let cursorX: number | null = null;
    let rafId = 0;

    const loop = () => {
      if (cursorX !== null) {
        const overflow = container.scrollWidth - container.clientWidth;
        if (overflow > 1) {
          const rect = container.getBoundingClientRect();
          const fromLeft = cursorX - rect.left;
          const fromRight = rect.right - cursorX;

          if (fromLeft >= 0 && fromLeft < AUTOSCROLL_EDGE_PX) {
            container.scrollLeft -=
              AUTOSCROLL_MAX_SPEED * (1 - fromLeft / AUTOSCROLL_EDGE_PX);
          } else if (fromRight >= 0 && fromRight < AUTOSCROLL_EDGE_PX) {
            container.scrollLeft +=
              AUTOSCROLL_MAX_SPEED * (1 - fromRight / AUTOSCROLL_EDGE_PX);
          }
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    const onMove = (event: MouseEvent) => {
      cursorX = event.clientX;
    };
    const onLeave = () => {
      cursorX = null;
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, [autoScrollOnHover]);

  return (
    <div
      ref={sidebarRef}
      className={getSlotClassName('sidebar', slotOptions)}
      style={getSlotStyle('sidebar', slotOptions)}
      aria-label="Emoji categories"
      data-mx-slot="sidebar"
    >
      {sections.map((section) => {
        const hoverColor = resolveCategoryHoverColor?.(section.id);
        const buttonStyle = getSlotStyle(
          'navButton',
          slotOptions,
          hoverColor
            ? ({ ['--mx-category-hover']: hoverColor } as CSSProperties)
            : undefined,
        );

        return (
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
            style={buttonStyle}
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
        );
      })}
    </div>
  );
}
