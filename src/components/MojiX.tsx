import type { HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { SKIN_TONE_OPTIONS } from '../core/constants';
import { resolveEmojiAsset } from '../core/assets';
import type {
  EmojiAssetRenderContext,
  EmojiAssetSource,
  EmojiCategoryId,
  EmojiPickerColors,
  EmojiPickerProps,
  EmojiRenderable,
  EmojiResolvedAsset,
  EmojiSelection,
  EmojiSkinTone,
} from '../core/types';
import { EmojiGrid } from './EmojiGrid';
import { EmojiPreview } from './EmojiPreview';
import { EmojiSearchField } from './EmojiSearchField';
import { EmojiSidebar } from './EmojiSidebar';
import { EmojiSkinToneButton } from './EmojiSkinToneButton';
import {
  getSlotClassName,
  getSlotStyle,
  type SlotStyleOptions,
} from './utils';
import {
  type EmojiPickerState,
  useEmojiPickerState,
} from './useEmojiPickerState';

const MojiXContext = createContext<EmojiPickerState | null>(null);

function useMojiXContext() {
  const context = useContext(MojiXContext);

  if (!context) {
    throw new Error('MojiX primitives must be used inside <MojiX.Root>.');
  }

  return context;
}

function getContextSlotOptions(
  context: EmojiPickerState,
): SlotStyleOptions {
  return {
    unstyled: context.unstyled,
    classNames: context.classNames,
    styles: context.styles,
  };
}

type RenderChild<T> = (props: T) => ReactNode;

function renderChild<T>(
  child: ReactNode | RenderChild<T> | undefined,
  props: T,
) {
  if (typeof child === 'function') {
    return (child as RenderChild<T>)(props);
  }

  return child ?? null;
}

function getRootColorStyles(colors: EmojiPickerColors | undefined) {
  if (!colors) {
    return undefined;
  }

  return {
    ['--mx-accent' as string]: colors.accent,
    ['--mx-accent-soft' as string]: colors.accentSoft,
    ['--mx-hover' as string]: colors.hover,
    ['--mx-emoji-hover' as string]:
      typeof colors.emojiHover === 'string'
        ? colors.emojiHover
        : undefined,
    ['--mx-category-hover' as string]:
      typeof colors.categoryHover === 'string'
        ? colors.categoryHover
        : undefined,
    ['--mx-category-active-bg' as string]: colors.categoryActiveBg,
    ['--mx-category-active-color' as string]: colors.categoryActiveColor,
    ['--mx-scrollbar-thumb' as string]: colors.scrollbarThumb,
    ['--mx-scrollbar-thumb-hover' as string]:
      colors.scrollbarThumbHover ??
      (typeof colors.scrollbarThumb === 'string'
        ? `color-mix(in srgb, ${colors.scrollbarThumb} 82%, var(--mx-text) 18%)`
        : undefined),
  };
}

export interface MojiXRootProps
  extends Omit<EmojiPickerProps, 'children'> {
  children?: ReactNode | RenderChild<EmojiPickerState>;
}

export function MojiXRoot({
  children,
  value,
  searchQuery,
  defaultSearchQuery,
  onSearchQueryChange,
  searchConfig,
  activeCategory,
  defaultActiveCategory,
  onActiveCategoryChange,
  activeEmojiId,
  defaultActiveEmojiId,
  onActiveEmojiChange,
  emojiSize,
  columns,
  loading,
  onDataError,
  showPreview,
  showRecents,
  showSkinTones,
  recentLimit,
  recentStorageKey,
  recentStore,
  recent,
  skinToneStorageKey,
  locale,
  fallbackLocale,
  locales,
  skinTone,
  defaultSkinTone,
  onSkinToneChange,
  labels,
  colors,
  autoScrollCategoriesOnHover,
  categories,
  categoryIcons,
  categoryIconStyle,
  spriteSheet,
  assetSource,
  gridAssetSource,
  previewAssetSource,
  customEmojis,
  emptyState,
  unstyled,
  classNames,
  styles,
  renderEmoji,
  renderPreview,
  renderCategoryIcon,
  onEmojiSelect,
  className,
  style,
  ...rest
}: MojiXRootProps) {
  const state = useEmojiPickerState({
    value,
    searchQuery,
    defaultSearchQuery,
    onSearchQueryChange,
    searchConfig,
    activeCategory,
    defaultActiveCategory,
    onActiveCategoryChange,
    activeEmojiId,
    defaultActiveEmojiId,
    onActiveEmojiChange,
    emojiSize,
    columns,
    loading,
    onDataError,
    showPreview,
    showRecents,
    showSkinTones,
    recentLimit,
    recentStorageKey,
    recentStore,
    recent,
    skinToneStorageKey,
    locale,
    fallbackLocale,
    locales,
    skinTone,
    defaultSkinTone,
    onSkinToneChange,
    labels,
    colors,
    autoScrollCategoriesOnHover,
    categories,
    categoryIcons,
    categoryIconStyle,
    spriteSheet,
    assetSource,
    gridAssetSource,
    previewAssetSource,
    customEmojis,
    emptyState,
    unstyled,
    classNames,
    styles,
    renderEmoji,
    renderPreview,
    renderCategoryIcon,
    onEmojiSelect,
  });
  const slotOptions = getContextSlotOptions(state);
  const rootColorStyles = getRootColorStyles(colors);

  return (
    <MojiXContext.Provider value={state}>
      <div
        {...rest}
        className={getSlotClassName('root', slotOptions, className)}
        style={getSlotStyle(
          'root',
          slotOptions,
          {
            ['--mx-emoji-size' as string]: `${state.emojiSize}px`,
            ['--mx-columns' as string]: `${state.columns}`,
          },
          rootColorStyles,
          style,
        )}
        data-mx-slot="root"
        data-mx-unstyled={state.unstyled ? 'true' : undefined}
        data-loading={state.loading ? 'true' : undefined}
      >
        {renderChild(children, state)}
      </div>
    </MojiXContext.Provider>
  );
}

export function useMojiX() {
  return useMojiXContext();
}

export function useEmojiSearch() {
  const context = useMojiXContext();

  return {
    searchId: context.searchId,
    searchQuery: context.searchQuery,
    setSearchQuery: context.setSearchQuery,
    labels: context.labelSet,
  };
}

export function useEmojiCategories() {
  const context = useMojiXContext();

  return {
    sections: context.sections,
    activeCategory: context.activeCategory,
    setActiveCategory: context.setActiveCategory,
    selectCategory: context.handleCategoryClick,
  };
}

export function useActiveEmoji() {
  const context = useMojiXContext();

  return {
    emoji: context.previewEmoji,
    selection: context.previewSelection,
    hoveredEmoji: context.hoveredEmoji,
    setHoveredEmoji: context.setHoveredEmoji,
    activeEmojiId: context.activeEmojiId,
    setActiveEmojiId: context.setActiveEmojiId,
  };
}

export interface UseEmojiAssetsResult {
  spriteSheet: ReturnType<typeof useMojiXContext>['activeSpriteSheet'];
  gridAssetSource: EmojiAssetSource | undefined;
  previewAssetSource: EmojiAssetSource | undefined;
  resolve: (
    emoji: EmojiRenderable,
    options?: {
      skinTone?: EmojiSkinTone;
      context?: EmojiAssetRenderContext;
      assetSource?: EmojiAssetSource;
    },
  ) => EmojiResolvedAsset | null;
}

export function useEmojiAssets(): UseEmojiAssetsResult {
  const context = useMojiXContext();

  return useMemo(
    () => ({
      spriteSheet: context.activeSpriteSheet,
      gridAssetSource: context.gridAssetSource,
      previewAssetSource: context.previewAssetSource,
      resolve(emoji, options = {}) {
        const renderContext = options.context ?? 'grid';
        const source =
          options.assetSource ??
          (renderContext === 'preview'
            ? context.previewAssetSource
            : context.gridAssetSource);

        return resolveEmojiAsset({
          emoji,
          skinTone: options.skinTone ?? context.skinTone,
          context: renderContext,
          spriteSheet: context.activeSpriteSheet,
          assetSource: source,
        });
      },
    }),
    [
      context.activeSpriteSheet,
      context.gridAssetSource,
      context.previewAssetSource,
      context.skinTone,
    ],
  );
}

export function useSkinTone() {
  const context = useMojiXContext();

  return {
    skinTone: context.skinTone,
    setSkinTone: context.setSkinTone,
    options: SKIN_TONE_OPTIONS,
    labels: context.labelSet,
    localeDefinition: context.localeDefinition,
  };
}

export function useEmojiSelection() {
  const context = useMojiXContext();

  return {
    value: context.value,
    selectEmoji: context.handleSelectEmoji,
  };
}

export interface MojiXSearchProps {
  children?: RenderChild<ReturnType<typeof useEmojiSearch>>;
}

export function MojiXSearch({ children }: MojiXSearchProps) {
  const context = useMojiXContext();
  const search = useEmojiSearch();

  if (children) {
    return <>{children(search)}</>;
  }

  return (
    <EmojiSearchField
      searchId={context.searchId}
      searchQuery={context.searchQuery}
      onSearchChange={context.setSearchQuery}
      labels={context.labelSet}
      unstyled={context.unstyled}
      classNames={context.classNames}
      styles={context.styles}
    />
  );
}

export interface MojiXViewportProps
  extends HTMLAttributes<HTMLDivElement> {}

export function MojiXViewport({
  className,
  style,
  children,
  ...rest
}: MojiXViewportProps) {
  const context = useMojiXContext();
  const slotOptions = getContextSlotOptions(context);

  return (
    <div
      {...rest}
      className={getSlotClassName('viewport', slotOptions, className)}
      style={getSlotStyle('viewport', slotOptions, style)}
      data-mx-slot="viewport"
    >
      {children}
    </div>
  );
}

export interface MojiXListProps {
  renderEmoji?: EmojiPickerProps['renderEmoji'];
  emptyState?: EmojiPickerProps['emptyState'];
  showEmptyState?: boolean;
}

export function MojiXList({
  renderEmoji,
  emptyState,
  showEmptyState = false,
}: MojiXListProps) {
  const context = useMojiXContext();

  return (
    <EmojiGrid
      ref={context.gridRef}
      sections={context.sections}
      emojiSize={context.emojiSize}
      columns={context.columns}
      skinTone={context.skinTone}
      value={context.value}
      spriteSheet={context.activeSpriteSheet}
      assetSource={context.gridAssetSource}
      localeDefinition={context.localeDefinition}
      renderEmoji={renderEmoji ?? context.renderEmoji}
      renderCategoryIcon={context.renderCategoryIcon}
      onEmojiSelect={context.handleSelectEmoji}
      onEmojiHover={context.handleEmojiHover}
      onActiveCategoryChange={context.handleActiveCategoryChange}
      hoveredEmojiId={context.hoveredEmoji?.id ?? null}
      virtualization={context.virtualization}
      emptyState={emptyState ?? context.emptyState}
      hideEmptyState={!showEmptyState}
      labels={context.labelSet}
      unstyled={context.unstyled}
      classNames={context.classNames}
      styles={context.styles}
      resolveEmojiHoverColor={context.resolveEmojiHoverColor}
    />
  );
}

export interface MojiXEmptyProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children?: ReactNode | RenderChild<{ sections: number }>;
}

