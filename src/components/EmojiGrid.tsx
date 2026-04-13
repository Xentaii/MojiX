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
  EmojiCategoryId,
  EmojiLocaleDefinition,
  EmojiPickerLabels,
  EmojiRenderable,
  EmojiRenderState,
  EmojiSection,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { EmojiSprite } from './EmojiSprite';
import { createClassName, formatEmojiName } from './utils';

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
  localeDefinition,
  renderEmoji,
  onEmojiSelect,
  onEmojiHover,
  onActiveCategoryChange,
  hoveredEmojiId,
  emptyState,
  labels,
}: EmojiGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const gridHeights = useRef<Record<string, number>>({});
  const [visibleSections, setVisibleSections] = useState<Set<string> | null>(
    null,
  );

  // Stable callback refs to avoid effect re-runs
  const onActiveCategoryChangeRef = useRef(onActiveCategoryChange);
  onActiveCategoryChangeRef.current = onActiveCategoryChange;

  // Reset virtualization when sections change (search, filter)
  const prevSectionsRef = useRef(sections);
  if (sections !== prevSectionsRef.current) {
    prevSectionsRef.current = sections;
    if (visibleSections !== null) {
      setVisibleSections(null);
    }
  }

  // Expose scrollToCategory to parent
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

  // Track active category via scroll position
  useEffect(() => {
    const container = scrollRef.current;
    const firstSection = sections[0];
    if (!container || !firstSection) return;

    function updateActiveCategory() {
      const threshold = container!.scrollTop + 72;
      let nextCategory = firstSection!.id;

      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element && element.offsetTop <= threshold) {
          nextCategory = section.id;
        }
      }

      onActiveCategoryChangeRef.current(nextCategory);
    }

    updateActiveCategory();
    container.addEventListener('scroll', updateActiveCategory, {
      passive: true,
    });
    return () =>
      container.removeEventListener('scroll', updateActiveCategory);
  }, [sections]);

  // Section virtualization via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Measure currently rendered grids before virtualizing
    for (const section of sections) {
      const el = sectionRefs.current[section.id];
      if (el) {
        const grid = el.querySelector('.mx-picker__grid');
        if (grid) {
          gridHeights.current[section.id] = grid.clientHeight;
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const next = new Set(prev ?? sections.map((s) => s.id));
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

  // Keyboard navigation with roving tabindex
  function handleKeyDown(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('mx-picker__emoji')) return;

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
            nextIndex =
              (sections[nextSection]?.emojis.length ?? 1) - 1;
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
    if (nextIndex < 0 || nextIndex >= targetSection.emojis.length)
      return;

    const container = scrollRef.current;
    if (!container) return;

    // Update roving tabindex
    const prev = container.querySelector(
      '.mx-picker__emoji[tabindex="0"]',
    );
    if (prev) prev.setAttribute('tabindex', '-1');

    const next = container.querySelector(
      `.mx-picker__emoji[data-section="${nextSection}"][data-index="${nextIndex}"]`,
    ) as HTMLButtonElement | null;

    if (next) {
      next.setAttribute('tabindex', '0');
      next.focus();
    }
  }

  function handleEmojiFocus(
    event: React.FocusEvent,
    emoji: EmojiRenderable,
  ) {
    const container = scrollRef.current;
    if (!container) return;

    const prev = container.querySelector(
      '.mx-picker__emoji[tabindex="0"]',
    );
    if (prev && prev !== event.currentTarget) {
      prev.setAttribute('tabindex', '-1');
    }
    event.currentTarget.setAttribute('tabindex', '0');
    onEmojiHover(emoji);
  }

  return (
    <div
      className="mx-picker__content"
      ref={scrollRef}
      onKeyDown={handleKeyDown}
    >
      {sections.length === 0 && (
        <div className="mx-picker__empty">
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
            className="mx-picker__section"
            data-section-id={section.id}
            ref={(node) => {
              sectionRefs.current[section.id] = node;
            }}
          >
            <header className="mx-picker__section-header">
              <span
                className="mx-picker__section-icon"
                aria-hidden="true"
              >
                {section.icon}
              </span>
              <strong>{section.label}</strong>
              <span>{section.emojis.length}</span>
            </header>

            {visible ? (
              <div
                className="mx-picker__grid"
                role="grid"
                aria-label={section.label}
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

                  return (
                    <button
                      key={`${section.id}:${emoji.id}`}
                      type="button"
                      role="gridcell"
                      className={createClassName(
                        'mx-picker__emoji',
                        selected && 'is-selected',
                      )}
                      data-section={sectionIndex}
                      data-index={emojiIndex}
                      tabIndex={isFirstEmoji ? 0 : -1}
                      onClick={() => onEmojiSelect(emoji)}
                      onMouseEnter={() => onEmojiHover(emoji)}
                      onMouseLeave={() => onEmojiHover(null)}
                      onFocus={(e) => handleEmojiFocus(e, emoji)}
                      onBlur={() => onEmojiHover(null)}
                      title={formatEmojiName(
                        getLocalizedEmojiName(
                          emoji,
                          localeDefinition,
                        ),
                      )}
                      aria-label={formatEmojiName(
                        getLocalizedEmojiName(
                          emoji,
                          localeDefinition,
                        ),
                      )}
                    >
                      {renderEmoji?.(emoji, {
                        active: hoveredEmojiId === emoji.id,
                        selected,
                        skinTone,
                        size: emojiSize,
                      }) ?? (
                        <EmojiSprite
                          emoji={emoji}
                          size={emojiSize}
                          skinTone={skinTone}
                          spriteSheet={spriteSheet}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="mx-picker__grid-placeholder"
                style={{
                  height: `${estimateGridHeight(section.id, section.emojis.length)}px`,
                }}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
