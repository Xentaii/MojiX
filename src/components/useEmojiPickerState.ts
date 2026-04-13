import {
  type RefObject,
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
  createLocalStorageRecentStore,
  readStoredSkinTone,
  writeStoredSkinTone,
} from '../lib/storage';
import type {
  EmojiCategoryId,
  EmojiPickerLabels,
  EmojiPickerProps,
  EmojiRenderable,
  EmojiSection,
  EmojiSelection,
  EmojiSkinTone,
  EmojiRecentStore,
  PreparedCustomEmoji,
  RecentEmojiRecord,
} from '../lib/types';
import type { EmojiGridHandle } from './EmojiGrid';

function resolveRecentEmoji(
  recent: RecentEmojiRecord,
  customEmojiById: Map<string, PreparedCustomEmoji>,
) {
  if (recent.custom) {
    return customEmojiById.get(recent.id) ?? null;
  }

  return getUnicodeEmojiById(recent.id) ?? null;
}

export interface EmojiPickerState {
  searchId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  skinTone: EmojiSkinTone;
  setSkinTone: (tone: EmojiSkinTone) => void;
  activeCategory: EmojiCategoryId;
  setActiveCategory: (categoryId: EmojiCategoryId) => void;
  hoveredEmoji: EmojiRenderable | null;
  setHoveredEmoji: (emoji: EmojiRenderable | null) => void;
  sections: EmojiSection[];
  previewEmoji: EmojiRenderable | null;
  previewSelection: EmojiSelection | null;
  localeDefinition: ReturnType<typeof resolveLocaleDefinition>;
  labelSet: EmojiPickerLabels;
  activeSpriteSheet: ReturnType<typeof resolveSpriteSheetConfig>;
  handleSelectEmoji: (emoji: EmojiRenderable) => void;
  handleCategoryClick: (categoryId: EmojiCategoryId) => void;
  handleActiveCategoryChange: (id: EmojiCategoryId) => void;
  handleEmojiHover: (emoji: EmojiRenderable | null) => void;
  gridRef: RefObject<EmojiGridHandle | null>;
  showPreview: boolean;
  showRecents: boolean;
  showSkinTones: boolean;
  emojiSize: number;
  columns: number;
  value: EmojiPickerProps['value'];
  renderEmoji: EmojiPickerProps['renderEmoji'];
  renderPreview: EmojiPickerProps['renderPreview'];
  emptyState: EmojiPickerProps['emptyState'];
  unstyled: boolean;
  classNames: EmojiPickerProps['classNames'];
  styles: EmojiPickerProps['styles'];
  assetSource: EmojiPickerProps['assetSource'];
  gridAssetSource: EmojiPickerProps['gridAssetSource'];
  previewAssetSource: EmojiPickerProps['previewAssetSource'];
  loading: boolean;
  recentStore: EmojiRecentStore;
}