export function MojiXEmpty({
  className,
  style,
  children,
  ...rest
}: MojiXEmptyProps) {
  const context = useMojiXContext();
  const slotOptions = getContextSlotOptions(context);

  if (context.loading || context.sections.length > 0) {
    return null;
  }

  return (
    <div
      {...rest}
      className={getSlotClassName('empty', slotOptions, className)}
      style={getSlotStyle('empty', slotOptions, style)}
      data-mx-slot="empty"
    >
      {renderChild(children, { sections: context.sections.length }) ??
        context.emptyState ?? (
          <>
            <strong>{context.labelSet.noResultsTitle}</strong>
            <span>{context.labelSet.noResultsBody}</span>
          </>
        )}
    </div>
  );
}

export interface MojiXLoadingProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children?: ReactNode | RenderChild<{ loading: boolean }>;
}

export function MojiXLoading({
  className,
  style,
  children,
  ...rest
}: MojiXLoadingProps) {
  const context = useMojiXContext();
  const slotOptions = getContextSlotOptions(context);

  if (!context.loading) {
    return null;
  }

  return (
    <div
      {...rest}
      className={getSlotClassName('loading', slotOptions, className)}
      style={getSlotStyle('loading', slotOptions, style)}
      data-mx-slot="loading"
    >
      {renderChild(children, { loading: context.loading }) ??
        'Loading emoji...'}
    </div>
  );
}

