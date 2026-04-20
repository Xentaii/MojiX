# MojiX Bundle Size Roadmap

## Vision

`mojix-picker` should install small and boot fast. Emoji data and localizations
should travel over the CDN by default, and ship in-tree only when a consumer
opts in for offline or regulated environments. The npm package carries code,
types, and atomic opt-in data modules — never bundled JSON payloads in the main
entry.

Target shape, mirroring the approach `emoji-mart` takes for data and `frimousse`
takes for shipping:

- **default path**: install `mojix-picker`, render `<MojiX>`, data fetches from
  `cdn.jsdelivr.net/npm/mojix-picker@<version>/data/...` on first mount.
- **offline path**: `import data from 'mojix-picker/data'` and call
  `preloadEmojiData(data)` during bootstrap — bundler inlines the JSON into the
  consumer build, no runtime network access required.
- **progressive path**: import one locale and one sprite preset at a time, only
  what the UI actually uses.

## Product Principles

- default install is CDN-first; consumers never pay for data they do not use
- offline must be a first-class opt-in, not a fork
- tree-shaking is a contract: each subpath export is a pure data/config module
- ESM-only is acceptable; modern toolchains (Vite, Next 13+, Rspack, Webpack 5)
  consume it natively, Node >= 18.17 is already our engines floor
- sprite sheet images stay on `emoji-datasource-<vendor>` CDN packages, as today

## Current Status (v0.5)

Baseline measured on v0.5.1:

| Package              | Tarball | Unpacked | Files |
|----------------------|---------|----------|-------|
| `mojix-picker@0.5.1` | 1.0 MB  | 5.7 MB   | 77    |
| `emoji-mart@5.6.0`   | 421 KB  | 1.6 MB   | 11    |
| `frimousse@0.3.0`    | 66 KB   | 272 KB   | 9     |

Root causes of our size:

- `src/core/data.ts` statically imports `src/core/generated/emoji-data.json`
  (684 KB), so every consumer pays for the full dataset whether they render one
  emoji or all of them.
- Each `src/entries/locales/<code>.ts` statically imports a 176–304 KB CLDR
  translation JSON. All eight bundles ship in every tarball, doubled by the CJS
  mirror.
- `src/core/i18n/locales/index.ts` re-exports all eight locale objects into a
  single `builtinLocales` registry, blocking tree-shaking even for consumers
  who ask for one locale via a subpath.
- `vite.lib.config.ts` emits both `es` and `cjs`, and `package.json` marks every
  `./dist/lib/locales/*.cjs` in `sideEffects`.

What is already right and not in scope for this roadmap:

- sprite sheet images: `createEmojiCdnUrl()` + `createEmojiCdnSpriteSheet()`
  already resolve to jsdelivr, `warmEmojiSpriteSheet()` already caches in
  browser `Cache Storage`
- `<MojiXLoading>` slot already exists and can render during the first CDN
  fetch without new API surface
- `registerEmojiLocalePack()` is already a public API that we can reuse as the
  offline entry point

## Target Public API

### Default (CDN, zero config)

```tsx
import { MojiX } from 'mojix-picker';
import 'mojix-picker/style.css';

// emoji metadata auto-loads from jsdelivr on first mount
// <MojiXLoading> renders until the promise resolves
<MojiX locale="en" />
```

### Offline (atomic imports)

```tsx
import emojiData from 'mojix-picker/data';
import ruLocale from 'mojix-picker/locales/ru';
import twitterSprites from 'mojix-picker/sprites/twitter';
import {
  MojiX,
  preloadEmojiData,
  registerEmojiLocalePack,
} from 'mojix-picker';

preloadEmojiData(emojiData);
registerEmojiLocalePack('ru', ruLocale);

<MojiX locale="ru" spriteSheet={twitterSprites} />
```

### Custom data source

```tsx
import { MojiX, preloadEmojiData } from 'mojix-picker';

await preloadEmojiData(
  await fetch('/internal-cdn/emoji-data.json').then((r) => r.json()),
);
```

## Phases

### Phase A — async core

