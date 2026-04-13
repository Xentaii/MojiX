import {
  startTransition,
  type CSSProperties,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  DEFAULT_COLUMNS,
  DEFAULT_EMOJI_SIZE,
  DEFAULT_RECENT_LIMIT,
  DEFAULT_RECENT_STORAGE_KEY,
  DEFAULT_SKIN_TONE_STORAGE_KEY,
  SKIN_TONE_OPTIONS,
} from '../lib/constants';
import {
  createEmojiSelection,
  filterEmoji,
  getLocalizedSearchTokens,
  getUnicodeEmojiByCategory,
  getUnicodeEmojiById,
  prepareCustomEmojis,
} from '../lib/data';
import {
  getLocalizedCategoryLabel,
  getLocalizedEmojiName,
  getLocalizedSkinToneLabel,
  resolveLocaleDefinition,
} from '../lib/i18n';
import { warmEmojiSpriteSheet } from '../lib/sprite-cache';
import {
  defaultSpriteSheet,
  resolveSpriteSheetConfig,
} from '../lib/sprites';
import {
  pushRecentEmoji,
  readRecentEmoji,
  readStoredSkinTone,
  writeStoredSkinTone,
} from '../lib/storage';
import type {
  EmojiCategoryId,
  EmojiPickerProps,
  EmojiRenderable,
  EmojiSelection,
  EmojiSkinTone,
  PreparedCustomEmoji,
  RecentEmojiRecord,
} from '../lib/types';
import { EmojiSprite } from './EmojiSprite';

const SEARCH_ICON = String.fromCodePoint(0x2315);
const CLEAR_ICON = String.fromCodePoint(0x2715);

interface EmojiSection {
  id: EmojiCategoryId;
  label: string;
  icon: string;
  emojis: EmojiRenderable[];
}

