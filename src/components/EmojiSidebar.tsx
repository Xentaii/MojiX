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
  const pointerActivatedCategoryRef = useRef<EmojiCategoryId | null>(null);

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

    const stopLoop = () => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const loop = () => {
      rafId = 0;
      if (cursorX === null) {
        return;
      }

      const overflow = container.scrollWidth - container.clientWidth;
      if (overflow <= 1) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const fromLeft = cursorX - rect.left;
      const fromRight = rect.right - cursorX;

      let delta = 0;
      if (fromLeft >= 0 && fromLeft < AUTOSCROLL_EDGE_PX) {
        delta = -AUTOSCROLL_MAX_SPEED * (1 - fromLeft / AUTOSCROLL_EDGE_PX);
      } else if (fromRight >= 0 && fromRight < AUTOSCROLL_EDGE_PX) {
        delta = AUTOSCROLL_MAX_SPEED * (1 - fromRight / AUTOSCROLL_EDGE_PX);
      }

      if (delta === 0) {
        return;
      }

      container.scrollLeft += delta;
      rafId = requestAnimationFrame(loop);
    };

    const ensureLoop = () => {
      if (cursorX === null || rafId !== 0) {
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    const onMove = (event: MouseEvent) => {
      cursorX = event.clientX;
      ensureLoop();
    };

    const onLeave = () => {
      cursorX = null;
      stopLoop();
    };

    const onWheel = (event: WheelEvent) => {
      const overflow = container.scrollWidth - container.clientWidth;
      if (overflow > 1 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        container.scrollLeft += event.deltaY;
      }
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      stopLoop();
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      container.removeEventListener('wheel', onWheel);
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
            onPointerDown={(event) => {
              if (
                (event.pointerType === 'mouse' || event.pointerType === 'pen') &&
                event.button === 0
              ) {
                pointerActivatedCategoryRef.current = section.id;
                onCategoryClick(section.id);
              }
            }}
            onClick={(event) => {
              if (
                pointerActivatedCategoryRef.current === section.id &&
                event.detail > 0
              ) {
                pointerActivatedCategoryRef.current = null;
                return;
              }

              pointerActivatedCategoryRef.current = null;
              onCategoryClick(section.id);
            }}
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
