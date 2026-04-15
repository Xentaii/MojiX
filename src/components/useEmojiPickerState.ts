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
  isSystemCategoryId,
} from '../core/constants';
import {
  createEmojiSelection,
  filterEmoji,
  getLocalizedSearchTokens,
  getUnicodeEmojiByCategory,
  getUnicodeEmojiById,
  getUnicodeEmojiByNative,
  prepareCustomEmojis,
} from '../core/data';
import {
  getLocalizedCategoryLabel,
  resolveLocaleDefinition,
} from '../core/i18n';
import { createNativeAssetSource } from '../core/assets';
import { warmEmojiSpriteSheet } from '../core/sprite-cache';
import {
  createSpriteSheetCacheKey,
  defaultSpriteSheet,
  resolveSpriteSheetConfig,
} from '../core/sprites';
import {
  createLocalStorageRecentStore,
  readStoredSkinTone,
  writeStoredSkinTone,
} from '../core/storage';

// Used as the default asset source when the caller provides no sprite sheet
// and no explicit asset source — "just works" with native OS emoji.
const DEFAULT_NATIVE_SOURCE = createNativeAssetSource();
import type {
  EmojiCategoryConfig,
  EmojiCategoryIconConfig,
  EmojiCategoryIconInput,
  EmojiCategoryIconGlyph,
  EmojiCategoryId,
  EmojiCategoryIconPreset,
  EmojiPickerLabels,
  EmojiPickerColors,
  EmojiPickerProps,
  EmojiRenderable,
  EmojiRenderState,
  EmojiSection,
  EmojiSelection,
  EmojiSkinTone,
  EmojiRecentStore,
  PreparedCustomEmoji,
  RecentEmojiRecord,
  ResolvedEmojiCategoryIcon,
} from '../core/types';
import type { EmojiGridHandle } from './EmojiGrid';
import { peekWarmedEmojiSpriteSheetUrl } from '../core/sprite-cache';

function resolveRecentEmoji(
  recent: RecentEmojiRecord,
  customEmojiById: Map<string, PreparedCustomEmoji>,
) {
  if (recent.custom) {
    return customEmojiById.get(recent.id) ?? null;
  }

  return getUnicodeEmojiById(recent.id) ?? null;
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
      const glyphMeta = CATEGORY_GLYPH_META[
        icon as EmojiCategoryIconGlyph
      ];

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
    emoji:
      icon.emoji ??
      glyphFallback?.emoji ??
      fallbackIcon.emoji,
    emojiId:
      icon.emojiId ??
      glyphFallback?.emojiId ??
      fallbackIcon.emojiId,
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
    getUnicodeEmojiById(iconLookup) ??
    getUnicodeEmojiByNative(iconLookup) ??
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
      resolvedIconConfig.style ??
      options.iconStyle ??
      options.defaultStyle,
    renderable: resolveCategoryIconRenderable(
      resolvedIconConfig,
      options.customEmojiById,
    ),
  };
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
  renderCategoryIcon: EmojiPickerProps['renderCategoryIcon'];
  emptyState: EmojiPickerProps['emptyState'];
  unstyled: boolean;
  classNames: EmojiPickerProps['classNames'];
  styles: EmojiPickerProps['styles'];
  colors: EmojiPickerColors | undefined;
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
  loading: boolean;
  recentStore: EmojiRecentStore;
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

