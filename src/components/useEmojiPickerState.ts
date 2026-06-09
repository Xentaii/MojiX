import {
  type RefObject,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createNativeAssetSource } from '../core/assets';
import {
  CATEGORY_GLYPH_META,
  CATEGORY_ICON_GLYPHS,
  CATEGORY_META,
  CATEGORY_ORDER,
  DEFAULT_CATEGORY_ICON_STYLE,
  DEFAULT_COLUMNS,
  DEFAULT_EMOJI_SIZE,
  DEFAULT_RECENT_LIMIT,
  DEFAULT_RECENT_STORAGE_KEY,
  DEFAULT_SKIN_TONE_STORAGE_KEY,
  getDefaultCategoryOrder,
  humanizeCategoryId,
  isBuiltInCategoryId,
  isSystemCategoryId,
} from '../core/constants';
import {
  createEmojiSelection,
  getEmojiDataStoreSnapshot,
  isEmojiCategoryLoaded,
  loadEmojiCategoryShard,
  loadEmojiData,
  peekUnicodeEmojiByCategory,
  peekUnicodeEmojiById,
  peekUnicodeEmojiByNative,
  prepareCustomEmojis,
  subscribeEmojiDataStore,
} from '../core/data';
import {
  getEmojiLocaleRegistrySnapshot,
  getLocalizedCategoryLabel,
  loadEmojiLocaleSearchIndex,
  loadLocale,
  resolveLocaleDefinition,
  subscribeEmojiLocaleRegistry,
} from '../core/i18n';
import { scheduleIdleTask } from '../core/idle';
import { filterEmojiWithSearchConfig } from '../core/search';
import { warmEmojiSpriteSheet } from '../core/sprite-cache';
import {
  createSpriteSheetCacheKey,
  defaultSpriteSheet,
  resolveSpriteSheetConfig,
  resolveSpriteSheetUrl,
} from '../core/sprites';
import {
  createLocalStorageRecentStore,
  pushRecentEmojiRecord,
  readStoredSkinTone,
  writeStoredSkinTone,
} from '../core/storage';
import { applyPerformanceModeToVirtualization } from './performanceProfile';

// Used as the default asset source when the caller provides no sprite sheet
// and no explicit asset source, so "just works" uses native OS emoji.
const DEFAULT_NATIVE_SOURCE = createNativeAssetSource();

import { peekWarmedEmojiSpriteSheetUrl } from '../core/sprite-cache';
import type {
  EmojiAssetSource,
  EmojiCategoryIconConfig,
  EmojiCategoryIconGlyph,
  EmojiCategoryIconInput,
  EmojiCategoryIconPreset,
  EmojiCategoryId,
  EmojiPickerColors,
  EmojiPickerLabels,
  EmojiPickerProps,
  EmojiPickerScrollBehavior,
  EmojiRecentStore,
  EmojiRenderable,
  EmojiRenderState,
  EmojiSearchConfigLike,
  EmojiSection,
  EmojiSelection,
  EmojiSkinTone,
  PreparedCustomEmoji,
  RecentEmojiRecord,
  ResolvedEmojiCategoryIcon,
} from '../core/types';
import type { EmojiGridHandle } from './EmojiGrid';

function resolveRecentEmoji(
  recent: RecentEmojiRecord,
  customEmojiById: Map<string, PreparedCustomEmoji>,
) {
  if (recent.custom) {
    return customEmojiById.get(recent.id) ?? null;
  }

  return peekUnicodeEmojiById(recent.id) ?? null;
}

const CATEGORY_ICON_GLYPH_SET = new Set<string>(CATEGORY_ICON_GLYPHS);

function sortRecentRecords(
  records: RecentEmojiRecord[],
  sortMode: 'recent' | 'frequent',
) {
  const nextRecords = [...records];

  if (sortMode === 'frequent') {
    return nextRecords.sort((left, right) => {
      if (right.count === left.count) {
        return right.usedAt - left.usedAt;
      }

      return right.count - left.count;
    });
  }

  return nextRecords.sort((left, right) => right.usedAt - left.usedAt);
}

function resolveCategoryIconConfig(
  icon: EmojiCategoryIconInput | undefined,
  fallbackIcon: EmojiCategoryIconConfig,
): EmojiCategoryIconConfig {
  if (!icon) {
    return { ...fallbackIcon };
  }

  if (typeof icon === 'string') {
    if (CATEGORY_ICON_GLYPH_SET.has(icon)) {
      const glyphMeta = CATEGORY_GLYPH_META[icon as EmojiCategoryIconGlyph];

      return {
        ...fallbackIcon,
        ...glyphMeta,
      };
    }

    return {
      ...fallbackIcon,
      emoji: icon,
      emojiId: undefined,
    };
  }

  const glyphFallback = icon.glyph
    ? CATEGORY_GLYPH_META[icon.glyph]
    : undefined;

  return {
    glyph: icon.glyph ?? glyphFallback?.glyph ?? fallbackIcon.glyph,
    emoji: icon.emoji ?? glyphFallback?.emoji ?? fallbackIcon.emoji,
    emojiId: icon.emojiId ?? glyphFallback?.emojiId ?? fallbackIcon.emojiId,
    style: icon.style ?? fallbackIcon.style,
  };
}

