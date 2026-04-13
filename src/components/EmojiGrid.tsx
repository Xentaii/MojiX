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

  return (
    <div className="mx-picker__content" ref={scrollRef}>
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
                role="list"
                aria-label={section.label}
                ref={(node) => {
                  if (node) {
                    gridHeights.current[section.id] = node.clientHeight;
                  }
                }}
              >
                {section.emojis.map((emoji) => {
                  const selected = value === emoji.id;

                  return (
                    <button
                      key={`${section.id}:${emoji.id}`}
                      type="button"
                      role="listitem"
                      className={createClassName(
                        'mx-picker__emoji',
                        selected && 'is-selected',
                      )}
                      onClick={() => onEmojiSelect(emoji)}
                      onMouseEnter={() => onEmojiHover(emoji)}
                      onMouseLeave={() => onEmojiHover(null)}
                      onFocus={() => onEmojiHover(emoji)}
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
