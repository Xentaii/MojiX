# Picker Configuration

These props are accepted by both `EmojiPicker` and `MojiX.Root`.

`EmojiPickerProps` also extends `HTMLAttributes<HTMLDivElement>`, so regular container props such as `className`, `id`, `aria-*`, and `data-*` are valid too.

## State

| Prop | Type | Purpose |
| --- | --- | --- |
| `value` | `string` | Marks an emoji id as selected in the grid. |
| `open` | `boolean` | Controlled open state for popover integrations. MojiX exposes the state and close intent; your popover decides whether to mount or hide. |
| `defaultOpen` | `boolean` | Initial open state for uncontrolled integrations. Defaults to `true`. |
| `onOpenChange` | `(open) => void` | Fired when Escape or app code requests an open-state change. |
| `searchQuery` | `string` | Controlled search value. |
| `defaultSearchQuery` | `string` | Initial search value for uncontrolled mode. |
| `onSearchQueryChange` | `(query) => void` | Fired when the search query changes. |
| `selectedCategory` | `EmojiCategoryId` | Controlled category selected by the user or by app code. |
| `defaultSelectedCategory` | `EmojiCategoryId` | Initial selected category for uncontrolled mode. |
| `onSelectedCategoryChange` | `(categoryId) => void` | Fired when the selected category changes. |
| `visibleCategory` | `EmojiCategoryId` | Controlled category currently measured in the scroll viewport. |
| `defaultVisibleCategory` | `EmojiCategoryId` | Initial visible category for uncontrolled mode. |
| `onVisibleCategoryChange` | `(categoryId) => void` | Fired when the grid scroll viewport moves to another section. |
| `activeCategory` | `EmojiCategoryId` | Legacy alias for controlled `selectedCategory`. |
| `defaultActiveCategory` | `EmojiCategoryId` | Legacy alias for `defaultSelectedCategory`. |
| `onActiveCategoryChange` | `(categoryId) => void` | Legacy alias for `onSelectedCategoryChange`. |
| `activeEmojiId` | `string \| null` | Controlled active/preview emoji id. |
| `defaultActiveEmojiId` | `string \| null` | Initial active/preview emoji id. |
| `onActiveEmojiChange` | `(emojiId) => void` | Fired when keyboard focus or tracked hover changes the active emoji. |
| `skinTone` | `EmojiSkinTone` | Controlled skin tone. |
| `defaultSkinTone` | `EmojiSkinTone` | Initial skin tone for uncontrolled mode. |
| `onSkinToneChange` | `(tone) => void` | Fired when the skin tone changes. |

`selectedCategory` and `visibleCategory` are intentionally separate. Category
navigation highlights the selected category during programmatic smooth scroll,
while `visibleCategory` can still track the section currently passing through
the viewport.

## Layout and UI

| Prop | Type | Purpose |
| --- | --- | --- |
| `emojiSize` | `number` | Render size for emoji cells. |
| `columns` | `number` | Number of emoji columns in the grid. |
| `loading` | `boolean` | Forces the loading UI on, in addition to the built-in async data loading state. |
| `showPreview` | `boolean` | Shows or hides the default bottom preview area. |
| `trackHoverActive` | `boolean` | Tracks hovered emoji in React state. Defaults to `showPreview`, so hover is CSS-only when preview is hidden. Keyboard focus is always tracked. |
| `showRecents` | `boolean` | Legacy switch for the recent category. Still supported. |
| `showSkinTones` | `boolean` | Shows or hides the skin tone control. |
| `colors` | `EmojiPickerColors` | High-level color tokens plus per-emoji/per-category hover overrides. |
| `autoScrollCategoriesOnHover` | `boolean` | Enables edge-hover autoscroll for the horizontal category row when it overflows. |
| `categoryScrollBehavior` | `"instant" \| "smooth" \| "auto"` | Controls category navigation scroll. `instant` bypasses CSS `scroll-behavior`, `smooth` animates unless reduced motion is requested, and `auto` lets CSS decide. |
| `emptyState` | `ReactNode` | Custom content for the empty state. |
| `unstyled` | `boolean` | Disables built-in styling classes. |
| `classNames` | `EmojiPickerClassNames` | Per-slot class overrides. |
| `styles` | `EmojiPickerStyles` | Per-slot inline style overrides. |
| `style` | `CSSProperties` | Root inline styles. |
| `trapFocus` | `boolean` | Opt-in focus trap for popover/dialog wrappers. Cycles Tab focus inside the root while `open` is true. |
| `closeOnEscape` | `boolean` | Controls whether Escape calls `onOpenChange(false)`. Defaults to true when `open`, `defaultOpen={false}`, or `trapFocus` makes the picker look popover-managed. |

## Theme CSS Variables

The bundled CSS exposes stable integration variables on the root element:

| Variable | Purpose |
| --- | --- |
| `--mojix-bg` | Root picker background. |
| `--mojix-bg-hover` | Default hover background for emoji and controls. |
| `--mojix-accent` | Accent color used by active category, chips, and tone state. |
| `--mojix-text` | Main text color. |
| `--mojix-border` | Border color for the root, toolbar, search field, and menus. |