function createClassName(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

function resolveRecentEmoji(
  recent: RecentEmojiRecord,
  customEmojiById: Map<string, PreparedCustomEmoji>,
) {
  if (recent.custom) {
    return customEmojiById.get(recent.id) ?? null;
  }

  return getUnicodeEmojiById(recent.id) ?? null;
}

function formatEmojiName(name: string) {
  if (name !== name.toUpperCase()) {
    return name.charAt(0).toLocaleUpperCase() + name.slice(1);
  }

  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function createDefaultPreview(
  emoji: EmojiRenderable,
  selection: EmojiSelection,
  spriteSheet = defaultSpriteSheet,
) {
  const displayName = formatEmojiName(selection.name);
  const aliases = selection.shortcodes
    .slice(0, 4)
    .map((shortcode) => `:${shortcode}:`);
  const primaryAlias = aliases[0];
  const secondaryAliases = aliases.slice(1, 3);

  return (
    <div className="mx-picker__preview-card">
      <EmojiSprite
        emoji={emoji}
        skinTone={selection.skinTone}
        size={30}
        spriteSheet={spriteSheet}
      />
      <div className="mx-picker__preview-copy">
        <div className="mx-picker__preview-heading">
          <strong>{displayName}</strong>
          {primaryAlias && <span className="mx-picker__chip">{primaryAlias}</span>}
        </div>
        <div className="mx-picker__preview-subline">
          <span>{selection.native ?? primaryAlias ?? displayName}</span>
          <span>{selection.categoryLabel}</span>
        </div>
        {(secondaryAliases.length > 0 || selection.emoticons.length > 0) && (
          <div className="mx-picker__preview-meta">
            {secondaryAliases.map((alias) => (
              <span key={alias} className="mx-picker__chip mx-picker__chip--muted">
                {alias}
              </span>
            ))}
            {selection.emoticons.slice(0, 2).map((emoticon) => (
              <span key={emoticon} className="mx-picker__chip mx-picker__chip--muted">
                {emoticon}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmojiPicker({
  value,
  defaultSearchQuery = '',
  emojiSize = DEFAULT_EMOJI_SIZE,
  columns = DEFAULT_COLUMNS,
  showPreview = true,
  showRecents = true,
  showSkinTones = true,
  recentLimit = DEFAULT_RECENT_LIMIT,
  recentStorageKey = DEFAULT_RECENT_STORAGE_KEY,
  skinToneStorageKey = DEFAULT_SKIN_TONE_STORAGE_KEY,
  locale = 'en',
  locales,
  defaultSkinTone = 'default',
  labels,
  spriteSheet = defaultSpriteSheet,
  customEmojis = [],
  emptyState,
  renderEmoji,
  renderPreview,
  onEmojiSelect,
  className,
  style,
  ...rest
}: EmojiPickerProps) {
  const resolvedSpriteSheet = useMemo(
    () => resolveSpriteSheetConfig(spriteSheet),
    [spriteSheet],
  );
  const localeDefinition = useMemo(
    () => resolveLocaleDefinition(locale, locales),
    [locale, locales],
  );
  const labelSet = { ...localeDefinition.labels, ...labels };
  const preparedCustomEmojis = useMemo(
    () => prepareCustomEmojis(customEmojis),
    [customEmojis],
  );
  const customEmojiById = useMemo(
    () => new Map(preparedCustomEmojis.map((emoji) => [emoji.id, emoji])),
    [preparedCustomEmojis],
  );
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [recentEmoji, setRecentEmoji] = useState<RecentEmojiRecord[]>([]);
  const [skinTone, setSkinTone] = useState<EmojiSkinTone>(defaultSkinTone);
  const [activeCategory, setActiveCategory] = useState<EmojiCategoryId>('smileys');
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiRenderable | null>(null);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const [runtimeSpriteUrl, setRuntimeSpriteUrl] = useState<string | null>(null);
  const searchId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const toneMenuRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setRecentEmoji(readRecentEmoji(recentStorageKey));
  }, [recentStorageKey]);

  useEffect(() => {
    setSkinTone(readStoredSkinTone(skinToneStorageKey, defaultSkinTone));
  }, [defaultSkinTone, skinToneStorageKey]);

  useEffect(() => {
    function handleDocumentPointerDown(event: MouseEvent) {
      if (!toneMenuRef.current?.contains(event.target as Node)) {
        setToneMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentPointerDown);
    return () =>
      document.removeEventListener('mousedown', handleDocumentPointerDown);
  }, []);

  useEffect(() => {
    let released = false;
    let releaseCachedAsset: (() => void) | undefined;

    setRuntimeSpriteUrl(null);

    if (
      !resolvedSpriteSheet.cache.enabled ||
      resolvedSpriteSheet.cache.preload !== 'mount'
    ) {
      return;
    }

    warmEmojiSpriteSheet(resolvedSpriteSheet)
      .then((asset) => {
        if (released) {
          asset.release?.();
          return;
        }

        if (!asset.cached) {
          return;
        }

        releaseCachedAsset = asset.release;
        setRuntimeSpriteUrl(asset.url);
      })
      .catch(() => {
        return;
      });

    return () => {
      released = true;
      releaseCachedAsset?.();
    };
  }, [resolvedSpriteSheet]);

  const activeSpriteSheet = useMemo(
    () =>
      runtimeSpriteUrl
        ? {
            ...resolvedSpriteSheet,
            url: runtimeSpriteUrl,
          }
        : resolvedSpriteSheet,
    [resolvedSpriteSheet, runtimeSpriteUrl],
  );

  const recentSectionEmojis = useMemo(() => {
    if (!showRecents) {
      return [] as EmojiRenderable[];
    }

    return recentEmoji
      .map((recent) => resolveRecentEmoji(recent, customEmojiById))
      .filter((emoji): emoji is EmojiRenderable => Boolean(emoji));
  }, [customEmojiById, recentEmoji, showRecents]);

  const sections = useMemo(() => {
    const nextSections: EmojiSection[] = [];

    if (showRecents && recentSectionEmojis.length > 0) {
      nextSections.push({
        ...CATEGORY_META.recent,
        label: getLocalizedCategoryLabel('recent', localeDefinition),
        emojis: filterEmoji(
          recentSectionEmojis,
          deferredSearchQuery,
          (emoji) => getLocalizedSearchTokens(emoji, localeDefinition),
        ),
      });
    }

    for (const categoryId of CATEGORY_ORDER) {
      if (categoryId === 'recent' || categoryId === 'custom') {
        continue;
      }

      const categoryMeta = CATEGORY_META[categoryId];
      const categoryEmoji = getUnicodeEmojiByCategory(categoryId);
      const visibleEmoji = filterEmoji(
        categoryEmoji,
        deferredSearchQuery,
        (emoji) => getLocalizedSearchTokens(emoji, localeDefinition),
      );

      if (visibleEmoji.length === 0) {
        continue;
      }

      nextSections.push({
        ...categoryMeta,
        label: getLocalizedCategoryLabel(categoryId, localeDefinition),
        emojis: visibleEmoji,
      });
    }

    if (preparedCustomEmojis.length > 0) {
      const filteredCustom = filterEmoji(preparedCustomEmojis, deferredSearchQuery);

      if (filteredCustom.length > 0) {
        nextSections.push({
          ...CATEGORY_META.custom,
          label: getLocalizedCategoryLabel('custom', localeDefinition),
          emojis: filteredCustom,
        });
      }
    }

    return nextSections;
  }, [
    deferredSearchQuery,
    localeDefinition,
    preparedCustomEmojis,
    recentSectionEmojis,
    showRecents,
  ]);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    const firstSection = sections[0];

    if (firstSection && !sections.some((section) => section.id === activeCategory)) {
      setActiveCategory(firstSection.id);
    }
  }, [activeCategory, sections]);

  useEffect(() => {
    const container = scrollRef.current;
    const firstSection = sections[0];

    if (!container || !firstSection) {
      return;
    }

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

      setActiveCategory((current) =>
        current === nextCategory ? current : nextCategory,
      );
    }

    updateActiveCategory();
    activeContainer.addEventListener('scroll', updateActiveCategory, {
      passive: true,
    });

    return () =>
      activeContainer.removeEventListener('scroll', updateActiveCategory);
  }, [sections]);

  const previewEmoji =
    hoveredEmoji ??
    sections.find((section) => section.id === activeCategory)?.emojis[0] ??
    sections[0]?.emojis[0] ??
    null;

  const previewSelection = previewEmoji
    ? createEmojiSelection(previewEmoji, skinTone, localeDefinition)
    : null;

  function handleSelectEmoji(emoji: EmojiRenderable) {
    const selection = createEmojiSelection(emoji, skinTone, localeDefinition);

    setHoveredEmoji(emoji);
    onEmojiSelect?.(selection);

    if (showRecents) {
      setRecentEmoji(
        pushRecentEmoji(
          recentStorageKey,
          {
            id: emoji.id,
            custom: emoji.kind === 'custom',
            skinTone,
          },
          recentLimit,
        ),
      );
    }
  }

  function handleCategoryClick(categoryId: EmojiCategoryId) {
    setActiveCategory(categoryId);

    const container = scrollRef.current;
    const target = sectionRefs.current[categoryId];

    if (!container || !target) {
      return;
    }

    container.scrollTo({
      top: target.offsetTop - 12,
      behavior: 'smooth',
    });
  }

  function handleSkinToneSelect(nextSkinTone: EmojiSkinTone) {
    setSkinTone(nextSkinTone);
    writeStoredSkinTone(skinToneStorageKey, nextSkinTone);
    setToneMenuOpen(false);
  }

  const renderPreviewContent =
    previewEmoji && previewSelection
      ? renderPreview?.(previewEmoji, previewSelection) ??
        createDefaultPreview(previewEmoji, previewSelection, activeSpriteSheet)
      : null;

  return (
    <div
      {...rest}
      className={createClassName('mx-picker', className)}
      style={
        {
          ...style,
          ['--mx-emoji-size' as string]: `${emojiSize}px`,
          ['--mx-columns' as string]: `${columns}`,
        } as CSSProperties
      }
    >
      <div className="mx-picker__panel">
        <div className="mx-picker__toolbar">
          <label className="mx-picker__search" htmlFor={searchId}>
            <span className="mx-picker__search-icon" aria-hidden="true">
              {SEARCH_ICON}
            </span>
            <input
              id={searchId}
              className="mx-picker__search-input"
              type="search"
              value={searchQuery}
              placeholder={labelSet.searchPlaceholder}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                startTransition(() => setSearchQuery(nextValue));
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="mx-picker__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label={labelSet.clearSearch}
                title={labelSet.clearSearch}
              >
                {CLEAR_ICON}
              </button>
            )}
          </label>

          {showSkinTones && (
            <div className="mx-picker__tone-picker" ref={toneMenuRef}>
              <button
                type="button"
                className={createClassName(
                  'mx-picker__tone-button',
                  toneMenuOpen && 'is-open',
                )}
                onClick={() => setToneMenuOpen((open) => !open)}
                aria-label={labelSet.skinToneButton}
                title={labelSet.skinToneButton}
              >
                <span aria-hidden="true">
                  {SKIN_TONE_OPTIONS.find((option) => option.tone === skinTone)?.icon}
                </span>
              </button>

              {toneMenuOpen && (
                <div className="mx-picker__tone-menu">
                  {SKIN_TONE_OPTIONS.map((option) => (
                    <button
                      key={option.tone}
                      type="button"
                      className={createClassName(
                        'mx-picker__tone-option',
                        option.tone === skinTone && 'is-active',
                      )}
                      onClick={() => handleSkinToneSelect(option.tone)}
                      title={getLocalizedSkinToneLabel(option.tone, localeDefinition)}
                    >
                      <span aria-hidden="true">{option.icon}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-picker__content" ref={scrollRef}>
          {sections.length === 0 && (
            <div className="mx-picker__empty">
              {emptyState ?? (
                <>
                  <strong>{labelSet.noResultsTitle}</strong>
                  <span>{labelSet.noResultsBody}</span>
                </>
              )}
            </div>
          )}

          {sections.map((section) => (
            <section
              key={section.id}
              className="mx-picker__section"
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
            >
              <header className="mx-picker__section-header">
                <span className="mx-picker__section-icon" aria-hidden="true">
                  {section.icon}
                </span>
                <strong>{section.label}</strong>
                <span>{section.emojis.length}</span>
              </header>

              <div className="mx-picker__grid" role="list" aria-label={section.label}>
                {section.emojis.map((emoji) => {
                  const selected = value === emoji.id;

                  return (
                    <button
                      key={`${section.id}:${emoji.id}`}
                      type="button"
                      className={createClassName(
                        'mx-picker__emoji',
                        selected && 'is-selected',
                      )}
                      onClick={() => handleSelectEmoji(emoji)}
                      onMouseEnter={() => setHoveredEmoji(emoji)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      onFocus={() => setHoveredEmoji(emoji)}
                      onBlur={() => setHoveredEmoji(null)}
                      title={formatEmojiName(getLocalizedEmojiName(emoji, localeDefinition))}
                      aria-label={formatEmojiName(
                        getLocalizedEmojiName(emoji, localeDefinition),
                      )}
                      role="listitem"
                    >
                      {renderEmoji?.(emoji, {
                        active: hoveredEmoji?.id === emoji.id,
                        selected,
                        skinTone,
                        size: emojiSize,
                      }) ?? (
                        <EmojiSprite
                          emoji={emoji}
                          size={emojiSize}
                          skinTone={skinTone}
                          spriteSheet={activeSpriteSheet}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {showPreview && renderPreviewContent && (
          <footer className="mx-picker__preview">{renderPreviewContent}</footer>
        )}
      </div>

      <div className="mx-picker__sidebar" aria-label="Emoji categories">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={createClassName(
              'mx-picker__nav-button',
              activeCategory === section.id && 'is-active',
            )}
            onClick={() => handleCategoryClick(section.id)}
            aria-label={section.label}
            title={section.label}
          >
            <span aria-hidden="true">{section.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