export interface MojiXFooterProps
  extends HTMLAttributes<HTMLDivElement> {}

export function MojiXFooter({
  className,
  style,
  children,
  ...rest
}: MojiXFooterProps) {
  const context = useMojiXContext();
  const slotOptions = getContextSlotOptions(context);

  return (
    <div
      {...rest}
      className={getSlotClassName('footer', slotOptions, className)}
      style={getSlotStyle('footer', slotOptions, style)}
      data-mx-slot="footer"
    >
      {children}
    </div>
  );
}

export interface MojiXCategoryNavProps {
  children?: RenderChild<{
    sections: EmojiPickerState['sections'];
    activeCategory: EmojiCategoryId;
    setActiveCategory: (categoryId: EmojiCategoryId) => void;
    selectCategory: (categoryId: EmojiCategoryId) => void;
  }>;
}

export function MojiXCategoryNav({ children }: MojiXCategoryNavProps) {
  const context = useMojiXContext();
  const categoryState = useEmojiCategories();

  if (children) {
    return <>{children(categoryState)}</>;
  }

  return (
    <EmojiSidebar
      sections={context.sections}
      activeCategory={context.activeCategory}
      onCategoryClick={context.handleCategoryClick}
      renderCategoryIcon={context.renderCategoryIcon}
      spriteSheet={context.activeSpriteSheet}
      unstyled={context.unstyled}
      classNames={context.classNames}
      styles={context.styles}
      resolveCategoryHoverColor={context.resolveCategoryHoverColor}
      autoScrollOnHover={context.autoScrollCategoriesOnHover}
    />
  );
}