Example:

```css
.composer-emoji-picker {
  --mojix-bg: var(--app-surface);
  --mojix-bg-hover: var(--app-hover);
  --mojix-accent: var(--app-accent);
  --mojix-text: var(--app-text);
  --mojix-border: var(--app-border);
}
```

## Keyboard Behavior

Emoji cells support arrow navigation, `Home`/`End`, `PageUp`/`PageDown`,
`Enter`/Space selection, and `Escape` to clear the active cell and bubble close
intent to a popover-managed root. The search field uses `Escape` to clear the
query first; a second `Escape` can close the surrounding popover through
`onOpenChange(false)`. The skin-tone menu uses labelled `menuitemradio`
options and closes itself on `Escape`.

## Recents

| Prop | Type | Purpose |
| --- | --- | --- |
| `recentLimit` | `number` | Legacy max size for recent entries. |
| `recentStorageKey` | `string` | Legacy localStorage key for recents. |
| `recentStore` | `EmojiRecentStore` | Legacy custom recent store injection. |
| `recent` | `EmojiRecentCategoryConfig` | New recent-category config block. Controls enablement, limit, sort mode, empty seeded emojis, default activation, storage key, and custom store. |
| `recentEmoji` | `RecentEmojiRecord[]` | Controlled recent entries. When provided, MojiX emits updates through `onRecentEmojiChange` instead of mutating internal recent state. |
| `defaultRecentEmoji` | `RecentEmojiRecord[]` | Initial recent entries for uncontrolled mode. |
| `onRecentEmojiChange` | `(records) => void` | Fired after selecting an emoji when recents are enabled. |

## Localization

| Prop | Type | Purpose |
| --- | --- | --- |
| `locale` | `EmojiLocaleCode` | Active locale code. |
| `fallbackLocale` | `EmojiLocaleCode \| EmojiLocaleCode[]` | Locale fallback chain. |
| `locales` | `Partial<Record<string, Partial<EmojiLocaleDefinition>>>` | Locale overrides or extra locales. |
| `labels` | `Partial<EmojiPickerLabels>` | UI text overrides. |

## Categories and Icons

| Prop | Type | Purpose |
| --- | --- | --- |
| `categories` | `Partial<Record<string, EmojiCategoryConfig>>` | Per-category overrides for label, icon, icon style, visibility, and order. |
| `categoryIcons` | `EmojiCategoryIconsMap` | Shortcut map for overriding category icons without redefining the whole category config. |
| `categoryIconStyle` | `EmojiCategoryIconPreset` | Global category icon preset. Use `outline`, `solid`, `native`, `picker`, or vendor styles like `twitter` / `google`. `mono-filled` maps to `solid`, and `mono-outline` maps to `outline` for compatibility. |

## Assets and Data

| Prop | Type | Purpose |
| --- | --- | --- |
| `spriteSheet` | `EmojiSpriteSheetConfig` | Spritesheet source and delivery config. |
| `assetSource` | `EmojiAssetSource` | Shared asset strategy for grid and preview. |
| `gridAssetSource` | `EmojiAssetSource` | Grid-only asset strategy. |
| `previewAssetSource` | `EmojiAssetSource` | Preview-only asset strategy. |
| `customEmojis` | `CustomEmoji[]` | Custom emoji records, including custom categories. |
| `loadCategoryShards` | `boolean` | When `true`, the picker fetches missing per-category data shards on demand as the user navigates. Pair with `preloadEmojiPicker({ shards: [...] })` to ship a smaller initial payload. See [Category Shards](./data-and-localization.md#category-shards-lazy-loading). |

## Virtualization

| Prop | Type | Purpose |
| --- | --- | --- |
| `virtualization` | `boolean \| EmojiPickerVirtualization` | Enables or disables row virtualization. Pass an object to fine-tune. |

`EmojiPickerVirtualization` fields:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Master switch. |
| `overscanRows` | `number` | `8` | Base number of rows to render outside the viewport. Used as a floor — adaptive overscan only grows above this when scrolling. |
| `adaptiveOverscan` | `boolean` | `true` | When enabled, overscan grows with scroll velocity (up to ~48 rows during fast wheel/trackpad bursts) and shrinks below `overscanRows` while idle. Set to `false` to keep `overscanRows` constant. |

## Rendering and Events

| Prop | Type | Purpose |
| --- | --- | --- |
| `renderEmoji` | `(emoji, state) => ReactNode` | Custom emoji cell renderer. |
| `renderPreview` | `(emoji, selection) => ReactNode` | Custom bottom preview renderer. |
| `renderCategoryIcon` | `(props) => ReactNode` | Custom category icon renderer for sidebar and section headers. |
| `onDataError` | `(error) => void` | Fired when CDN data loading fails. |
| `onEmojiSelect` | `(emoji) => void` | Fired when an emoji is selected. Returns normalized `EmojiSelection`. |

## Related Types

- `EmojiPickerProps`
- `EmojiPickerColors`
- `EmojiRecentCategoryConfig`
- `EmojiCategoryConfig`
- `EmojiCategoryIconsMap`
- `EmojiCategoryIconPreset`
