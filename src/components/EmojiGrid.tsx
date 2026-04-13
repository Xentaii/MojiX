import {
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { getLocalizedEmojiName } from '../lib/i18n';
import type {
  EmojiAssetSource,
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
} from '../lib/types';
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
  onEmojiSelect: (emoji: EmojiRenderable) => void;
  onEmojiHover: (emoji: EmojiRenderable | null) => void;
  onActiveCategoryChange: (id: EmojiCategoryId) => void;
  hoveredEmojiId: string | null;
  emptyState?: ReactNode;
  labels: EmojiPickerLabels;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

const OBSERVER_ROOT_MARGIN = '400px 0px';
const ROW_HEIGHT_ESTIMATE = 52;

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
  onEmojiSelect,
  onEmojiHover,
  onActiveCategoryChange,
  hoveredEmojiId,
  emptyState,
  labels,
  unstyled,
  classNames,
  styles,
}: EmojiGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const gridHeights = useRef<Record<string, number>>({});
  const [visibleSections, setVisibleSections] = useState<Set<string> | null>(
    null,
  );
  const slotOptions = { unstyled, classNames, styles };

  const onActiveCategoryChangeRef = useRef(onActiveCategoryChange);
  onActiveCategoryChangeRef.current = onActiveCategoryChange;

  const prevSectionsRef = useRef(sections);
  if (sections !== prevSectionsRef.current) {
    prevSectionsRef.current = sections;
    if (visibleSections !== null) {
      setVisibleSections(null);
    }
  }

  useImperativeHandle(ref, () => ({
    scrollToCategory(id: EmojiCategoryId) {
      const container = scrollRef.current;
      const target = sectionRefs.current[id];
      if (!container || !target) return;
      container.scrollTo({
        top: target.offsetTop - 12,
        behavior: 'smooth',
      });
    },
  }));

  useEffect(() => {
    const container = scrollRef.current;
    const firstSection = sections[0];
    if (!container || !firstSection) return;

    const activeContainer = container;
    const initialSection = firstSection;

    function updateActiveCategory() {
      const threshold = activeContainer.scrollTop + 72;
      let nextCategory = initialSection.id;

      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element && element.offsetTop <= threshold) {
          nextCategory = section.id;
        }
      }

      onActiveCategoryChangeRef.current(nextCategory);
    }

    updateActiveCategory();
    activeContainer.addEventListener('scroll', updateActiveCategory, {
      passive: true,
    });
    return () =>
      activeContainer.removeEventListener('scroll', updateActiveCategory);
  }, [sections]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    for (const section of sections) {
      const el = sectionRefs.current[section.id];
      if (el) {
        const grid = el.querySelector('[data-mx-slot="grid"]');
        if (grid instanceof HTMLElement) {
          gridHeights.current[section.id] = grid.clientHeight;
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const next = new Set(prev ?? sections.map((section) => section.id));
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.sectionId;
            if (!id) continue;
            if (entry.isIntersecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
          }
          return next;
        });
      },
      { root: container, rootMargin: OBSERVER_ROOT_MARGIN },
    );

    for (const section of sections) {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const isSectionVisible = (id: string) =>
    visibleSections === null || visibleSections.has(id);

  const estimateGridHeight = useCallback(
    (sectionId: string, emojiCount: number) => {
      if (gridHeights.current[sectionId]) {
        return gridHeights.current[sectionId];
      }
      return Math.ceil(emojiCount / columns) * ROW_HEIGHT_ESTIMATE;
    },
    [columns],
  );

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
      {sections.length === 0 && (
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

      {sections.map((section, sectionIndex) => {
        const visible = isSectionVisible(section.id);

        return (
          <section
            key={section.id}
            className={getSlotClassName('section', slotOptions)}
            style={getSlotStyle('section', slotOptions)}
            data-section-id={section.id}
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
                {section.icon}
              </span>
              <strong>{section.label}</strong>
              <span>{section.emojis.length}</span>
            </header>

            {visible ? (
              <div
                className={getSlotClassName('grid', slotOptions)}
                style={getSlotStyle('grid', slotOptions)}
                role="grid"
                aria-label={section.label}
                data-mx-slot="grid"
                ref={(node) => {
                  if (node) {
                    gridHeights.current[section.id] = node.clientHeight;
                  }
                }}
              >
                {section.emojis.map((emoji, emojiIndex) => {
                  const selected = value === emoji.id;
                  const isFirstEmoji =
                    sectionIndex === 0 && emojiIndex === 0;
                  const active = hoveredEmojiId === emoji.id;

                  return (
                    <button
                      key={`${section.id}:${emoji.id}`}
                      type="button"
                      role="gridcell"
                      className={getSlotClassName(
                        'emoji',
                        slotOptions,
                        !unstyled && selected && 'is-selected',
                      )}
                      style={getSlotStyle('emoji', slotOptions)}
                      data-section={sectionIndex}
                      data-index={emojiIndex}
                      data-category-id={section.id}
                      data-mx-slot="emoji"
                      data-active={active ? 'true' : undefined}
                      data-selected={selected ? 'true' : undefined}
                      tabIndex={isFirstEmoji ? 0 : -1}
                      onClick={() => onEmojiSelect(emoji)}
                      onMouseEnter={() => onEmojiHover(emoji)}
                      onMouseLeave={() => onEmojiHover(null)}
                      onFocus={(event) => handleEmojiFocus(event, emoji)}
                      onBlur={() => onEmojiHover(null)}
                      title={formatEmojiName(
                        getLocalizedEmojiName(emoji, localeDefinition),
                      )}
                      aria-label={formatEmojiName(
                        getLocalizedEmojiName(emoji, localeDefinition),
                      )}
                    >
                      {renderEmoji?.(emoji, {
                        active,
                        selected,
                        skinTone,
                        size: emojiSize,
                      }) ?? (
                        <EmojiSprite
                          emoji={emoji}
                          size={emojiSize}
                          skinTone={skinTone}
                          spriteSheet={spriteSheet}
                          assetSource={assetSource}
                          assetContext="grid"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className={getSlotClassName('gridPlaceholder', slotOptions)}
                style={getSlotStyle(
                  'gridPlaceholder',
                  slotOptions,
                  {
                    height: `${estimateGridHeight(
                      section.id,
                      section.emojis.length,
                    )}px`,
                  },
                )}
                data-mx-slot="gridPlaceholder"
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
