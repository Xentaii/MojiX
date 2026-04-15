import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { getLocalizedEmojiName } from '../core/i18n';
import type {
  EmojiAssetSource,
  EmojiCategoryIconRenderProps,
  EmojiCategoryId,
  EmojiLocaleDefinition,
  EmojiPickerClassNames,
  EmojiPickerLabels,
  EmojiPickerStyles,
  EmojiRenderable,
  EmojiRenderState,
  EmojiSection,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
} from '../core/types';
import { EmojiCategoryIcon } from './EmojiCategoryIcon';
import { EmojiSprite } from './EmojiSprite';
import {
  formatEmojiName,
  getSlotClassName,
  getSlotStyle,
} from './utils';

export interface EmojiGridHandle {
  scrollToCategory: (id: EmojiCategoryId) => void;
}

export interface EmojiGridProps {
  ref?: Ref<EmojiGridHandle>;
  sections: EmojiSection[];
  emojiSize: number;
  columns: number;
  skinTone: EmojiSkinTone;
  value?: string;
  spriteSheet: EmojiSpriteSheetConfig;
  assetSource?: EmojiAssetSource;
  localeDefinition: EmojiLocaleDefinition;
  renderEmoji?: (
    emoji: EmojiRenderable,
    state: EmojiRenderState,
  ) => ReactNode;
  renderCategoryIcon?: (
    props: EmojiCategoryIconRenderProps,
  ) => ReactNode;
  onEmojiSelect: (emoji: EmojiRenderable) => void;
  onEmojiHover: (emoji: EmojiRenderable | null) => void;
  onActiveCategoryChange: (id: EmojiCategoryId) => void;
  hoveredEmojiId: string | null;
  emptyState?: ReactNode;
  hideEmptyState?: boolean;
  labels: EmojiPickerLabels;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
  resolveEmojiHoverColor?: (
    emoji: EmojiRenderable,
    state: EmojiRenderState,
  ) => string | undefined;
}

function getContainerPaddingTop(container: HTMLDivElement) {
  return Number.parseFloat(window.getComputedStyle(container).paddingTop) || 0;
}

function getScrollBehavior() {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'auto' as const;
  }

  return 'smooth' as const;
}

function getSectionScrollTop(
  container: HTMLDivElement,
  section: HTMLElement,
) {
  const containerRect = container.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();
  const paddingTop = getContainerPaddingTop(container);

  return Math.max(
    container.scrollTop + sectionRect.top - containerRect.top - paddingTop,
    0,
  );
}