function resolveCategoryIconRenderable(
  icon: EmojiCategoryIconConfig,
  customEmojiById: Map<string, PreparedCustomEmoji>,
) {
  const iconLookup = icon.emojiId ?? icon.emoji;

  if (!iconLookup) {
    return null;
  }

  return (
    customEmojiById.get(iconLookup) ??
    peekUnicodeEmojiById(iconLookup) ??
    peekUnicodeEmojiByNative(iconLookup) ??
    null
  );
}

function buildResolvedCategoryIcon(options: {
  icon?: EmojiCategoryIconInput;
  fallbackIcon: EmojiCategoryIconConfig;
  iconStyle?: EmojiCategoryIconPreset;
  defaultStyle: EmojiCategoryIconPreset;
  customEmojiById: Map<string, PreparedCustomEmoji>;
}): ResolvedEmojiCategoryIcon {
  const resolvedIconConfig = resolveCategoryIconConfig(
    options.icon,
    options.fallbackIcon,
  );

  return {
    glyph:
      resolvedIconConfig.glyph ??
      options.fallbackIcon.glyph ??
      CATEGORY_META.custom.icon.glyph ??
      'custom',
    emoji:
      resolvedIconConfig.emoji ??
      options.fallbackIcon.emoji ??
      CATEGORY_META.custom.icon.emoji ??
      '\u2728',
    emojiId: resolvedIconConfig.emojiId ?? options.fallbackIcon.emojiId,
    style:
      resolvedIconConfig.style ?? options.iconStyle ?? options.defaultStyle,
    renderable: resolveCategoryIconRenderable(
      resolvedIconConfig,
      options.customEmojiById,
    ),
  };
}

export interface EmojiPickerState {
  searchId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  trapFocus: boolean;
  closeOnEscape: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchConfig: EmojiSearchConfigLike | undefined;
  skinTone: EmojiSkinTone;
  setSkinTone: (tone: EmojiSkinTone) => void;
  activeCategory: EmojiCategoryId;
  setActiveCategory: (categoryId: EmojiCategoryId) => void;
  selectedCategory: EmojiCategoryId;
  setSelectedCategory: (categoryId: EmojiCategoryId) => void;
  visibleCategory: EmojiCategoryId;
  setVisibleCategory: (categoryId: EmojiCategoryId) => void;
  activeEmojiId: string | null;
  setActiveEmojiId: (emojiId: string | null) => void;
  hoveredEmoji: EmojiRenderable | null;
  setHoveredEmoji: (emoji: EmojiRenderable | null) => void;
  sections: EmojiSection[];
  previewEmoji: EmojiRenderable | null;
  previewSelection: EmojiSelection | null;
  localeDefinition: ReturnType<typeof resolveLocaleDefinition>;
  labelSet: EmojiPickerLabels;
  activeSpriteSheet: ReturnType<typeof resolveSpriteSheetConfig>;
  retainedSpriteSheetUrl: string | null;
  ready: boolean;
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
  renderCategoryIcon: EmojiPickerProps['renderCategoryIcon'];
  emptyState: EmojiPickerProps['emptyState'];
  unstyled: boolean;
  classNames: EmojiPickerProps['classNames'];
  styles: EmojiPickerProps['styles'];
  colors: EmojiPickerColors | undefined;
  virtualization: EmojiPickerProps['virtualization'];
  deferGridMount: boolean;
  assetSource: EmojiPickerProps['assetSource'];
  gridAssetSource: EmojiPickerProps['gridAssetSource'];
  previewAssetSource: EmojiPickerProps['previewAssetSource'];
  resolveEmojiHoverColor: (
    emoji: EmojiRenderable,
    state: EmojiRenderState,
  ) => string | undefined;
  resolveCategoryHoverColor: (
    categoryId: EmojiCategoryId,
  ) => string | undefined;
  autoScrollCategoriesOnHover: boolean;
  trackHoverActive: boolean;
  categoryScrollBehavior: EmojiPickerScrollBehavior;
  loading: boolean;
  recentStore: EmojiRecentStore;
  recentEmoji: RecentEmojiRecord[];
}

function resolveRuntimeSpriteAsset(
  spriteSheet: ReturnType<typeof resolveSpriteSheetConfig>,
  key: string,
) {
  if (!spriteSheet.cache.enabled) {
    return null;
  }

  const url = peekWarmedEmojiSpriteSheetUrl(spriteSheet);

  if (!url) {
    return null;
  }

  return { key, url };
}

function sourceCanUseSpriteSheet(source: EmojiAssetSource | undefined) {
  return (
    source?.type === 'spriteSheet' ||
    source?.type === 'mixed' ||
    source === undefined
  );
}

