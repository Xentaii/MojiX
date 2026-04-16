<div align="center">

# MojiX

**Universal React emoji picker with spritesheet delivery, headless primitives, and first-class theming.**

[![npm](https://img.shields.io/npm/v/mojix-picker?style=flat-square)](https://www.npmjs.com/package/mojix-picker)
[![downloads](https://img.shields.io/npm/dm/mojix-picker?style=flat-square)](https://www.npmjs.com/package/mojix-picker)
[![bundle size](https://img.shields.io/bundlephobia/minzip/mojix-picker?style=flat-square)](https://bundlephobia.com/package/mojix-picker)
[![CI](https://img.shields.io/github/actions/workflow/status/Xentaii/MojiX/ci.yml?branch=main&style=flat-square)](https://github.com/Xentaii/MojiX/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/mojix-picker?style=flat-square)](./LICENSE)
[![React](https://img.shields.io/badge/react-18%20%7C%2019-61dafb?style=flat-square)](https://react.dev)

[Features](#features) • [Install](#install) • [Quick start](#quick-start) • [Headless](#headless-api) • [Theming](#theming) • [SSR](#ssr-nextjs--remix) • [Docs](./docs/api/README.md) • [Live demo](https://xentaii.github.io/MojiX/)

<!-- TODO: replace with real screenshot / GIF before 1.0 -->
<!-- ![MojiX picker demo](./docs/assets/demo.png) -->


</div>

---

## Features

- Compact modal-first picker with recent, skin tone, search, preview, and category navigation out of the box.
- **CDN-first spritesheet delivery** with vendor presets (`twitter`, `google`, `apple`, `facebook`) and `default` / `indexed-128` / `indexed-256` / `clean` variants.
- **Pluggable asset sources** — native, spritesheet, image, SVG, and mixed providers — decoupled from the sprite config.
- **Headless API** (`MojiX.Root`, `MojiX.Search`, `MojiX.List`, …) on the same engine that powers `EmojiPicker`.
- **Three-level theming**: CSS variables, per-slot `classNames` / `styles`, or fully `unstyled` with stable `[data-mx-slot]` hooks.
- Built-in **i18n** for picker chrome and emoji names/keywords, with fallback chains and override hooks.
- Controlled or uncontrolled search, skin tone, and active category.
- Custom emoji categories with per-category icons.
- Recents with `localStorage` persistence or a pluggable recent store.
- Runtime sprite caching with optional adapter for Electron / Tauri filesystems.
- Ships types, ESM, and CJS builds; React 18 and 19 supported.

## Install

```bash
npm install mojix-picker
```

```tsx
import { EmojiPicker } from 'mojix-picker';
import 'mojix-picker/style.css';
```

`react` and `react-dom` are peer dependencies.

## Quick start

```tsx
import { EmojiPicker, createEmojiSpriteSheet } from 'mojix-picker';
import 'mojix-picker/style.css';

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
      onEmojiSelect={(emoji) => console.log(emoji.native, emoji.shortcodes)}
    />
  );
}
```

Default CDN resolution:

```
https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@16.0.0/img/twitter/sheets-256/64.png
```

## Asset sources

```tsx
import {
  EmojiPicker,
  createEmojiSpriteSheet,
  createSpriteSheetAssetSource,
  createSvgAssetSource,
} from 'mojix-picker';

<EmojiPicker
  spriteSheet={createEmojiSpriteSheet({
    source: 'cdn',
    vendor: 'twitter',
    sheetSize: 64,
    variant: 'indexed-256',
  })}
  gridAssetSource={createSpriteSheetAssetSource()}
  previewAssetSource={createSvgAssetSource({
    resolveUrl: ({ emoji }) => `/emoji/svg/${emoji.id}.svg`,
  })}
/>;
```

Providers: `createNativeAssetSource`, `createSpriteSheetAssetSource`, `createImageAssetSource`, `createSvgAssetSource`, `createMixedAssetSource`. If no source is passed, the picker keeps the existing `spriteSheet` behavior.

## Headless API

```tsx
import { MojiX } from 'mojix-picker';

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

Primitives: `MojiX.Root`, `Search`, `Viewport`, `List`, `Empty`, `Loading`, `Footer`, `CategoryNav`, `ActiveEmoji`, `SkinTone`, `SkinToneButton`.

Hooks: `useMojiX`, `useEmojiSearch`, `useEmojiCategories`, `useEmojiSelection`, `useActiveEmoji`, `useSkinTone`.

`EmojiPicker` itself is a preset composed from these primitives, so anything the built-in UI can do is reachable headlessly.

## Theming

Three layers, pick whatever fits:

1. **CSS variables** on the root — the fastest way to reskin.
2. **Per-slot `classNames` and `styles`** — fine-grained targeting without unmounting.
3. **`unstyled` + `[data-mx-slot]`** — drop every built-in rule and style from scratch.

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

Stable slot attributes: `root`, `panel`, `toolbar`, `content`, `section`, `grid`, `emoji`, `preview`, `sidebar`, plus full list in the API docs.

```css
[data-mx-slot='emoji'][data-active='true'] {
  transform: translateY(-1px);
}
```

## SSR (Next.js / Remix)

MojiX touches `window` and `localStorage` when reading recents and skin tone state, and it renders `<img>` tags that only materialize in the browser. Mount it client-side:

```tsx
// app/components/EmojiPicker.client.tsx  (Next.js App Router)
'use client';
export { EmojiPicker } from 'mojix-picker';
```

```tsx
// pages/_app.tsx  (Next.js Pages Router)
import dynamic from 'next/dynamic';

export const EmojiPicker = dynamic(
  () => import('mojix-picker').then((m) => m.EmojiPicker),
  { ssr: false },
);
```

For Remix / React Router data APIs, wrap the picker in a `ClientOnly` boundary or guard with `typeof window !== 'undefined'`. A custom `recentStore` is the clean extension point if you need persistence on the server side.

## Controlled state

```tsx
import type { EmojiCategoryId, EmojiSkinTone } from 'mojix-picker';

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

Omit any of those props to get the default uncontrolled behavior.

## Localization

```tsx
<EmojiPicker
  locale="ru"
  fallbackLocale={['en']}
  locales={{
    ru: {
      labels: { searchPlaceholder: 'Найти эмодзи' },
    },
  }}
/>
```

- Built-in locales: `en` (full, included by default), `ru` (chrome labels included; emoji translations ship as an opt-in subpath to keep the default bundle small). Each locale module lives at [src/core/i18n/locales](./src/core/i18n/locales) and composes labels, category names, skin-tone names, and translated emoji names/keywords generated from CLDR.
- To enable translated Russian emoji names and keywords, side-effect-import the subpath once at app boot:

  ```ts
  import 'mojix-picker/locales/ru';
  ```

  This registers the pack into the global locale registry. If you prefer explicit registration:

  ```ts
  import { russianEmojiPack } from 'mojix-picker/locales/ru';
  import { registerEmojiLocalePack } from 'mojix-picker';

  registerEmojiLocalePack('ru', russianEmojiPack);
  ```
- Search keeps English as the ranking language while also indexing names and keywords in the active locale.
- `fallbackLocale` accepts a single code or an ordered array so region-specific packs stay small.
- See [scripts/README.md](./scripts/README.md) for the rules that govern generated translation data (sentence case, CLDR fallback chain, flag derivation, adding a locale).

## Cache warmup

```tsx
import {
  EmojiPicker,
  createEmojiSpriteSheet,
  warmEmojiSpriteSheet,
} from 'mojix-picker';

const spriteSheet = createEmojiSpriteSheet({
  source: 'cdn',
  vendor: 'google',
  sheetSize: 64,
  variant: 'clean',
  cache: { enabled: true },
});

await warmEmojiSpriteSheet(spriteSheet);

<EmojiPicker spriteSheet={spriteSheet} />;
```

When cache is enabled, MojiX downloads the active CDN sheet into managed browser storage. For Electron / Tauri pass a custom adapter via `spriteSheet.cache.adapter`.

## Local sprite preset

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

Or target a specific file directly:

```tsx
<EmojiPicker
  spriteSheet={createEmojiLocalSpriteSheet(
    '/sprites/twitter/sheets-256/64.png',
    { vendor: 'twitter', sheetSize: 64, variant: 'indexed-256' },
  )}
/>
```

## Recent store

```tsx
import {
  EmojiPicker,
  createLocalStorageRecentStore,
} from 'mojix-picker';

const recentStore = createLocalStorageRecentStore('my-app:emoji-recents');

<EmojiPicker recentStore={recentStore} />;
```

Useful when the host app wants its own persistence boundary or plans to wrap the store with desktop or cloud sync.

## Structural components

For smaller surgical replacements you can reach for the UI building blocks directly: `EmojiToolbar`, `EmojiGrid`, `EmojiPreview`, `EmojiSidebar`, `EmojiSearchField`, `EmojiSkinToneButton`, `EmojiSprite`.

## Project structure

```
src/
├── components/              React layer (EmojiPicker, MojiX primitives, slots)
│   ├── MojiX.tsx            Headless composable primitives
│   ├── EmojiPicker.tsx      Default preset
│   ├── useEmojiPickerState.ts
│   └── Emoji{Grid,Toolbar,Sidebar,Preview,Sprite,…}.tsx
├── lib/
│   ├── data.ts              Emoji dataset helpers and search
│   ├── i18n/                Locale resolution and translation modules
│   │   ├── index.ts         resolveLocaleDefinition, getters
│   │   └── locales/         en.ts, ru.ts, index.ts
│   ├── sprites.ts           Sprite presets, URL builders, math
│   ├── sprite-cache.ts      Runtime sheet cache
│   ├── storage.ts           Recents / skin tone persistence
│   ├── assets.ts            Asset source providers
│   ├── types.ts             Public types
│   └── generated/           Build artifact (gitignored)
├── demo/                    Playground app used by `npm run dev`
└── index.ts                 Public entry
scripts/
└── build-emoji-data.mjs     Generator for src/core/generated/*
```

`src/core/generated/` is a build artifact — regenerated by the `prepare` script after install, or manually with `npm run emoji:data`.

## Development

```bash
git clone https://github.com/Xentaii/MojiX
cd MojiX
npm install         # also runs scripts/build-emoji-data.mjs via `prepare`
npm run dev         # launch the playground
```

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server for the demo playground |
| `npm run emoji:data` | Regenerate `src/core/generated/` from `emoji-datasource` + CLDR |
| `npm run typecheck` | Strict TypeScript check for the app and library projects |
| `npm run build:demo` | Build the playground |
| `npm run build:lib` | Build the publishable library (ESM + CJS + types) |
| `npm run build:package` | Regenerate data and build only the npm package artifacts |
| `npm run build` | Data generation + demo build + library build |
| `npm run pack:check` | Run `npm pack --dry-run` against the current package layout |
| `npm run test` | Run vitest (jsdom) |
| `npm run test:watch` | Run vitest in watch mode |

### How published packages stay self-contained

`npm publish` ships only the `dist/lib/` directory (see `files` in `package.json`). Generated JSON under `src/core/generated/` is imported statically, so Vite inlines it into the library bundle — consumers don't need `emoji-datasource`, CLDR data, or the generator script at install time. Re-generation is only for people cloning the repo to develop MojiX itself.

## Docs

- [API reference](./docs/api/README.md) — structured public surface, slots, hooks, primitives.
- [Headless API roadmap](./docs/HEADLESS_API_ROADMAP.md) — long-term direction.
- [Generation rules](./scripts/README.md) — conventions for the generated dataset.
- [Changelog](./CHANGELOG.md) — version history.
- [Contributing](./CONTRIBUTING.md) — setup, scripts, release process.

## Migration notes

1. Keep using `EmojiPicker` when the default layout fits.
2. Move styling to `unstyled` + `classNames` + `styles` when you only need a custom skin.
3. Move to `MojiX.Root` + primitives when you want a different layout.

Prop → primitive mapping:

- `searchQuery` / `onSearchQueryChange` → `MojiX.Search` inside `MojiX.Root`
- `skinTone` / `onSkinToneChange` → `MojiX.SkinTone` or `MojiX.SkinToneButton`
- `renderEmoji` → `MojiX.List`
- `renderPreview` → `MojiX.ActiveEmoji`
- `showPreview` → whether you render `MojiX.ActiveEmoji`
- `showSkinTones` → whether you render `MojiX.SkinToneButton`
- `showRecents`, `locale`, `fallbackLocale`, `assetSource`, `spriteSheet`, `recentStore` stay on `MojiX.Root`

## License

[MIT](./LICENSE)