export interface MojiXActiveEmojiProps {
  children?: RenderChild<{
    emoji: EmojiRenderable | null;
    selection: EmojiSelection | null;
  }>;
  renderPreview?: EmojiPickerProps['renderPreview'];
}

export function MojiXActiveEmoji({
  children,
  renderPreview,
}: MojiXActiveEmojiProps) {
  const context = useMojiXContext();
  const activeEmoji = useActiveEmoji();

  if (children) {
    return <>{children(activeEmoji)}</>;
  }

  return (
    <EmojiPreview
      emoji={context.previewEmoji}
      selection={context.previewSelection}
      spriteSheet={context.activeSpriteSheet}
      assetSource={context.previewAssetSource}
      renderPreview={renderPreview ?? context.renderPreview}
      unstyled={context.unstyled}
      classNames={context.classNames}
      styles={context.styles}
    />
  );
}

export interface MojiXSkinToneProps {
  children?: RenderChild<{
    skinTone: EmojiSkinTone;
    setSkinTone: (tone: EmojiSkinTone) => void;
    options: typeof SKIN_TONE_OPTIONS;
  }>;
}

export function MojiXSkinTone({ children }: MojiXSkinToneProps) {
  const skinToneState = useSkinTone();

  if (children) {
    return (
      <>{children({
        skinTone: skinToneState.skinTone,
        setSkinTone: skinToneState.setSkinTone,
        options: skinToneState.options,
      })}</>
    );
  }

  return <MojiXSkinToneButton />;
}

export interface MojiXSkinToneButtonProps {
  children?: RenderChild<ReturnType<typeof useSkinTone>>;
}

export function MojiXSkinToneButton({
  children,
}: MojiXSkinToneButtonProps = {}) {
  const context = useMojiXContext();
  const skinToneState = useSkinTone();

  if (children) {
    return <>{children(skinToneState)}</>;
  }

  return (
    <EmojiSkinToneButton
      skinTone={context.skinTone}
      onSkinToneChange={context.setSkinTone}
      labels={context.labelSet}
      localeDefinition={context.localeDefinition}
      spriteSheet={context.activeSpriteSheet}
      assetSource={context.gridAssetSource}
      unstyled={context.unstyled}
      classNames={context.classNames}
      styles={context.styles}
    />
  );
}

export const MojiX = {
  Root: MojiXRoot,
  Search: MojiXSearch,
  Viewport: MojiXViewport,
  List: MojiXList,
  Empty: MojiXEmpty,
  Loading: MojiXLoading,
  Footer: MojiXFooter,
  CategoryNav: MojiXCategoryNav,
  ActiveEmoji: MojiXActiveEmoji,
  SkinTone: MojiXSkinTone,
  SkinToneButton: MojiXSkinToneButton,
} as const;
