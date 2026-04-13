# MojiX

Universal React emoji picker with:

- compact modal-first UI
- CDN-first spritesheet delivery
- vendor presets for `twitter`, `google`, `apple`, `facebook`
- `default`, `indexed-128`, `indexed-256`, and `clean` sheet variants
- optional runtime sprite caching
- built-in i18n for picker UI and emoji names
- English-first search with selected-locale support
- asset providers for `native`, `spritesheet`, `image`, `svg`, and `mixed`
- headless primitives and hooks via `MojiX.Root`, `MojiX.Search`, `MojiX.List`, and friends
- `unstyled`, `classNames`, and slot-level `styles`
- exported structural primitives: `EmojiToolbar`, `EmojiGrid`, `EmojiPreview`, `EmojiSidebar`
- locale fallback chains and pluggable recent stores
- recents with `localStorage` persistence
- controlled or uncontrolled search, skin tone, and active category
- custom emoji support

## Development

```bash
npm install
npm run emoji:data
npm run dev
```

## Build

```bash
npm run build
```

This produces:

- `dist/demo` for the demo app
- `dist/lib` for the reusable package build

## Architecture

- `src/lib/data.ts`: normalized emoji dataset helpers and search
- `src/lib/i18n.ts`: locale resolution and localized emoji names/keywords
- `src/lib/sprites.ts`: sprite presets, URL builders, and background-position math
- `src/lib/sprite-cache.ts`: runtime cache helpers for remote sheets
- `src/lib/storage.ts`: recents and skin tone persistence
- `src/components/MojiX.tsx`: headless/composable primitives and hooks
- `src/components/useEmojiPickerState.ts`: shared picker state engine
- `src/components/EmojiPicker.tsx`: picker orchestration and public component API
- `src/components/EmojiToolbar.tsx`: search and skin tone controls
- `src/components/EmojiGrid.tsx`: virtualized emoji grid and keyboard navigation
- `src/components/EmojiPreview.tsx`: preview surface
- `src/components/EmojiSidebar.tsx`: category navigation

## CDN-First Example

```tsx
import { EmojiPicker, createEmojiSpriteSheet } from 'mojix';
import 'mojix/style.css';

export function ComposerEmojiPicker() {
  return (
    <EmojiPicker
      locale="ru"
      spriteSheet={createEmojiSpriteSheet({
        source: 'cdn',
        vendor: 'twitter',
        sheetSize: 64,
        variant: 'indexed-256',
      })}
      onEmojiSelect={(emoji) => console.log(emoji)}
    />
  );
}
```

Default CDN preset:

```txt
https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@16.0.0/img/twitter/sheets-256/64.png
```

## Asset Sources

`spriteSheet` still works, but MojiX now also supports `assetSource`, `gridAssetSource`, and `previewAssetSource`.

```tsx
import {
  EmojiPicker,
  createEmojiSpriteSheet,
  createSpriteSheetAssetSource,
  createSvgAssetSource,
} from 'mojix';

const gridAssets = createSpriteSheetAssetSource();
const previewAssets = createSvgAssetSource({
  resolveUrl: ({ emoji }) => `/emoji/svg/${emoji.id}.svg`,
});

<EmojiPicker
  spriteSheet={createEmojiSpriteSheet({
    source: 'cdn',
    vendor: 'twitter',
    sheetSize: 64,
    variant: 'indexed-256',
  })}
  gridAssetSource={gridAssets}
  previewAssetSource={previewAssets}
/>;
```

Built-in providers:

- `createNativeAssetSource()`
- `createSpriteSheetAssetSource()`
- `createImageAssetSource()`
- `createSvgAssetSource()`
- `createMixedAssetSource()`

If no asset source is provided, the picker falls back to the current `spriteSheet` behavior.

## Customization

`EmojiPicker` supports three levels of UI customization:

- theme the default UI with CSS variables and root `className`
- override individual slots with `classNames` and `styles`
- remove built-in classes with `unstyled` and style through your own selectors or `[data-mx-slot]`

```tsx
<EmojiPicker
  unstyled
  classNames={{
    root: 'my-picker',
    toolbar: 'my-toolbar',
    searchInput: 'my-search-input',
    emoji: 'my-emoji-button',
    sidebar: 'my-sidebar',
    navButton: 'my-nav-button',
  }}
  styles={{
    root: { width: 360 },
    preview: { borderTop: '1px solid var(--border)' },
  }}
/>
```

Stable slot attributes are present on structural parts such as:

- `root`
- `panel`
- `toolbar`
- `content`
- `section`
- `grid`
- `emoji`
- `preview`
- `sidebar`

Example CSS target:

```css
[data-mx-slot='emoji'][data-active='true'] {
  transform: translateY(-1px);
}
```

## Headless API

MojiX now ships a composable layer on top of the same engine that powers `EmojiPicker`.

```tsx
import { MojiX } from 'mojix';

<MojiX.Root locale="ru" fallbackLocale={['en']} columns={9}>
  <MojiX.Search />

  <MojiX.Viewport>
    <MojiX.Loading />
    <MojiX.Empty />
    <MojiX.List />
  </MojiX.Viewport>

  <MojiX.Footer>
    <MojiX.SkinToneButton />
    <MojiX.ActiveEmoji />
  </MojiX.Footer>

  <MojiX.CategoryNav />
</MojiX.Root>;
```

Available primitives:

- `MojiX.Root`
- `MojiX.Search`
- `MojiX.Viewport`
- `MojiX.List`
- `MojiX.Empty`
- `MojiX.Loading`
- `MojiX.Footer`
- `MojiX.CategoryNav`
- `MojiX.ActiveEmoji`
- `MojiX.SkinTone`
- `MojiX.SkinToneButton`

