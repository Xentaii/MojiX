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
import { getSlotClassName, getSlotStyle } from './utils';

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
  searchQuery: controlledSearchQuery,
  defaultSearchQuery = '',
  onSearchQueryChange,
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
  skinTone: controlledSkinTone,
  defaultSkinTone = 'default',
  onSkinToneChange,
  labels,
  spriteSheet = defaultSpriteSheet,
  customEmojis = [],
  emptyState,
  unstyled = false,
  classNames,
  styles,
  renderEmoji,
  renderPreview,
  onEmojiSelect,
  className,
  style,
  ...rest
}: EmojiPickerProps) {
  const slotOptions = { unstyled, classNames, styles };
  const isSearchControlled = controlledSearchQuery !== undefined;
  const isSkinToneControlled = controlledSkinTone !== undefined;

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

  const [uncontrolledSearchQuery, setUncontrolledSearchQuery] =
    useState(defaultSearchQuery);
  const [recentEmoji, setRecentEmoji] = useState<RecentEmojiRecord[]>([]);
  const [uncontrolledSkinTone, setUncontrolledSkinTone] =
    useState<EmojiSkinTone>(() =>
      readStoredSkinTone(skinToneStorageKey, defaultSkinTone),
    );
  const [activeCategory, setActiveCategory] =
    useState<EmojiCategoryId>('smileys');
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiRenderable | null>(
    null,
  );
  const [runtimeSpriteUrl, setRuntimeSpriteUrl] = useState<string | null>(
    null,
  );

  const searchQuery = isSearchControlled
    ? controlledSearchQuery
    : uncontrolledSearchQuery;
  const skinTone = isSkinToneControlled
    ? controlledSkinTone
    : uncontrolledSkinTone;
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchId = useId();
  const gridRef = useRef<EmojiGridHandle>(null);

  useEffect(() => {
    setRecentEmoji(readRecentEmoji(recentStorageKey));
  }, [recentStorageKey]);

  useEffect(() => {
    if (!isSearchControlled) {
      setUncontrolledSearchQuery(defaultSearchQuery);
    }
  }, [defaultSearchQuery, isSearchControlled]);

  useEffect(() => {
    if (!isSkinToneControlled) {
      setUncontrolledSkinTone(
        readStoredSkinTone(skinToneStorageKey, defaultSkinTone),
      );
    }
  }, [
    defaultSkinTone,
    isSkinToneControlled,
    skinToneStorageKey,
  ]);

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

  const handleSearchQueryChange = useCallback(
    (nextSearchQuery: string) => {
      if (!isSearchControlled) {
        setUncontrolledSearchQuery(nextSearchQuery);
      }
      onSearchQueryChange?.(nextSearchQuery);
    },
    [isSearchControlled, onSearchQueryChange],
  );

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

  const handleSkinToneChange = useCallback(
    (nextSkinTone: EmojiSkinTone) => {
      if (!isSkinToneControlled) {
        setUncontrolledSkinTone(nextSkinTone);
        writeStoredSkinTone(skinToneStorageKey, nextSkinTone);
      }
      onSkinToneChange?.(nextSkinTone);
    },
    [isSkinToneControlled, onSkinToneChange, skinToneStorageKey],
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

  function handleCategoryClick(categoryId: EmojiCategoryId) {
    setActiveCategory(categoryId);
    gridRef.current?.scrollToCategory(categoryId);
  }

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
      className={getSlotClassName('root', slotOptions, className)}
      style={
        getSlotStyle(
          'root',
          slotOptions,
          {
            ['--mx-emoji-size' as string]: `${emojiSize}px`,
            ['--mx-columns' as string]: `${columns}`,
          } as CSSProperties,
          style,
        ) as CSSProperties
      }
      data-mx-slot="root"
      data-mx-unstyled={unstyled ? 'true' : undefined}
    >
      <div
        className={getSlotClassName('panel', slotOptions)}
        style={getSlotStyle('panel', slotOptions)}
        data-mx-slot="panel"
      >
        <EmojiToolbar
          searchId={searchId}
          searchQuery={searchQuery}
          onSearchChange={handleSearchQueryChange}
          skinTone={skinTone}
          onSkinToneChange={handleSkinToneChange}
          showSkinTones={showSkinTones}
          labels={labelSet}
          localeDefinition={localeDefinition}
          unstyled={unstyled}
          classNames={classNames}
          styles={styles}
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
          unstyled={unstyled}
          classNames={classNames}
          styles={styles}
        />

        {showPreview && (
          <EmojiPreview
            emoji={previewEmoji}
            selection={previewSelection}
            spriteSheet={activeSpriteSheet}
            renderPreview={renderPreview}
            unstyled={unstyled}
            classNames={classNames}
            styles={styles}
          />
        )}
      </div>

      <EmojiSidebar
        sections={sections}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        unstyled={unstyled}
        classNames={classNames}
        styles={styles}
      />
    </div>
  );
}