Turn the single statically-imported dataset into a promise-backed store so that
the library boots without any JSON at import time.

- `src/core/data.ts`: drop the static `import … from './generated/emoji-data.json'`.
  Introduce an internal `emojiDataStore`, `loadEmojiData(): Promise<...>`,
  and a synchronous `preloadEmojiData(raw)` injector.
- `src/core/data-source.ts` (new): default CDN loader pointed at
  `https://cdn.jsdelivr.net/npm/mojix-picker@${VERSION}/data/emoji-data.json`.
  Version string is inlined by Vite `define` from `package.json.version`.
- Extend `createBrowserSpriteSheetCacheAdapter` in `src/core/sprite-cache.ts`
  into a generic `createBrowserAssetCacheAdapter({ cacheName })` so that data
  and sprite caching share one implementation.
- Same shape for locales: async `loadLocale(code)` in `src/core/i18n/index.ts`
  with a CDN fallback at
  `https://cdn.jsdelivr.net/npm/mojix-picker@${VERSION}/data/locales/<code>.json`.

### Phase B — React loading state

Wire the existing `<MojiXLoading>` slot to the promise without adding new
public API.

- `src/components/MojiX.tsx` + `src/components/EmojiPicker.tsx`: on mount,
  trigger `loadEmojiData()` if the store is empty. While pending, render
  `<MojiXLoading>`. On rejection, fall back to native emoji rendering
  (`fallbackNative` path already exists on the sprite config) and emit a new
  optional `onDataError` prop.
- `src/components/useEmojiPickerState.ts`: expose a `ready` boolean derived
  from the data store so existing hooks do not need to learn about promises.

### Phase C — empty npm package + CDN mirror directory

Ship the package with code only; place JSON in `dist/data/` so jsdelivr
automatically mirrors it.

- `vite.lib.config.ts`: drop `'cjs'` from `lib.formats`. Add a copy plugin that
  emits `src/core/generated/emoji-data.json` and every
  `emoji-locale.<code>.json` into `dist/data/`. Set `minify: 'esbuild'`,
  `sourcemap: false`, `esbuild.legalComments: 'none'`.
- `package.json`: remove `main`, remove every `require` arm in `exports`, purge
  CJS entries from `sideEffects`. Expand `files` to
  `["dist/lib", "dist/data"]`.

### Phase D — atomic subpath entries

Add three new subpath families, each emitting a tiny ESM module that
re-exports exactly one piece of static data or config.

- `mojix-picker/data` — `src/entries/data.ts`:
  `export { default } from '../core/generated/emoji-data.json';`
- `mojix-picker/locales/<code>` — one file per locale, default-exporting the
  pack object instead of registering as a side effect.
- `mojix-picker/sprites/<vendor>` — one file per vendor
  (`twitter`, `google`, `apple`, `facebook`), default-exporting a
  `createEmojiCdnSpriteSheet({ vendor })` result. Tree-shakable; importing
  `/sprites/twitter` does not pull in other vendors.

Register the new entries in `vite.lib.config.ts` `lib.entry` and in the
`exports` field of `package.json`.

### Phase E — lazy locale registry

Remove the force-import barrel that defeats tree-shaking today.

- `src/core/i18n/locales/index.ts`: replace the static-import `builtinLocales`
  record with an empty `Map`, populated by `registerEmojiLocalePack()` calls
  (already a public API at `src/core/i18n/index.ts`).
- `fallbackLocaleDefinition`: inline a minimal English fallback (categories
  and skin-tone labels only, no keyword tables) directly in
  `src/core/i18n/index.ts`. The full `englishLocale` continues to live at
  `mojix-picker/locales/en` and registers when imported.
- `src/index.ts`: document that `emojiPickerLocales` now reflects only
  locales that have been explicitly registered.

### Phase F — scripts and publish hygiene

- Remove the `prepare` script from `package.json`; `prepack` already handles
  pre-publish build, and `prepare` silently runs on every local `npm install`.
- Extend `scripts/check-package.mjs` to assert `dist/data/emoji-data.json`
  is included and no `*.cjs` files exist in the tarball.
