import {
  type CSSProperties,
  useCallback,
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
  EmojiSection,
  EmojiSkinTone,
  PreparedCustomEmoji,
  RecentEmojiRecord,
} from '../lib/types';
import { EmojiGrid, type EmojiGridHandle } from './EmojiGrid';
import { EmojiPreview } from './EmojiPreview';
import { EmojiSidebar } from './EmojiSidebar';
import { EmojiToolbar } from './EmojiToolbar';
import { createClassName } from './utils';

function resolveRecentEmoji(
  recent: RecentEmojiRecord,
  customEmojiById: Map<string, PreparedCustomEmoji>,
) {
  if (recent.custom) {
    return customEmojiById.get(recent.id) ?? null;
  }

  return getUnicodeEmojiById(recent.id) ?? null;
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
  const [activeCategory, setActiveCategory] =
    useState<EmojiCategoryId>('smileys');
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiRenderable | null>(
    null,
  );
  const [runtimeSpriteUrl, setRuntimeSpriteUrl] = useState<string | null>(
    null,
  );

  const searchId = useId();
  const gridRef = useRef<EmojiGridHandle>(null);

  // Load persisted state
  useEffect(() => {
    setRecentEmoji(readRecentEmoji(recentStorageKey));
  }, [recentStorageKey]);

  useEffect(() => {
    setSkinTone(readStoredSkinTone(skinToneStorageKey, defaultSkinTone));
  }, [defaultSkinTone, skinToneStorageKey]);

  // Sprite sheet cache warming
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

        if (!asset.cached) return;

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
        ? { ...resolvedSpriteSheet, url: runtimeSpriteUrl }
        : resolvedSpriteSheet,
    [resolvedSpriteSheet, runtimeSpriteUrl],
  );

  // Build sections
  const recentSectionEmojis = useMemo(() => {
    if (!showRecents) return [] as EmojiRenderable[];

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
      if (categoryId === 'recent' || categoryId === 'custom') continue;

      const categoryMeta = CATEGORY_META[categoryId];
      const categoryEmoji = getUnicodeEmojiByCategory(categoryId);
      const visibleEmoji = filterEmoji(
        categoryEmoji,
        deferredSearchQuery,
        (emoji) => getLocalizedSearchTokens(emoji, localeDefinition),
      );

      if (visibleEmoji.length === 0) continue;

      nextSections.push({
        ...categoryMeta,
        label: getLocalizedCategoryLabel(categoryId, localeDefinition),
        emojis: visibleEmoji,
      });
    }

    if (preparedCustomEmojis.length > 0) {
      const filteredCustom = filterEmoji(
        preparedCustomEmojis,
        deferredSearchQuery,
      );

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

  // Sync active category when sections change
  useEffect(() => {
    if (sections.length === 0) return;

    const firstSection = sections[0];
    if (
      firstSection &&
      !sections.some((section) => section.id === activeCategory)
    ) {
      setActiveCategory(firstSection.id);
    }
  }, [activeCategory, sections]);

  // Handlers
  const handleActiveCategoryChange = useCallback(
    (id: EmojiCategoryId) => {
      setActiveCategory((current) => (current === id ? current : id));
    },
    [],
  );

  const handleEmojiHover = useCallback(
    (emoji: EmojiRenderable | null) => {
      setHoveredEmoji(emoji);
    },
    [],
  );

  function handleSelectEmoji(emoji: EmojiRenderable) {
    const selection = createEmojiSelection(
      emoji,
      skinTone,
      localeDefinition,
    );

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

  function handleSkinToneChange(nextSkinTone: EmojiSkinTone) {
    setSkinTone(nextSkinTone);
    writeStoredSkinTone(skinToneStorageKey, nextSkinTone);
  }

  function handleCategoryClick(categoryId: EmojiCategoryId) {
    setActiveCategory(categoryId);
    gridRef.current?.scrollToCategory(categoryId);
  }

  // Preview
  const previewEmoji =
    hoveredEmoji ??
    sections.find((section) => section.id === activeCategory)?.emojis[0] ??
    sections[0]?.emojis[0] ??
    null;

  const previewSelection = previewEmoji
    ? createEmojiSelection(previewEmoji, skinTone, localeDefinition)
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
        <EmojiToolbar
          searchId={searchId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          skinTone={skinTone}
          onSkinToneChange={handleSkinToneChange}
          showSkinTones={showSkinTones}
          labels={labelSet}
          localeDefinition={localeDefinition}
        />

        <EmojiGrid
          ref={gridRef}
          sections={sections}
          emojiSize={emojiSize}
          columns={columns}
          skinTone={skinTone}
          value={value}
          spriteSheet={activeSpriteSheet}
          localeDefinition={localeDefinition}
          renderEmoji={renderEmoji}
          onEmojiSelect={handleSelectEmoji}
          onEmojiHover={handleEmojiHover}
          onActiveCategoryChange={handleActiveCategoryChange}
          hoveredEmojiId={hoveredEmoji?.id ?? null}
          emptyState={emptyState}
          labels={labelSet}
        />

        {showPreview && (
          <EmojiPreview
            emoji={previewEmoji}
            selection={previewSelection}
            spriteSheet={activeSpriteSheet}
            renderPreview={renderPreview}
          />
        )}
      </div>

      <EmojiSidebar
        sections={sections}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />
    </div>
  );
}