export function useEmojiPickerState({
  value,
  searchQuery: controlledSearchQuery,
  defaultSearchQuery = '',
  onSearchQueryChange,
  activeCategory: controlledActiveCategory,
  defaultActiveCategory = 'smileys',
  onActiveCategoryChange,
  emojiSize = DEFAULT_EMOJI_SIZE,
  columns = DEFAULT_COLUMNS,
  loading = false,
  showPreview = true,
  showRecents = true,
  showSkinTones = true,
  recentLimit = DEFAULT_RECENT_LIMIT,
  recentStorageKey = DEFAULT_RECENT_STORAGE_KEY,
  recentStore,
  skinToneStorageKey = DEFAULT_SKIN_TONE_STORAGE_KEY,
  locale = 'en',
  fallbackLocale,
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
  assetSource,
  gridAssetSource,
  previewAssetSource,
}: EmojiPickerProps): EmojiPickerState {
  const isSearchControlled = controlledSearchQuery !== undefined;
  const isSkinToneControlled = controlledSkinTone !== undefined;
  const isActiveCategoryControlled = controlledActiveCategory !== undefined;

  const resolvedSpriteSheet = useMemo(
    () => resolveSpriteSheetConfig(spriteSheet),
    [spriteSheet],
  );
  const localeDefinition = useMemo(
    () => resolveLocaleDefinition(locale, locales, fallbackLocale),
    [fallbackLocale, locale, locales],
  );
  const labelSet = useMemo(
    () => ({ ...localeDefinition.labels, ...labels }),
    [labels, localeDefinition.labels],
  );
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
  const [uncontrolledActiveCategory, setUncontrolledActiveCategory] =
    useState<EmojiCategoryId>(defaultActiveCategory);
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
  const activeCategory = isActiveCategoryControlled
    ? controlledActiveCategory
    : uncontrolledActiveCategory;
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchId = useId();
  const gridRef = useRef<EmojiGridHandle>(null);
  const resolvedRecentStore = useMemo(
    () => recentStore ?? createLocalStorageRecentStore(recentStorageKey),
    [recentStorageKey, recentStore],
  );

  useEffect(() => {
    setRecentEmoji(resolvedRecentStore.read());
  }, [resolvedRecentStore]);

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
    if (!isActiveCategoryControlled) {
      setUncontrolledActiveCategory(defaultActiveCategory);
    }
  }, [defaultActiveCategory, isActiveCategoryControlled]);

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
  const resolvedGridAssetSource = gridAssetSource ?? assetSource;
  const resolvedPreviewAssetSource =
    previewAssetSource ?? assetSource ?? resolvedGridAssetSource;

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

  const setActiveCategory = useCallback(
    (nextCategory: EmojiCategoryId) => {
      if (activeCategory === nextCategory) {
        return;
      }

      if (!isActiveCategoryControlled) {
        setUncontrolledActiveCategory(nextCategory);
      }

      onActiveCategoryChange?.(nextCategory);
    },
    [activeCategory, isActiveCategoryControlled, onActiveCategoryChange],
  );

  useEffect(() => {
    if (sections.length === 0) return;

    const firstSection = sections[0];
    if (
      firstSection &&
      !sections.some((section) => section.id === activeCategory)
    ) {
      setActiveCategory(firstSection.id);
    }
  }, [activeCategory, sections, setActiveCategory]);

  const setSearchQuery = useCallback(
    (nextSearchQuery: string) => {
      if (!isSearchControlled) {
        setUncontrolledSearchQuery(nextSearchQuery);
      }
      onSearchQueryChange?.(nextSearchQuery);
    },
    [isSearchControlled, onSearchQueryChange],
  );

  const setSkinTone = useCallback(
    (nextSkinTone: EmojiSkinTone) => {
      if (!isSkinToneControlled) {
        setUncontrolledSkinTone(nextSkinTone);
        writeStoredSkinTone(skinToneStorageKey, nextSkinTone);
      }
      onSkinToneChange?.(nextSkinTone);
    },
    [isSkinToneControlled, onSkinToneChange, skinToneStorageKey],
  );

  const handleActiveCategoryChange = useCallback(
    (id: EmojiCategoryId) => {
      setActiveCategory(id);
    },
    [setActiveCategory],
  );

  const handleEmojiHover = useCallback(
    (emoji: EmojiRenderable | null) => {
      setHoveredEmoji(emoji);
    },
    [],
  );

  const handleSelectEmoji = useCallback(
    (emoji: EmojiRenderable) => {
      const selection = createEmojiSelection(
        emoji,
        skinTone,
        localeDefinition,
      );

      setHoveredEmoji(emoji);
      onEmojiSelect?.(selection);

      if (showRecents) {
        setRecentEmoji(
          resolvedRecentStore.push(
            {
              id: emoji.id,
              custom: emoji.kind === 'custom',
              skinTone,
            },
            recentLimit,
          ),
        );
      }
    },
    [
      localeDefinition,
      onEmojiSelect,
      recentLimit,
      resolvedRecentStore,
      showRecents,
      skinTone,
    ],
  );

  const handleCategoryClick = useCallback((categoryId: EmojiCategoryId) => {
    setActiveCategory(categoryId);
    gridRef.current?.scrollToCategory(categoryId);
  }, [setActiveCategory]);

  const previewEmoji =
    hoveredEmoji ??
    sections.find((section) => section.id === activeCategory)?.emojis[0] ??
    sections[0]?.emojis[0] ??
    null;

  const previewSelection = previewEmoji
    ? createEmojiSelection(previewEmoji, skinTone, localeDefinition)
    : null;

  return {
    searchId,
    searchQuery,
    setSearchQuery,
    skinTone,
    setSkinTone,
    activeCategory,
    setActiveCategory,
    hoveredEmoji,
    setHoveredEmoji,
    sections,
    previewEmoji,
    previewSelection,
    localeDefinition,
    labelSet,
    activeSpriteSheet,
    handleSelectEmoji,
    handleCategoryClick,
    handleActiveCategoryChange,
    handleEmojiHover,
    gridRef,
    showPreview,
    showRecents,
    showSkinTones,
    emojiSize,
    columns,
    value,
    renderEmoji,
    renderPreview,
    emptyState,
    unstyled,
    classNames,
    styles,
    assetSource,
    gridAssetSource: resolvedGridAssetSource,
    previewAssetSource: resolvedPreviewAssetSource,
    loading,
    recentStore: resolvedRecentStore,
  };
}
