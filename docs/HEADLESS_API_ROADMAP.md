# MojiX Headless API Roadmap

## Vision

MojiX should evolve from a single ready-made emoji picker into a layered system:

1. `Engine`: data, search, recents, skin tone, active state, asset resolution.
2. `Headless primitives`: composable React parts with no required visual design.
3. `Default UI`: the current polished picker built on top of the headless layer.
4. `Presets`: optional visual presets and delivery presets.

The goal is to make the picker usable in three ways:

- drop-in default picker
- heavily themed picker with minimal overrides
- fully custom picker assembled from built-in primitives and hooks

## Product Principles

- CDN-first by default, but not CDN-only
- native emoji, spritesheets, separate image files, and SVG should all be valid rendering strategies
- localization must cover both UI and emoji metadata
- deep customization should not require a fork
- the default UI should stay simple, but the public API should stay open

## Current Status

Today MojiX already supports:

- configurable sprite delivery and asset providers
- localized UI and emoji names
- locale fallback chains
- custom emoji
- custom preview and emoji cell rendering
- runtime cache warming for remote sheets
- `unstyled`, slot-level `classNames`, and `styles`
- controlled search, skin tone, and active category
- headless primitives and hooks through `MojiX.*`
- recent store injection for host-managed persistence

Current limitations:

- `EmojiPicker` is now composed from public primitives, but preset variations are still thin
- list row/header/body replacement is still coarse-grained
- search tokenizer/normalizer/ranker is not public yet
- preset packages and migration docs still need polish

## Target Public API

### Core Root

```tsx
import { MojiX } from "mojix";

<MojiX.Root
  locale="ru"
  columns={9}
  assetSource={twitterSheets256}
  onEmojiSelect={(emoji) => console.log(emoji)}
>
  <MojiX.Search />
  <MojiX.Viewport>
    <MojiX.Empty>No emoji found.</MojiX.Empty>
    <MojiX.List />
  </MojiX.Viewport>
  <MojiX.Footer>
    <MojiX.SkinToneButton />
    <MojiX.ActiveEmoji />
  </MojiX.Footer>
</MojiX.Root>
```

### Custom Layout

```tsx
<MojiX.Root assetSource={customSvgAssets} unstyled>
  <header className="my-picker-header">
    <MojiX.Search />
    <MojiX.SkinTone>
      {({ skinTone, setSkinTone, options }) => (
        <MyToneSelector
          value={skinTone}
          options={options}
          onChange={setSkinTone}
        />
      )}
    </MojiX.SkinTone>
  </header>

  <div className="my-picker-layout">
    <aside>
      <MojiX.CategoryNav />
    </aside>

    <MojiX.Viewport>
      <MojiX.List
        components={{
          CategoryHeader: MyCategoryHeader,
          Row: MyEmojiRow,
          Emoji: MyEmojiButton,
        }}
      />
    </MojiX.Viewport>

    <MojiX.ActiveEmoji>
      {({ emoji }) => <MyPreview emoji={emoji} />}
    </MojiX.ActiveEmoji>
  </div>
</MojiX.Root>
```

## Planned Layers

### 1. Engine Layer

The engine should become framework-friendly and UI-agnostic.

Planned exports:

- `createEmojiIndex()`
- `searchEmoji()`
- `resolveEmojiSelection()`
- `resolveEmojiAsset()`
- `createRecentEmojiStore()`
- `createSkinToneStore()`

This makes MojiX useful outside the default React UI.

### 2. Headless React Layer

The React layer should expose primitives and hooks instead of one large opinionated component.

Planned primitives:

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

Planned hooks:

- `useMojiX()`
- `useEmojiSearch()`
- `useEmojiCategories()`
- `useEmojiSelection()`
- `useActiveEmoji()`
- `useSkinTone()`
- `useEmojiAssets()`

### 3. Default UI Layer

The current `EmojiPicker` should remain as the batteries-included component, but it should be reimplemented on top of the headless API.

That keeps:

- easy onboarding
- backward-compatible adoption path
- one reference implementation for docs and QA

### 4. Asset Layer