export function useEmojiPickerState({
  value,
  searchQuery: controlledSearchQuery,
  defaultSearchQuery = '',
  onSearchQueryChange,
  activeCategory: controlledActiveCategory,
  defaultActiveCategory,
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
  autoScrollCategoriesOnHover = true,
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
  const isSkinToneControlled = controlledSkinTone !== undefined;
  const isActiveCategoryControlled = controlledActiveCategory !== undefined;

  const resolvedSpriteSheet = useMemo(
    () => resolveSpriteSheetConfig(spriteSheetProp ?? defaultSpriteSheet),
    [spriteSheetProp],
  );
  const spriteSheetCacheKey = useMemo(
    () => createSpriteSheetCacheKey(resolvedSpriteSheet),
    [resolvedSpriteSheet],
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
    [
      recent,
      recentLimit,
      recentStorageKey,
      recentStore,
      showRecents,
    ],
  );
  const resolvedDefaultActiveCategory =
    defaultActiveCategory ??
    (resolvedRecentConfig.enabled && resolvedRecentConfig.defaultActive
      ? 'recent'
      : 'smileys');

  const [uncontrolledSearchQuery, setUncontrolledSearchQuery] =
    useState(defaultSearchQuery);
  const [recentEmoji, setRecentEmoji] = useState<RecentEmojiRecord[]>([]);
  const [uncontrolledSkinTone, setUncontrolledSkinTone] =
    useState<EmojiSkinTone>(() =>
      readStoredSkinTone(skinToneStorageKey, defaultSkinTone),
    );
  const [uncontrolledActiveCategory, setUncontrolledActiveCategory] =
    useState<EmojiCategoryId>(resolvedDefaultActiveCategory);
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiRenderable | null>(
    null,
  );
  const [runtimeSpriteAsset, setRuntimeSpriteAsset] = useState<{
    key: string;
    url: string;
  } | null>(
    () => resolveRuntimeSpriteAsset(resolvedSpriteSheet, spriteSheetCacheKey),
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
    () =>
      resolvedRecentConfig.store ??
      createLocalStorageRecentStore(resolvedRecentConfig.storageKey),
    [resolvedRecentConfig.storageKey, resolvedRecentConfig.store],
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
      setUncontrolledActiveCategory(resolvedDefaultActiveCategory);
    }
  }, [isActiveCategoryControlled, resolvedDefaultActiveCategory]);

  useEffect(() => {
    let cancelled = false;

    setRuntimeSpriteAsset(
      resolveRuntimeSpriteAsset(resolvedSpriteSheet, spriteSheetCacheKey),
    );

    if (
      !resolvedSpriteSheet.cache.enabled ||
      resolvedSpriteSheet.cache.preload !== 'mount'
    ) {
      return;
    }

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

    return () => {
      cancelled = true;
    };
  }, [resolvedSpriteSheet, spriteSheetCacheKey]);

  const activeSpriteSheet = useMemo(
    () =>
      runtimeSpriteAsset?.key === spriteSheetCacheKey
        ? { ...resolvedSpriteSheet, url: runtimeSpriteAsset.url }
        : resolvedSpriteSheet,
    [resolvedSpriteSheet, runtimeSpriteAsset, spriteSheetCacheKey],
  );
  // When the caller provides no spriteSheet and no explicit asset source, fall
  // back to native OS emoji so <EmojiPicker /> works with zero config.
  const zeroConfigSource =
    spriteSheetProp === undefined &&
    assetSource === undefined &&
    gridAssetSource === undefined
      ? DEFAULT_NATIVE_SOURCE
      : undefined;

  const resolvedGridAssetSource = gridAssetSource ?? assetSource ?? zeroConfigSource;
  const resolvedPreviewAssetSource =
    previewAssetSource ?? assetSource ?? zeroConfigSource ?? resolvedGridAssetSource;

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
          getUnicodeEmojiById(emojiId) ??
          getUnicodeEmojiByNative(emojiId) ??
          null,
      )
      .filter((emoji): emoji is EmojiRenderable => Boolean(emoji));
  }, [
    customEmojiById,
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
        order:
          categoryConfig?.order ??
          options.fallbackOrder,
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
      const filteredRecent = filterEmoji(
        recentSectionEmojis,
        deferredSearchQuery,
        (emoji) =>
          emoji.kind === 'custom'
            ? []
            : getLocalizedSearchTokens(emoji, localeDefinition),
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
        ...getUnicodeEmojiByCategory(categoryId),
        ...(customEmojiByCategory.get(categoryId) ?? []),
      ];
      const visibleEmoji = filterEmoji(
        categoryEmoji,
        deferredSearchQuery,
        (emoji) =>
          emoji.kind === 'custom'
            ? []
            : getLocalizedSearchTokens(emoji, localeDefinition),
      );

      if (visibleEmoji.length === 0) {
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

      const visibleEmoji = filterEmoji(
        groupedEmoji,
        deferredSearchQuery,
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
    labelSet.custom,
    labelSet.recents,
    localeDefinition,
    recentSectionEmojis,
    resolvedRecentConfig.enabled,
    resolvedRecentConfig.showWhenEmpty,
  ]);
  const categoryLabelById = useMemo(
    () =>
      new Map(sections.map((section) => [section.id, section.label])),
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
        {
          categoryLabel: categoryLabelById.get(emoji.categoryId),
        },
      );

      setHoveredEmoji(null);
      onEmojiSelect?.(selection);

      if (resolvedRecentConfig.enabled) {
        setRecentEmoji(
          resolvedRecentStore.push(
            {
              id: emoji.id,
              custom: emoji.kind === 'custom',
              skinTone,
            },
            resolvedRecentConfig.limit,
          ),
        );
      }
    },
    [
      categoryLabelById,
      localeDefinition,
      onEmojiSelect,
      resolvedRecentConfig.enabled,
      resolvedRecentConfig.limit,
      resolvedRecentStore,
      skinTone,
    ],
  );

  const handleCategoryClick = useCallback((categoryId: EmojiCategoryId) => {
    setActiveCategory(categoryId);
    gridRef.current?.scrollToCategory(categoryId);
  }, [setActiveCategory]);

  const firstVisibleEmoji =
    sections.find((section) => section.emojis.length > 0)?.emojis[0] ?? null;
  const previewEmoji =
    hoveredEmoji ??
    sections.find(
      (section) =>
        section.id === activeCategory && section.emojis.length > 0,
    )?.emojis[0] ??
    firstVisibleEmoji;

  const previewSelection = previewEmoji
    ? createEmojiSelection(previewEmoji, skinTone, localeDefinition, {
        categoryLabel: categoryLabelById.get(previewEmoji.categoryId),
      })
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
    assetSource,
    gridAssetSource: resolvedGridAssetSource,
    previewAssetSource: resolvedPreviewAssetSource,
    resolveEmojiHoverColor,
    resolveCategoryHoverColor,
    autoScrollCategoriesOnHover,
    loading,
    recentStore: resolvedRecentStore,
  };
}
