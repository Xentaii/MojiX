# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `registerEmojiLocalePack(locale, pack)` for registering translation packs at runtime (extends built-in locales or creates new ones).
- Subpath exports `mojix-picker/locales/en` and `mojix-picker/locales/ru` that side-effect-register the corresponding emoji translation pack.
- CI workflow (`typecheck`, `test`, `build:package`, `pack:check`) on push and PR.
- npm publish workflow with provenance, triggered on `v*` tags.
- GitHub Pages deploy workflow for the demo.
- Vitest setup with jsdom and initial smoke tests for the public surface.
- `engines.node` field and expanded keywords in `package.json`.
- `prepublishOnly` script that runs `typecheck` + `test` + `build:package`.
- `CONTRIBUTING.md`, `CHANGELOG.md`, issue/PR templates.
- README note on SSR (Next.js / Remix) usage.

### Changed

- `tsconfig.lib.json` now explicitly narrows `include` to the library surface and excludes test files.
- Built-in locale modules (`en`, `ru`) import their own generated JSON instead of a shared bundle. The generator now emits per-locale files (`emoji-locale.<code>.json`) so consumers who lazy-load locale modules no longer pull every translation into the main chunk.
- **Russian emoji translations are no longer in the default bundle.** The built-in `ru` locale still ships labels, categories, and skin-tone names. Consumers who need translated emoji names/keywords import the opt-in subpath `mojix-picker/locales/ru` (side-effect registers the pack) or pass it to the new `registerEmojiLocalePack` API. This drops the default ESM bundle from ~1,524 kB to ~874 kB (gzip ~198 kB → ~90 kB).
- Renamed `src/lib/` to `src/core/` so published type declarations no longer have the double `dist/lib/lib/...` nesting; the public `dist/lib/index.d.ts` entry is unchanged.
- Added `./locales/en` and `./locales/ru` subpath exports to `package.json`.

## [0.1.0] - Initial release

### Added

- `EmojiPicker` default preset with search, recents, skin tones, preview, and category nav.
- Headless `MojiX.*` primitives on the same engine as `EmojiPicker`.
- Pluggable asset sources: native, spritesheet, image, SVG, mixed.
- CDN and local spritesheet presets with vendor variants (`twitter`, `google`, `apple`, `facebook`).
- Runtime sprite cache with adapter hook for Electron / Tauri.
- Built-in `en` and `ru` locales with CLDR-driven emoji name/keyword data.
- Three-layer theming: CSS variables, per-slot `classNames`/`styles`, and `unstyled` mode with `[data-mx-slot]` hooks.
- ESM + CJS + type declarations, React 18 and 19 peer support.