- Keep `scripts/build-emoji-data.mjs` as-is for this milestone. A follow-up
  (post-1.0) can investigate a column-oriented JSON layout for a further
  ~50% reduction.

## Critical Files

Modified:

- `src/core/data.ts` — async store + preload API
- `src/core/i18n/index.ts` — async `loadLocale`, inline English fallback
- `src/core/i18n/locales/index.ts` — lazy Map, no static imports
- `src/core/sprite-cache.ts` — generalize cache adapter for data assets
- `src/components/MojiX.tsx`, `src/components/EmojiPicker.tsx`,
  `src/components/useEmojiPickerState.ts` — loading branch, `onDataError`
- `src/entries/locales/*.ts` — switch from side-effect registration to
  `export default`
- `vite.lib.config.ts` — ESM-only, new entries, copy plugin for `dist/data/`
- `package.json` — exports, files, sideEffects, scripts
- `scripts/check-package.mjs` — updated assertions

New:

- `src/core/data-source.ts` — CDN loader factory
- `src/entries/data.ts` — atomic data module
- `src/entries/sprites/{twitter,google,apple,facebook}.ts` — vendor configs

## Verification

1. **Size check** — `npm run build:package && npm pack --dry-run`:
   - tarball ≤ 100 KB
   - unpacked ≤ 400 KB
   - `dist/data/emoji-data.json` present
   - no `.cjs` files

2. **CDN default** — new Playwright spec `tests/e2e/cdn-default.spec.ts`:
   mock `fetch` on `cdn.jsdelivr.net` to return fixture JSON, assert that
   `<MojiX>` renders after the fake fetch resolves.

3. **CDN failure** — same spec, reject the mock: assert `<MojiXLoading>`
   stays, `onDataError` fires, native emoji fallback still renders.

4. **Offline preset** — `tests/e2e/offline-preset.spec.ts`: block all network,
   bootstrap with `preloadEmojiData(await import('mojix-picker/data'))`,
   render `<MojiX>`, assert zero requests to `cdn.jsdelivr.net`.

5. **Sprite preset** — Vitest unit at
   `src/entries/sprites/__tests__/twitter.test.ts`:
   import resolves to a config with `vendor: 'twitter'` and a valid
   jsdelivr URL.

6. **Bundle graph** — run `rollup-plugin-visualizer` on the lib build;
   verify `dist/lib/index.js` does not pull in `src/core/generated/*`.

7. **Existing suites** — `npm run typecheck && npm run test` must stay green.
   Update Vitest cases that synchronously call `getUnicodeEmojiData()` with
   `preloadEmojiData(fixture)` first.

8. **Consumer smoke** — `npm pack` into a tmp dir, `npm install` the tarball,
   import `mojix-picker` in a fresh Node script; confirm no crash and the
   exports surface is intact.

## Migration Notes (CHANGELOG 1.0.0)

- **Breaking**: `getUnicodeEmojiData()` throws if called before
  `preloadEmojiData()` or a CDN resolution. Use the async loader or preload
  path.
- **Breaking**: `emojiPickerLocales` starts empty; register or import locales
  explicitly.
- **Breaking**: CJS build dropped. Consumers on Jest without ESM support need
  the `transformIgnorePatterns` recipe documented in the README.
- **Non-breaking**: sprite sheet resolution unchanged (CDN images have always
  been the default).
- **New**: `mojix-picker/data`, `mojix-picker/locales/<code>`,
  `mojix-picker/sprites/<vendor>` — optional offline imports.

## Out of Scope

- Column-oriented JSON format in `scripts/build-emoji-data.mjs`. Gives another
  ~50% off data size, but changes the rehydration path; defer to 1.1.
- A dedicated `@mojix/data` npm package. jsdelivr already mirrors
  `mojix-picker/dist/data/`; a second package would duplicate publishing
  surface without benefit.
- A separate headless entry point in the style of `frimousse`. Not requested;
  `<MojiXRoot>` already covers the headless composition surface.