export function useEmojiPickerState({
  value,
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  searchQuery: controlledSearchQuery,
  defaultSearchQuery = '',
  onSearchQueryChange,
  searchConfig,
  selectedCategory: controlledSelectedCategory,
  defaultSelectedCategory,
  onSelectedCategoryChange,
  visibleCategory: controlledVisibleCategory,
  defaultVisibleCategory,
  onVisibleCategoryChange,
  activeCategory: controlledActiveCategory,
  defaultActiveCategory,
  onActiveCategoryChange,
  activeEmojiId: controlledActiveEmojiId,
  defaultActiveEmojiId,
  onActiveEmojiChange,
  recentEmoji: controlledRecentEmoji,
  defaultRecentEmoji,
  onRecentEmojiChange,
  emojiSize = DEFAULT_EMOJI_SIZE,
  columns = DEFAULT_COLUMNS,
  loading = false,
  onDataError,
  showPreview = true,
  trackHoverActive,
  showRecents = true,
  showSkinTones = true,
  recentLimit = DEFAULT_RECENT_LIMIT,
  recentStorageKey = DEFAULT_RECENT_STORAGE_KEY,
  recentStore,
  recent,
  skinToneStorageKey = DEFAULT_SKIN_TONE_STORAGE_KEY,
  locale = 'en',
  fallbackLocale,
  locales,
  skinTone: controlledSkinTone,
  defaultSkinTone = 'default',
  onSkinToneChange,
  labels,
  colors,
  virtualization,
  performanceMode = 'auto',
  deferGridMount = false,
  loadCategoryShards = false,
  autoScrollCategoriesOnHover = true,
  categoryScrollBehavior = 'smooth',
  trapFocus = false,
  closeOnEscape,
  categories,
  categoryIcons,
  categoryIconStyle = DEFAULT_CATEGORY_ICON_STYLE,
  spriteSheet: spriteSheetProp,
  customEmojis = [],
  emptyState,
  unstyled = false,
  classNames,
  styles,
  renderEmoji,
  renderPreview,
  renderCategoryIcon,
  onEmojiSelect,
  assetSource,
  gridAssetSource,
  previewAssetSource,
}: EmojiPickerProps): EmojiPickerState {
  const isSearchControlled = controlledSearchQuery !== undefined;
  const isOpenControlled = controlledOpen !== undefined;
  const isSkinToneControlled = controlledSkinTone !== undefined;
  const isRecentEmojiControlled = controlledRecentEmoji !== undefined;
  const controlledCategory =
    controlledSelectedCategory ?? controlledActiveCategory;
  const isSelectedCategoryControlled = controlledCategory !== undefined;
  const isVisibleCategoryControlled = controlledVisibleCategory !== undefined;
  const isActiveEmojiControlled = controlledActiveEmojiId !== undefined;
  const emojiDataSnapshot = useSyncExternalStore(
    subscribeEmojiDataStore,
    getEmojiDataStoreSnapshot,
    getEmojiDataStoreSnapshot,
  );
  const localeRegistryVersion = useSyncExternalStore(
    subscribeEmojiLocaleRegistry,
    getEmojiLocaleRegistrySnapshot,
    getEmojiLocaleRegistrySnapshot,
  );

  const resolvedSpriteSheet = useMemo(
    () => resolveSpriteSheetConfig(spriteSheetProp ?? defaultSpriteSheet),
    [spriteSheetProp],
  );
  const effectiveVirtualization = useMemo(
    () => applyPerformanceModeToVirtualization(virtualization, performanceMode),
    [virtualization, performanceMode],
  );
  const spriteSheetCacheKey = useMemo(
    () => createSpriteSheetCacheKey(resolvedSpriteSheet),
    [resolvedSpriteSheet],
  );
  const localeDefinition = useMemo(
    () => resolveLocaleDefinition(locale, locales, fallbackLocale),
    [fallbackLocale, locale, localeRegistryVersion, locales],
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
  const customEmojiByCategory = useMemo(() => {
    const groups = new Map<EmojiCategoryId, PreparedCustomEmoji[]>();

    for (const emoji of preparedCustomEmojis) {
      const existing = groups.get(emoji.categoryId);

      if (existing) {
        existing.push(emoji);
      } else {
        groups.set(emoji.categoryId, [emoji]);
      }
    }

    return groups;
  }, [preparedCustomEmojis]);
  const resolvedRecentConfig = useMemo(
    () => ({
      enabled: recent?.enabled ?? showRecents,
      limit: recent?.limit ?? recentLimit,
      showWhenEmpty: recent?.showWhenEmpty ?? true,
      defaultActive: recent?.defaultActive ?? true,
      sort: recent?.sort ?? ('recent' as const),
      emptyEmojiIds: recent?.emptyEmojiIds ?? [],
      storageKey: recent?.storageKey ?? recentStorageKey,
      store: recent?.store ?? recentStore,
    }),
    [recent, recentLimit, recentStorageKey, recentStore, showRecents],
  );
  const resolvedDefaultActiveCategory =
    defaultSelectedCategory ??
    defaultActiveCategory ??
    (resolvedRecentConfig.enabled && resolvedRecentConfig.defaultActive
      ? 'recent'
      : 'smileys');
  const resolvedDefaultVisibleCategory =
    defaultVisibleCategory ?? resolvedDefaultActiveCategory;

  const [uncontrolledSearchQuery, setUncontrolledSearchQuery] =
    useState(defaultSearchQuery);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [uncontrolledRecentEmoji, setUncontrolledRecentEmoji] = useState<
    RecentEmojiRecord[]
  >(defaultRecentEmoji ?? []);
  const [uncontrolledSkinTone, setUncontrolledSkinTone] =
    useState<EmojiSkinTone>(() =>
      readStoredSkinTone(skinToneStorageKey, defaultSkinTone),
    );
  const [uncontrolledSelectedCategory, setUncontrolledSelectedCategory] =
    useState<EmojiCategoryId>(resolvedDefaultActiveCategory);
  const [uncontrolledVisibleCategory, setUncontrolledVisibleCategory] =
    useState<EmojiCategoryId>(resolvedDefaultVisibleCategory);
  const [uncontrolledActiveEmojiId, setUncontrolledActiveEmojiId] = useState<
    string | null
  >(defaultActiveEmojiId ?? null);
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiRenderable | null>(
    null,
  );
  const pendingHoveredEmojiRef = useRef<EmojiRenderable | null>(null);
  const hoveredEmojiFrameRef = useRef<number | null>(null);
  const [runtimeSpriteAsset, setRuntimeSpriteAsset] = useState<{
    key: string;
    url: string;
  } | null>(() =>
    resolveRuntimeSpriteAsset(resolvedSpriteSheet, spriteSheetCacheKey),
  );
  const lastDataErrorRef = useRef<unknown>(null);
  const didRequestEmojiDataRef = useRef(false);

  const searchQuery = isSearchControlled
    ? controlledSearchQuery
    : uncontrolledSearchQuery;
  const open = controlledOpen ?? uncontrolledOpen;
  const ready = emojiDataSnapshot.ready;
  const skinTone = isSkinToneControlled
    ? controlledSkinTone
    : uncontrolledSkinTone;
  const recentEmoji = controlledRecentEmoji ?? uncontrolledRecentEmoji;
  const selectedCategory = isSelectedCategoryControlled
    ? controlledCategory
    : uncontrolledSelectedCategory;
  const visibleCategory = isVisibleCategoryControlled
    ? controlledVisibleCategory
    : uncontrolledVisibleCategory;
  const activeCategory = selectedCategory;
  const activeEmojiId = isActiveEmojiControlled
    ? controlledActiveEmojiId
    : uncontrolledActiveEmojiId;
  const shouldTrackHoverActive = trackHoverActive ?? showPreview;
  const shouldCloseOnEscape =
    closeOnEscape ??
    (controlledOpen !== undefined || defaultOpen !== true || trapFocus);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchId = useId();
  const gridRef = useRef<EmojiGridHandle>(null);
  const resolvedRecentStore = useMemo(
    () =>
      resolvedRecentConfig.store ??
      createLocalStorageRecentStore(resolvedRecentConfig.storageKey),
    [resolvedRecentConfig.storageKey, resolvedRecentConfig.store],
  );

  useEffect(() => {
    if (isRecentEmojiControlled || defaultRecentEmoji) {
      return;
    }

    setUncontrolledRecentEmoji(resolvedRecentStore.read());
  }, [defaultRecentEmoji, isRecentEmojiControlled, resolvedRecentStore]);

  useEffect(() => {
    if (!isOpenControlled) {
      setUncontrolledOpen(defaultOpen);
    }
  }, [defaultOpen, isOpenControlled]);

  useEffect(() => {
    if (!isRecentEmojiControlled && defaultRecentEmoji) {
      setUncontrolledRecentEmoji(defaultRecentEmoji);
    }
  }, [defaultRecentEmoji, isRecentEmojiControlled]);

  useEffect(() => {
    if (loadCategoryShards) {
      // In shard mode the consumer opts in to category-by-category fetching;
      // skip the bootstrap auto-load and rely on the per-category effect
      // below to fetch what the user navigates to.
      return;
    }

    if (emojiDataSnapshot.ready) {
      didRequestEmojiDataRef.current = false;
      return;
    }

    if (
      emojiDataSnapshot.status === 'loading' ||
      didRequestEmojiDataRef.current
    ) {
      return;
    }

    didRequestEmojiDataRef.current = true;
    loadEmojiData().catch(() => {
      return;
    });
  }, [emojiDataSnapshot.ready, emojiDataSnapshot.status, loadCategoryShards]);

  const requestedShardsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loadCategoryShards) {
      return;
    }

    const candidateCategories = Array.from(
      new Set([selectedCategory, visibleCategory]),
    );

    for (const categoryId of candidateCategories) {
      if (
        isBuiltInCategoryId(categoryId) &&
        !isEmojiCategoryLoaded(categoryId) &&
        !requestedShardsRef.current.has(categoryId)
      ) {
        requestedShardsRef.current.add(categoryId);
        loadEmojiCategoryShard(categoryId).catch(() => {
          requestedShardsRef.current.delete(categoryId);
        });
      }
    }

    // Default selectedCategory is often 'recent', which has no shard. If the
    // store is still empty we kick off 'smileys' so the picker has something
    // to show as the user opens it.
    if (
      !candidateCategories.some(isBuiltInCategoryId) &&
      !isEmojiCategoryLoaded('smileys') &&
      !requestedShardsRef.current.has('smileys')
    ) {
      requestedShardsRef.current.add('smileys');
      loadEmojiCategoryShard('smileys').catch(() => {
        requestedShardsRef.current.delete('smileys');
      });
    }
  }, [
    emojiDataSnapshot.version,
    loadCategoryShards,
    selectedCategory,
    visibleCategory,
  ]);

  useEffect(() => {
    if (
      emojiDataSnapshot.error === null ||
      lastDataErrorRef.current === emojiDataSnapshot.error
    ) {
      return;
    }

    lastDataErrorRef.current = emojiDataSnapshot.error;
    onDataError?.(emojiDataSnapshot.error);
  }, [emojiDataSnapshot.error, onDataError]);

  useEffect(() => {
    const requestedLocales = Array.from(
      new Set(
        [
          locale,
          ...(Array.isArray(fallbackLocale)
            ? fallbackLocale
            : fallbackLocale
              ? [fallbackLocale]
              : []),
        ].filter((value): value is string => Boolean(value) && value !== 'en'),
      ),
    );

    for (const localeCode of requestedLocales) {
      loadLocale(localeCode).catch(() => {
        return;
      });
    }
  }, [fallbackLocale, locale]);

  const requestedSearchLocalesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (deferredSearchQuery.trim().length === 0) {
      return;
    }

    const requestedLocales = Array.from(
      new Set(
        [
          locale,
          ...(Array.isArray(fallbackLocale)
            ? fallbackLocale
            : fallbackLocale
              ? [fallbackLocale]
              : []),
        ].filter((value): value is string => Boolean(value)),
      ),
    );

    for (const localeCode of requestedLocales) {
      if (requestedSearchLocalesRef.current.has(localeCode)) {
        continue;
      }

      requestedSearchLocalesRef.current.add(localeCode);
      loadEmojiLocaleSearchIndex(localeCode).catch(() => {
        requestedSearchLocalesRef.current.delete(localeCode);
      });
    }
  }, [deferredSearchQuery, fallbackLocale, locale]);

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
  }, [defaultSkinTone, isSkinToneControlled, skinToneStorageKey]);

  useEffect(() => {
    if (!isSelectedCategoryControlled) {
      setUncontrolledSelectedCategory(resolvedDefaultActiveCategory);
    }
  }, [isSelectedCategoryControlled, resolvedDefaultActiveCategory]);

  useEffect(() => {
    if (!isVisibleCategoryControlled) {
      setUncontrolledVisibleCategory(resolvedDefaultVisibleCategory);
    }
  }, [isVisibleCategoryControlled, resolvedDefaultVisibleCategory]);

  // When the caller provides no spriteSheet and no explicit asset source, fall
  // back to native OS emoji so <EmojiPicker /> works with zero config.
  const zeroConfigSource =
    spriteSheetProp === undefined &&
    assetSource === undefined &&
    gridAssetSource === undefined
      ? DEFAULT_NATIVE_SOURCE
      : undefined;

  const resolvedGridAssetSource =
    gridAssetSource ?? assetSource ?? zeroConfigSource;
  const resolvedPreviewAssetSource =
    previewAssetSource ??
    assetSource ??
    zeroConfigSource ??
    resolvedGridAssetSource;
  const shouldRetainSpriteSheet =
    zeroConfigSource === undefined &&
    (sourceCanUseSpriteSheet(resolvedGridAssetSource) ||
      sourceCanUseSpriteSheet(resolvedPreviewAssetSource));
  const shouldWarmSpriteSheetOnMount =
    resolvedSpriteSheet.cache.preload !== 'manual' &&
    (resolvedSpriteSheet.cache.enabled || shouldRetainSpriteSheet);

  useEffect(() => {
    let cancelled = false;

    setRuntimeSpriteAsset(
      resolveRuntimeSpriteAsset(resolvedSpriteSheet, spriteSheetCacheKey),
    );

    if (!shouldWarmSpriteSheetOnMount) {
      return;
    }

    const cancelIdleWarmup = scheduleIdleTask(() => {
      warmEmojiSpriteSheet(resolvedSpriteSheet)
        .then((asset) => {
          if (cancelled || !asset.cached) {
            return;
          }

          setRuntimeSpriteAsset({
            key: spriteSheetCacheKey,
            url: asset.url,
          });
        })
        .catch(() => {
          return;
        });
    });

    return () => {
      cancelled = true;
      cancelIdleWarmup();
    };
  }, [resolvedSpriteSheet, shouldWarmSpriteSheetOnMount, spriteSheetCacheKey]);

  const activeSpriteSheet = useMemo(
    () =>
      runtimeSpriteAsset?.key === spriteSheetCacheKey
        ? { ...resolvedSpriteSheet, url: runtimeSpriteAsset.url }
        : resolvedSpriteSheet,
    [resolvedSpriteSheet, runtimeSpriteAsset, spriteSheetCacheKey],
  );
  const retainedSpriteSheetUrl = useMemo(
    () =>
      shouldRetainSpriteSheet ? resolveSpriteSheetUrl(activeSpriteSheet) : null,
    [activeSpriteSheet, shouldRetainSpriteSheet],
  );
  const recentSectionEmojis = useMemo(() => {
    if (!resolvedRecentConfig.enabled) {
      return [] as EmojiRenderable[];
    }

    const resolvedRecentEmoji = sortRecentRecords(
      recentEmoji,
      resolvedRecentConfig.sort,
    )
      .map((recent) => resolveRecentEmoji(recent, customEmojiById))
      .filter((emoji): emoji is EmojiRenderable => Boolean(emoji));

    if (resolvedRecentEmoji.length > 0) {
      return resolvedRecentEmoji;
    }

    return resolvedRecentConfig.emptyEmojiIds
      .map(
        (emojiId) =>
          customEmojiById.get(emojiId) ??
          peekUnicodeEmojiById(emojiId) ??
          peekUnicodeEmojiByNative(emojiId) ??
          null,
      )
      .filter((emoji): emoji is EmojiRenderable => Boolean(emoji));
  }, [
    customEmojiById,
    emojiDataSnapshot.version,
    recentEmoji,
    resolvedRecentConfig.emptyEmojiIds,
    resolvedRecentConfig.enabled,
    resolvedRecentConfig.sort,
  ]);

  const sections = useMemo(() => {
    const nextSections: Array<{
      order: number;
      index: number;
      section: EmojiSection;
    }> = [];
    const categoryConfigs = categories ?? {};
    const isSearching = deferredSearchQuery.trim().length > 0;
    let customCategoryOrder = CATEGORY_ORDER.length;

    const pushSection = (options: {
      categoryId: EmojiCategoryId;
      fallbackLabel: string;
      fallbackIcon: EmojiCategoryIconConfig;
      emojis: EmojiRenderable[];
      fallbackOrder: number;
    }) => {
      const categoryConfig = categoryConfigs[options.categoryId];
      const explicitIcon =
        categoryIcons?.[options.categoryId] ?? categoryConfig?.icon;

      if (categoryConfig?.hidden) {
        return;
      }

      nextSections.push({
        order: categoryConfig?.order ?? options.fallbackOrder,
        index: nextSections.length,
        section: {
          id: options.categoryId,
          label:
            categoryConfig?.label ??
            getLocalizedCategoryLabel(
              options.categoryId,
              localeDefinition,
              options.fallbackLabel,
            ),
          icon: buildResolvedCategoryIcon({
            icon: explicitIcon,
            fallbackIcon: options.fallbackIcon,
            iconStyle: categoryConfig?.iconStyle,
            defaultStyle: categoryIconStyle,
            customEmojiById,
          }),
          emojis: options.emojis,
        },
      });
    };

    if (resolvedRecentConfig.enabled) {
      const filteredRecent = filterEmojiWithSearchConfig(
        recentSectionEmojis,
        deferredSearchQuery,
        localeDefinition,
        searchConfig,
      );

      if (
        filteredRecent.length > 0 ||
        (resolvedRecentConfig.showWhenEmpty && !isSearching)
      ) {
        pushSection({
          categoryId: 'recent',
          fallbackLabel: labelSet.recents,
          fallbackIcon: CATEGORY_META.recent.icon,
          emojis: filteredRecent,
          fallbackOrder: getDefaultCategoryOrder('recent'),
        });
      }
    }

    for (const categoryId of CATEGORY_ORDER) {
      if (categoryId === 'recent' || categoryId === 'custom') {
        continue;
      }

      const categoryEmoji = [
        ...peekUnicodeEmojiByCategory(categoryId),
        ...(customEmojiByCategory.get(categoryId) ?? []),
      ];
      const visibleEmoji = filterEmojiWithSearchConfig(
        categoryEmoji,
        deferredSearchQuery,
        localeDefinition,
        searchConfig,
      );

      // In shard mode, keep an empty placeholder section for unloaded
      // built-in categories so the sidebar still shows their nav button.
      // Clicking it triggers the per-category shard fetch via the active
      // category effect.
      const keepEmptyPlaceholder =
        loadCategoryShards && isBuiltInCategoryId(categoryId) && !isSearching;

      if (visibleEmoji.length === 0 && !keepEmptyPlaceholder) {
        continue;
      }

      pushSection({
        categoryId,
        fallbackLabel: CATEGORY_META[categoryId].label,
        fallbackIcon: CATEGORY_META[categoryId].icon,
        emojis: visibleEmoji,
        fallbackOrder: getDefaultCategoryOrder(categoryId),
      });
    }

    for (const [categoryId, groupedEmoji] of customEmojiByCategory) {
      if (categoryId === 'recent') {
        continue;
      }

      if (isSystemCategoryId(categoryId) && categoryId !== 'custom') {
        continue;
      }

      const visibleEmoji = filterEmojiWithSearchConfig(
        groupedEmoji,
        deferredSearchQuery,
        localeDefinition,
        searchConfig,
      );

      if (visibleEmoji.length === 0) {
        continue;
      }

      pushSection({
        categoryId,
        fallbackLabel:
          groupedEmoji[0]?.categoryLabel ??
          (categoryId === 'custom'
            ? labelSet.custom
            : humanizeCategoryId(categoryId)),
        fallbackIcon: CATEGORY_META.custom.icon,
        emojis: visibleEmoji,
        fallbackOrder:
          categoryId === 'custom'
            ? getDefaultCategoryOrder('custom', customCategoryOrder)
            : customCategoryOrder++,
      });
    }

    return nextSections
      .sort((left, right) => {
        if (left.order === right.order) {
          return left.index - right.index;
        }

        return left.order - right.order;
      })
      .map((entry) => entry.section);
  }, [
    categories,
    categoryIcons,
    categoryIconStyle,
    customEmojiByCategory,
    customEmojiById,
    deferredSearchQuery,
    emojiDataSnapshot.version,
    labelSet.custom,
    labelSet.recents,
    loadCategoryShards,
    localeDefinition,
    recentSectionEmojis,
    resolvedRecentConfig.enabled,
    resolvedRecentConfig.showWhenEmpty,
  ]);
  const categoryLabelById = useMemo(
    () => new Map(sections.map((section) => [section.id, section.label])),
    [sections],
  );
  const resolveEmojiHoverColor = useCallback(
    (emoji: EmojiRenderable, state: EmojiRenderState) => {
      if (typeof colors?.emojiHover === 'function') {
        return colors.emojiHover(emoji, state);
      }

      return colors?.emojiHover;
    },
    [colors],
  );
  const resolveCategoryHoverColor = useCallback(
    (categoryId: EmojiCategoryId) => {
      if (typeof colors?.categoryHover === 'function') {
        return colors.categoryHover(categoryId);
      }

      return colors?.categoryHover;
    },
    [colors],
  );

  const setSelectedCategory = useCallback(
    (nextCategory: EmojiCategoryId) => {
      if (selectedCategory === nextCategory) {
        return;
      }

      if (!isSelectedCategoryControlled) {
        setUncontrolledSelectedCategory(nextCategory);
      }

      onSelectedCategoryChange?.(nextCategory);
      onActiveCategoryChange?.(nextCategory);
    },
    [
      isSelectedCategoryControlled,
      onActiveCategoryChange,
      onSelectedCategoryChange,
      selectedCategory,
    ],
  );

  useEffect(() => {
    if (sections.length === 0) return;

    const firstSection = sections[0];
    if (
      firstSection &&
      !sections.some((section) => section.id === selectedCategory)
    ) {
      setSelectedCategory(firstSection.id);
    }
  }, [sections, selectedCategory, setSelectedCategory]);

  const setVisibleCategory = useCallback(
    (nextCategory: EmojiCategoryId) => {
      if (visibleCategory === nextCategory) {
        return;
      }

      if (!isVisibleCategoryControlled) {
        setUncontrolledVisibleCategory(nextCategory);
      }

      onVisibleCategoryChange?.(nextCategory);
    },
    [isVisibleCategoryControlled, onVisibleCategoryChange, visibleCategory],
  );

  useEffect(() => {
    if (sections.length === 0) return;

    const firstSection = sections[0];
    if (
      firstSection &&
      !sections.some((section) => section.id === visibleCategory)
    ) {
      setVisibleCategory(firstSection.id);
    }
  }, [sections, setVisibleCategory, visibleCategory]);

  const setActiveCategory = setSelectedCategory;

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
      setVisibleCategory(id);
    },
    [setVisibleCategory],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === nextOpen) {
        return;
      }

      if (!isOpenControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange, open],
  );

  const setActiveEmojiId = useCallback(
    (emojiId: string | null) => {
      if (!isActiveEmojiControlled) {
        setUncontrolledActiveEmojiId(emojiId);
      }

      onActiveEmojiChange?.(emojiId);
    },
    [isActiveEmojiControlled, onActiveEmojiChange],
  );

  const flushHoveredEmoji = useCallback(
    (nextEmoji: EmojiRenderable | null) => {
      startTransition(() => {
        setHoveredEmoji((current) =>
          current === nextEmoji ? current : nextEmoji,
        );
        setActiveEmojiId(nextEmoji?.id ?? null);
      });
    },
    [setActiveEmojiId],
  );

  useEffect(() => {
    return () => {
      if (hoveredEmojiFrameRef.current !== null) {
        cancelAnimationFrame(hoveredEmojiFrameRef.current);
      }
    };
  }, []);

  const handleEmojiHover = useCallback(
    (emoji: EmojiRenderable | null) => {
      if (pendingHoveredEmojiRef.current === emoji) {
        return;
      }

      pendingHoveredEmojiRef.current = emoji;

      if (hoveredEmojiFrameRef.current !== null) {
        return;
      }

      hoveredEmojiFrameRef.current = requestAnimationFrame(() => {
        hoveredEmojiFrameRef.current = null;
        flushHoveredEmoji(pendingHoveredEmojiRef.current);
      });
    },
    [flushHoveredEmoji],
  );

  const handleSelectEmoji = useCallback(
    (emoji: EmojiRenderable) => {
      const selection = createEmojiSelection(
        emoji,
        skinTone,
        localeDefinition,
        {
          categoryLabel: categoryLabelById.get(emoji.categoryId),
        },
      );

      pendingHoveredEmojiRef.current = null;
      if (hoveredEmojiFrameRef.current !== null) {
        cancelAnimationFrame(hoveredEmojiFrameRef.current);
        hoveredEmojiFrameRef.current = null;
      }
      flushHoveredEmoji(null);
      onEmojiSelect?.(selection);

      if (resolvedRecentConfig.enabled) {
        const recentEntry = {
          id: emoji.id,
          custom: emoji.kind === 'custom',
          skinTone,
        };
        const nextRecentEmoji = isRecentEmojiControlled
          ? pushRecentEmojiRecord(
              recentEmoji,
              recentEntry,
              resolvedRecentConfig.limit,
            )
          : resolvedRecentStore.push(recentEntry, resolvedRecentConfig.limit);

        if (!isRecentEmojiControlled) {
          setUncontrolledRecentEmoji(nextRecentEmoji);
        }

        onRecentEmojiChange?.(nextRecentEmoji);
      }
    },
    [
      categoryLabelById,
      isRecentEmojiControlled,
      localeDefinition,
      onEmojiSelect,
      onRecentEmojiChange,
      recentEmoji,
      resolvedRecentConfig.enabled,
      resolvedRecentConfig.limit,
      resolvedRecentStore,
      skinTone,
      flushHoveredEmoji,
    ],
  );

  const handleCategoryClick = useCallback(
    (categoryId: EmojiCategoryId) => {
      setSelectedCategory(categoryId);
      gridRef.current?.scrollToCategory(categoryId, {
        behavior: categoryScrollBehavior,
      });
    },
    [categoryScrollBehavior, setSelectedCategory],
  );

  const firstVisibleEmoji =
    sections.find((section) => section.emojis.length > 0)?.emojis[0] ?? null;

  const activeEmojiFromId = activeEmojiId
    ? (() => {
        for (const section of sections) {
          for (const emoji of section.emojis) {
            if (emoji.id === activeEmojiId) {
              return emoji;
            }
          }
        }

        return null;
      })()
    : null;

  const previewEmoji =
    activeEmojiFromId ??
    hoveredEmoji ??
    sections.find(
      (section) => section.id === activeCategory && section.emojis.length > 0,
    )?.emojis[0] ??
    firstVisibleEmoji;

  const previewSelection = previewEmoji
    ? createEmojiSelection(previewEmoji, skinTone, localeDefinition, {
        categoryLabel: categoryLabelById.get(previewEmoji.categoryId),
      })
    : null;

  return {
    searchId,
    open,
    setOpen,
    trapFocus,
    closeOnEscape: shouldCloseOnEscape,
    searchQuery,
    setSearchQuery,
    searchConfig,
    skinTone,
    setSkinTone,
    activeCategory,
    setActiveCategory,
    selectedCategory,
    setSelectedCategory,
    visibleCategory,
    setVisibleCategory,
    activeEmojiId,
    setActiveEmojiId,
    hoveredEmoji,
    setHoveredEmoji,
    sections,
    previewEmoji,
    previewSelection,
    localeDefinition,
    labelSet,
    activeSpriteSheet,
    retainedSpriteSheetUrl,
    ready,
    handleSelectEmoji,
    handleCategoryClick,
    handleActiveCategoryChange,
    handleEmojiHover,
    gridRef,
    showPreview,
    showRecents: resolvedRecentConfig.enabled,
    showSkinTones,
    emojiSize,
    columns,
    value,
    renderEmoji,
    renderPreview,
    renderCategoryIcon,
    emptyState,
    unstyled,
    classNames,
    styles,
    colors,
    virtualization: effectiveVirtualization,
    deferGridMount,
    assetSource,
    gridAssetSource: resolvedGridAssetSource,
    previewAssetSource: resolvedPreviewAssetSource,
    resolveEmojiHoverColor,
    resolveCategoryHoverColor,
    autoScrollCategoriesOnHover,
    trackHoverActive: shouldTrackHoverActive,
    categoryScrollBehavior,
    loading: loading || !ready,
    recentStore: resolvedRecentStore,
    recentEmoji,
  };
}