export function EmojiGrid({
  ref,
  sections,
  emojiSize,
  columns,
  skinTone,
  value,
  spriteSheet,
  assetSource,
  localeDefinition,
  renderEmoji,
  renderCategoryIcon,
  onEmojiSelect,
  onEmojiHover,
  onActiveCategoryChange,
  hoveredEmojiId,
  emptyState,
  hideEmptyState,
  labels,
  unstyled,
  classNames,
  styles,
  resolveEmojiHoverColor,
}: EmojiGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const pendingCategoryScrollRef = useRef<{
    id: EmojiCategoryId;
    top: number;
  } | null>(null);
  const slotOptions = { unstyled, classNames, styles };
  const hasRenderableEmoji = sections.some(
    (section) => section.emojis.length > 0,
  );
  const firstFocusableSectionIndex = sections.findIndex(
    (section) => section.emojis.length > 0,
  );

  const onActiveCategoryChangeRef = useRef(onActiveCategoryChange);
  onActiveCategoryChangeRef.current = onActiveCategoryChange;

  const scrollToCategory = useCallback((id: EmojiCategoryId) => {
    const container = scrollRef.current;
    const target = sectionRefs.current[id];
    if (!container || !target) {
      return;
    }

    const nextTop = getSectionScrollTop(container, target);
    pendingCategoryScrollRef.current = {
      id,
      top: nextTop,
    };
    const behavior = getScrollBehavior();
    container.scrollTo({ top: nextTop, behavior });

    requestAnimationFrame(() => {
      const nextContainer = scrollRef.current;
      const nextTarget = sectionRefs.current[id];
      if (!nextContainer || !nextTarget) {
        return;
      }

      const settledTop = getSectionScrollTop(nextContainer, nextTarget);
      if (Math.abs(nextContainer.scrollTop - settledTop) <= 1) {
        return;
      }

      pendingCategoryScrollRef.current = {
        id,
        top: settledTop,
      };
      nextContainer.scrollTo({ top: settledTop, behavior });
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToCategory,
    }),
    [scrollToCategory],
  );

  useEffect(() => {
    const container = scrollRef.current;
    const firstSection = sections[0];
    if (!container || !firstSection) {
      return;
    }

    const activeContainer = container;
    const initialCategory = firstSection.id;

    function updateActiveCategory() {
      const pendingScroll = pendingCategoryScrollRef.current;

      if (pendingScroll) {
        if (
          Math.abs(activeContainer.scrollTop - pendingScroll.top) <= 2
        ) {
          pendingCategoryScrollRef.current = null;
        }

        onActiveCategoryChangeRef.current(pendingScroll.id);
        return;
      }

      const containerRect = activeContainer.getBoundingClientRect();
      const paddingTop = getContainerPaddingTop(activeContainer);
      const threshold = containerRect.top + paddingTop + 48;
      let nextCategory = initialCategory;

      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (!element) {
          continue;
        }

        if (element.getBoundingClientRect().top <= threshold) {
          nextCategory = section.id;
          continue;
        }

        break;
      }

      onActiveCategoryChangeRef.current(nextCategory);
    }

    updateActiveCategory();
    activeContainer.addEventListener('scroll', updateActiveCategory, {
      passive: true,
    });
    window.addEventListener('resize', updateActiveCategory);

    return () => {
      activeContainer.removeEventListener('scroll', updateActiveCategory);
      window.removeEventListener('resize', updateActiveCategory);
    };
  }, [sections]);

  function handleKeyDown(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.dataset.mxSlot !== 'emoji') return;

    const sectionIdx = Number(target.dataset.section);
    const emojiIdx = Number(target.dataset.index);
    if (isNaN(sectionIdx) || isNaN(emojiIdx)) return;

    const currentSection = sections[sectionIdx];
    if (!currentSection) return;

    let nextSection = sectionIdx;
    let nextIndex = emojiIdx;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = emojiIdx + 1;
        if (nextIndex >= currentSection.emojis.length) {
          nextSection = sectionIdx + 1;
          nextIndex = 0;
        }
        break;
      case 'ArrowLeft':
        nextIndex = emojiIdx - 1;
        if (nextIndex < 0) {
          nextSection = sectionIdx - 1;
          if (nextSection >= 0) {
            nextIndex = (sections[nextSection]?.emojis.length ?? 1) - 1;
          }
        }
        break;
      case 'ArrowDown':
        nextIndex = emojiIdx + columns;
        if (nextIndex >= currentSection.emojis.length) {
          nextSection = sectionIdx + 1;
          const nextSec = sections[nextSection];
          if (nextSec) {
            nextIndex = Math.min(
              emojiIdx % columns,
              nextSec.emojis.length - 1,
            );
          }
        }
        break;
      case 'ArrowUp':
        nextIndex = emojiIdx - columns;
        if (nextIndex < 0) {
          nextSection = sectionIdx - 1;
          const prevSec = sections[nextSection];
          if (prevSec) {
            const prevLength = prevSec.emojis.length;
            const lastRowStart =
              Math.floor((prevLength - 1) / columns) * columns;
            nextIndex = Math.min(
              lastRowStart + (emojiIdx % columns),
              prevLength - 1,
            );
          }
        }
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = currentSection.emojis.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        target.click();
        return;
      default:
        return;
    }

    event.preventDefault();

    const targetSection = sections[nextSection];
    if (!targetSection) return;
    if (nextSection < 0 || nextSection >= sections.length) return;
    if (nextIndex < 0 || nextIndex >= targetSection.emojis.length) return;

    const container = scrollRef.current;
    if (!container) return;

    const prev = container.querySelector(
      '[data-mx-slot="emoji"][tabindex="0"]',
    );
    if (prev instanceof HTMLElement) {
      prev.setAttribute('tabindex', '-1');
    }

    const next = container.querySelector(
      `[data-mx-slot="emoji"][data-section="${nextSection}"][data-index="${nextIndex}"]`,
    ) as HTMLButtonElement | null;

    if (next) {
      next.setAttribute('tabindex', '0');
      next.focus();
    }
  }

  function handleEmojiFocus(
    event: React.FocusEvent<HTMLButtonElement>,
    emoji: EmojiRenderable,
  ) {
    const container = scrollRef.current;
    if (!container) return;

    const prev = container.querySelector(
      '[data-mx-slot="emoji"][tabindex="0"]',
    );
    if (prev instanceof HTMLElement && prev !== event.currentTarget) {
      prev.setAttribute('tabindex', '-1');
    }
    event.currentTarget.setAttribute('tabindex', '0');
    onEmojiHover(emoji);
  }

  return (
    <div
      className={getSlotClassName('content', slotOptions)}
      style={getSlotStyle('content', slotOptions)}
      ref={scrollRef}
      onKeyDown={handleKeyDown}
      data-mx-slot="content"
    >
      {!hasRenderableEmoji && !hideEmptyState && (
        <div
          className={getSlotClassName('empty', slotOptions)}
          style={getSlotStyle('empty', slotOptions)}
          data-mx-slot="empty"
        >
          {emptyState ?? (
            <>
              <strong>{labels.noResultsTitle}</strong>
              <span>{labels.noResultsBody}</span>
            </>
          )}
        </div>
      )}

      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          className={getSlotClassName('section', slotOptions)}
          style={getSlotStyle('section', slotOptions)}
          data-category-id={section.id}
          data-mx-slot="section"
          ref={(node) => {
            sectionRefs.current[section.id] = node;
          }}
        >
          <header
            className={getSlotClassName('sectionHeader', slotOptions)}
            style={getSlotStyle('sectionHeader', slotOptions)}
            data-mx-slot="sectionHeader"
          >
            <span
              className={getSlotClassName('sectionIcon', slotOptions)}
              style={getSlotStyle('sectionIcon', slotOptions)}
              aria-hidden="true"
              data-mx-slot="sectionIcon"
            >
              {renderCategoryIcon?.({
                categoryId: section.id,
                label: section.label,
                icon: section.icon,
                context: 'section',
                size: 15,
                active: false,
                spriteSheet,
              }) ?? (
                <EmojiCategoryIcon
                  icon={section.icon}
                  label={section.label}
                  size={15}
                  spriteSheet={spriteSheet}
                />
              )}
            </span>
            <strong>{section.label}</strong>
            <span>{section.emojis.length}</span>
          </header>

          <div
            className={getSlotClassName('grid', slotOptions)}
            style={getSlotStyle('grid', slotOptions)}
            role="grid"
            aria-label={section.label}
            data-mx-slot="grid"
          >
            {section.emojis.map((emoji, emojiIndex) => {
              const selected = value === emoji.id;
              const isFirstEmoji =
                sectionIndex === firstFocusableSectionIndex &&
                emojiIndex === 0;
              const emojiKey = `${section.id}:${emoji.id}`;
              const active = hoveredKey
                ? hoveredKey === emojiKey
                : hoveredEmojiId === emoji.id;
              const renderState: EmojiRenderState = {
                active,
                selected,
                skinTone,
                size: emojiSize,
              };
              const displayName = formatEmojiName(
                getLocalizedEmojiName(emoji, localeDefinition),
              );
              const hoverColor = resolveEmojiHoverColor?.(
                emoji,
                renderState,
              );
              const buttonStyle = getSlotStyle(
                'emoji',
                slotOptions,
                hoverColor
                  ? ({ ['--mx-emoji-hover']: hoverColor } as CSSProperties)
                  : undefined,
              );

              return (
                <button
                  key={`${section.id}:${emoji.id}`}
                  type="button"
                  role="gridcell"
                  className={getSlotClassName('emoji', slotOptions)}
                  style={buttonStyle}
                  data-section={sectionIndex}
                  data-index={emojiIndex}
                  data-category-id={section.id}
                  data-mx-slot="emoji"
                  data-active={active ? 'true' : undefined}
                  data-selected={selected ? 'true' : undefined}
                  tabIndex={isFirstEmoji ? 0 : -1}
                  onClick={() => onEmojiSelect(emoji)}
                  onMouseEnter={() => {
                    setHoveredKey(emojiKey);
                    onEmojiHover(emoji);
                  }}
                  onMouseLeave={() => {
                    setHoveredKey((current) =>
                      current === emojiKey ? null : current,
                    );
                    onEmojiHover(null);
                  }}
                  onFocus={(event) => {
                    setHoveredKey(emojiKey);
                    handleEmojiFocus(event, emoji);
                  }}
                  onBlur={() => {
                    setHoveredKey((current) =>
                      current === emojiKey ? null : current,
                    );
                    onEmojiHover(null);
                  }}
                  title={displayName}
                  aria-label={displayName}
                >
                  {renderEmoji?.(emoji, renderState) ?? (
                    <EmojiSprite
                      emoji={emoji}
                      size={emojiSize}
                      skinTone={skinTone}
                      spriteSheet={spriteSheet}
                      assetSource={assetSource}
                      assetContext="grid"
                      title={displayName}
                      alt={displayName}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