Emoji assets should become a provider system.

Planned asset sources:

- `createNativeAssetSource()`
- `createSpriteSheetAssetSource()`
- `createImageAssetSource()`
- `createSvgAssetSource()`
- `createMixedAssetSource()`

Planned features:

- CDN-first remote spritesheets
- optional cache warmup
- local filesystem adapters for desktop hosts
- per-category or per-emoji fallback chains
- preview asset strategy separate from grid asset strategy

Example:

```tsx
const spriteAssets = createSpriteSheetAssetSource({
  vendor: "twitter",
  variant: "indexed-256",
  cache: { enabled: true },
});

const svgAssets = createSvgAssetSource({
  resolveUrl: (emoji) => `/emoji/svg/${emoji.id}.svg`,
});

const assets = createMixedAssetSource({
  unicode: spriteAssets,
  custom: svgAssets,
});
```

## Styling Model

MojiX should support three styling modes:

1. `default`: built-in styles
2. `unstyled`: no shipped visuals, only safe layout defaults when required
3. `headless`: no CSS import requirement at all

Planned styling API:

- `unstyled`
- `classNames`
- `styles`
- stable `data-*` attributes on parts
- optional CSS variables for common theming

Example:

```tsx
<MojiX.Root
  unstyled
  classNames={{
    root: "my-picker",
    search: "my-picker-search",
    viewport: "my-picker-viewport",
    emoji: "my-picker-emoji",
    categoryButton: "my-picker-category-button",
  }}
/>
```

## Localization Model

Localization should cover:

- picker labels
- category labels
- skin tone labels
- emoji names
- emoji keywords
- locale fallback chains
- custom search ranking per locale

Planned localization API:

- `locale`
- `fallbackLocale`
- `locales`
- `messages`
- `searchConfig`

Possible future extension:

```tsx
<MojiX.Root
  locale="ja"
  fallbackLocale="en"
  locales={customLocales}
  searchConfig={{
    tokenize: myTokenizer,
    normalize: myNormalizer,
    rank: myRanker,
  }}
/>
```

## State Control

To fit more host applications, major state should be controllable.

Planned controlled state:

- `search` / `defaultSearch`
- `skinTone` / `defaultSkinTone`
- `activeCategory` / `defaultActiveCategory`
- `activeEmojiId`
- `recentStore`
- `open` state for optional bundled popover wrappers in future packages

## Version Roadmap

### v0.2

Focus: open the surface without breaking the current picker.

- export internal structural parts as public components
- add `unstyled`
- add `classNames` and `styles`
- add stable `data-*` selectors
- add controlled `search` and `skinTone`
- keep `EmojiPicker` as the default bundled component

### v0.3

Focus: formalize the asset system.

- introduce `assetSource`
- support `native`, `spritesheet`, `image`, and `svg`
- support mixed asset sources
- separate grid rendering strategy from preview rendering strategy
- expose cache warmup and asset resolution hooks

### v0.4

Focus: composition baseline and localization plumbing.

- add `Root/Search/Viewport/List/Empty/Loading/Footer`
- add `CategoryNav`, `ActiveEmoji`, `SkinTone`, `SkinToneButton`
- add locale fallback chains
- expose recent emoji store interface
- expose shared picker state hooks for custom layouts

### v0.5

Focus: polish and migration.

- reimplement `EmojiPicker` using public headless primitives
- add pluggable search tokenizer/normalizer/ranker
- publish one or two official preset UIs
- add migration guide from monolithic picker props to composable API
- stabilize accessibility and keyboard contracts

### v1.0

Focus: stable customization platform.

- stable headless API
- stable asset provider API
- stable localization API
- compatibility promise for preset composition and slot naming

## Compatibility Strategy

The current monolithic `EmojiPicker` should stay supported while the new API lands.

Recommended migration path:

1. Keep `EmojiPicker` for simple adoption.
2. Add `unstyled`, `classNames`, and controlled props.
3. Export composable parts.
4. Build `EmojiPicker` itself on top of the same public primitives.

That allows existing consumers to upgrade gradually instead of rewriting their integration at once.