Useful hooks:

- `useMojiX()`
- `useEmojiSearch()`
- `useEmojiCategories()`
- `useEmojiSelection()`
- `useActiveEmoji()`
- `useSkinTone()`

The bundled `EmojiPicker` now acts as the reference preset built from the same public primitives.

## Controlled State

Search, skin tone, and active category can be controlled from the outside:

```tsx
import type { EmojiCategoryId, EmojiSkinTone } from 'mojix';

const [searchQuery, setSearchQuery] = useState('');
const [skinTone, setSkinTone] = useState<EmojiSkinTone>('medium');
const [activeCategory, setActiveCategory] =
  useState<EmojiCategoryId>('people');

<EmojiPicker
  searchQuery={searchQuery}
  onSearchQueryChange={setSearchQuery}
  skinTone={skinTone}
  onSkinToneChange={setSkinTone}
  activeCategory={activeCategory}
  onActiveCategoryChange={setActiveCategory}
/>;
```

If those props are omitted, MojiX keeps the current uncontrolled behavior.

## Mixed Asset Example

```tsx
import {
  EmojiPicker,
  createMixedAssetSource,
  createSpriteSheetAssetSource,
  createSvgAssetSource,
} from 'mojix';

const assetSource = createMixedAssetSource({
  unicode: createSpriteSheetAssetSource(),
  custom: createSvgAssetSource({
    resolveUrl: ({ emoji }) => `/custom-emoji/${emoji.id}.svg`,
  }),
});

<EmojiPicker assetSource={assetSource} />;
```

## Cache Warmup

```tsx
import {
  EmojiPicker,
  createEmojiSpriteSheet,
  warmEmojiSpriteSheet,
} from 'mojix';

const spriteSheet = createEmojiSpriteSheet({
  source: 'cdn',
  vendor: 'google',
  sheetSize: 64,
  variant: 'clean',
  cache: {
    enabled: true,
  },
});

await warmEmojiSpriteSheet(spriteSheet);

<EmojiPicker spriteSheet={spriteSheet} />;
```

When cache is enabled, MojiX can download the active CDN sheet and keep it in managed browser storage. On regular web apps this is the safest portable default.

If you need true file-system caching in Electron, Tauri, or another host shell, pass a custom cache adapter through `spriteSheet.cache.adapter`. The adapter decides where bytes are stored and returns a URL the renderer can use.

## Local Sprite Preset

```tsx
<EmojiPicker
  spriteSheet={createEmojiSpriteSheet({
    source: 'local',
    vendor: 'twitter',
    sheetSize: 64,
    variant: 'indexed-256',
    basePath: '/sprites',
  })}
/>
```

You can also point directly at a specific local file:

```tsx
<EmojiPicker
  spriteSheet={createEmojiLocalSpriteSheet('/sprites/twitter/sheets-256/64.png', {
    vendor: 'twitter',
    sheetSize: 64,
    variant: 'indexed-256',
  })}
/>
```

## Localization

```tsx
<EmojiPicker
  locale="ru"
  fallbackLocale={['en']}
  locales={{
    ru: {
      labels: {
        searchPlaceholder: 'Найти эмодзи',
      },
    },
  }}
/>
```

Search keeps English as the primary ranking language, while also indexing emoji names and keywords from the active locale.

`fallbackLocale` accepts either one locale code or an ordered array, so host apps can keep custom region-specific packs small and still fall back cleanly.

## Recent Store

By default, recents use `localStorage`, but you can swap the store:

```tsx
import {
  EmojiPicker,
  createLocalStorageRecentStore,
} from 'mojix';

const recentStore = createLocalStorageRecentStore('my-app:emoji-recents');

<EmojiPicker recentStore={recentStore} />;
```

This is useful when the host app wants its own persistence boundary or plans to wrap the store with desktop or cloud sync behavior.

## Structural Components

MojiX still exports the current UI building blocks too:

- `EmojiToolbar`
- `EmojiGrid`
- `EmojiPreview`
- `EmojiSidebar`
- `EmojiSearchField`
- `EmojiSkinToneButton`
- `EmojiSprite`

These work well when you want to keep the built-in layout but replace only one area.

## Migration Notes

The easiest migration path is:

1. Keep using `EmojiPicker` if the default layout still fits.
2. Move styling to `unstyled`, `classNames`, and `styles` if you only need a custom skin.
3. Move to `MojiX.Root` plus primitives when you want a different layout.

Common prop mapping:

- `searchQuery` and `onSearchQueryChange` map directly to `MojiX.Search` through `MojiX.Root`
- `skinTone` and `onSkinToneChange` map directly to `MojiX.SkinTone` or `MojiX.SkinToneButton`
- `renderEmoji` maps to `MojiX.List`
- `renderPreview` maps to `MojiX.ActiveEmoji`
- `showPreview` becomes whether you render `MojiX.ActiveEmoji`
- `showSkinTones` becomes whether you render `MojiX.SkinToneButton`
- `showRecents`, `locale`, `fallbackLocale`, `assetSource`, `spriteSheet`, and `recentStore` stay on `MojiX.Root`

## Roadmap

The long-term direction is to evolve MojiX into a layered system with a headless/composable API plus the current default UI on top.

See [docs/HEADLESS_API_ROADMAP.md](./docs/HEADLESS_API_ROADMAP.md) for:

- target public API
- asset provider direction
- localization goals
- version-by-version roadmap toward `v1.0`
