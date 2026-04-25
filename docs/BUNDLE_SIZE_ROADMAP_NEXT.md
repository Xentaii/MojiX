# MojiX Bundle Size Roadmap — Next

Continuation of [BUNDLE_SIZE_ROADMAP.md](./BUNDLE_SIZE_ROADMAP.md), which covered
the 1.0 transition (CDN-first data, atomic locale/sprite subpaths, ESM-only,
lazy locale registry). This document tracks the post-1.0 plan: the remaining
opportunities for shrinking the JS chunk and the CDN payload, with status and
measurements for what has shipped.

## Status overview

| ID  | Step                                              | Tier | Status      | Effect                                |
|-----|---------------------------------------------------|------|-------------|---------------------------------------|
| 1.1 | Minify Lucide SVG path bodies                     | 1    | **Done**    | Included in Tier 1 batch               |
| 1.2 | Collapse `merge*` duplicates in i18n              | 1    | **Done**    | Included in Tier 1 batch               |
| 1.3 | Collapse sprite factory duplicates                | 1    | **Done**    | -267 B sprite chunk raw                |
| 1.4 | Drop redundant `id` from `CATEGORY_META`          | 1    | **Done**    | Included in Tier 1 batch               |
| 1.5 | Runtime `Intl.DisplayNames` for flag names        | 1    | **Done**    | -12–16 KB per locale names pack        |
| 2.1 | Column-oriented `emoji-data.json`                 | 2    | **Done**    | -320 KB raw / -5.7 KB gzip            |
| 2.2 | Drop redundant fields from `emoji-data.json`      | 2    | **Done**    | -150 KB raw / -7.8 KB gzip             |
| 2.3 | Split "extra" Lucide icons into a preset          | 2    | **Done**    | -2.5 KB default JS graph raw          |
| 2.4 | Headless-only entry: `mojix-picker/headless`      | 2    | **Done**    | -41 KB raw for headless consumers     |
| 2.5 | Lazy virtualization in `EmojiGrid`                | 2    | Planned     | −3–6 KB JS chunk + faster first paint |
| 3.1 | Split keywords / lazy search index                | 3    | **Done**    | −60–70% locale-pack cold-start        |
| 3.2 | Vendor-split availability                         | 3    | Planned 2.0 | −15–25% data payload per vendor       |
| 3.3 | Brotli/gzip pre-compression                       | 3    | **Done**    | −76–93% on the wire (per asset)       |
| 3.4 | Locale delta-coding against English               | 3    | Planned     | −10–80 KB per locale pack             |
| 3.5 | Drop `name` from `emoji-data.json`                | 3    | Planned 2.0 | −60–100 KB raw                        |

`Done` = shipped; `Planned` = scoped, no API breaking; `Planned 2.0` = scoped
but ships as a major release because it changes the data contract.

## Baseline (post-1.0, pre-roadmap)

| Artifact                                  | Size       |
|-------------------------------------------|-----------:|
| `dist/lib/MojiX-*.js` (main shared chunk) | 88 373 B   |
| `dist/lib/index.js`                       |  5 959 B   |
| `dist/lib/sprites-*.js`                   |  8 511 B   |
| `dist/lib/style.css`                      | 10 411 B   |
| `dist/data/emoji-data.json`               | 699 552 B  |
| `dist/data/locales/*.json`                | 178–309 KB |

## Completed

### 1.1-1.4 — Tier 1 JS quick wins *(done)*

The first Tier 1 batch is implemented:

- Lucide category icon bodies are SVGO-minified and stored as compact inline
  bodies.
- The four `merge*` locale helpers are collapsed into one generic
  `mergeRecord` helper.
- Sprite CDN/local URL construction now goes through one internal
  `createSpriteSheetUrl` helper, while the public wrappers stay unchanged.
- `CATEGORY_META` no longer repeats `id`; the category key remains the source
  of truth.

The measured reduction is smaller than the original estimate because the
Lucide body table was only about 5 KB raw before optimization, so it could not
yield the projected 3-4 KB alone.

**Files:** [src/components/icons/lucideCategoryIconBodies.ts](../src/components/icons/lucideCategoryIconBodies.ts),
[src/core/i18n/index.ts](../src/core/i18n/index.ts),
[src/core/sprites.ts](../src/core/sprites.ts),
[src/core/constants.ts](../src/core/constants.ts),
[src/core/types.ts](../src/core/types.ts).

**Measured impact after step 3.1/3.3 baseline:**

| Artifact                                  | Before   | After    | Delta  |
|-------------------------------------------|---------:|---------:|-------:|
| `dist/lib/MojiX-*.js` (main shared chunk) | 90 103 B | 89 426 B | -677 B |
| `dist/lib/sprites-*.js`                   |  8 511 B |  8 244 B | -267 B |

### 1.5 + 2.2 — Runtime flag names and compact data fields *(done)*

Regional indicator flag names are no longer materialized into every locale
names pack. `getLocalizedEmojiName()` now derives them at runtime with
`Intl.DisplayNames`, and selection/search code goes through the same helper so
runtime flag names stay consistent across the picker.

`emoji-data.json` also drops the redundant top-level `unified` field and
stores vendor availability as a 4-bit mask (`apple=1`, `google=2`,
`twitter=4`, `facebook=8`). `preloadEmojiData()` normalizes the compact JSON
back into the existing runtime shape, so old offline data objects with
`unified` and boolean `availability` still work. `subcategory` is kept because
it is still part of built-in search token generation.

**Files:** [scripts/build-emoji-data.mjs](../scripts/build-emoji-data.mjs),
[src/core/data.ts](../src/core/data.ts),
[src/core/i18n/index.ts](../src/core/i18n/index.ts),
[src/core/data-source.ts](../src/core/data-source.ts),
[src/core/types.ts](../src/core/types.ts),
[src/entries/data.ts](../src/entries/data.ts).

**Measured impact after step 1.1-1.4 baseline:**

| Artifact                    | Before   | After    | Delta      |
|-----------------------------|---------:|---------:|-----------:|
| `emoji-data.json` raw       | 699 552 B| 549 828 B| -149 724 B |
| `emoji-data.json` gzip      |  69 235 B|  61 410 B|   -7 825 B |
| `emoji-data.json` Brotli    |  47 104 B|  43 386 B|   -3 718 B |
| `locales/ru.json` raw       |  91 272 B|  76 939 B|  -14 333 B |
| `locales/ru.json` Brotli    |  17 016 B|  14 605 B|   -2 411 B |
| `dist/lib/MojiX-*.js` raw   |  89 426 B|  91 156 B|   +1 730 B |

### 2.1 — Column-oriented `emoji-data.json` *(done)*

`emoji-data.json` is now emitted as a compact column payload:
`{ version, fields, categories, subcategories, skinTones, rows }`. Each row
stores the values in field order, while categories, subcategories, and skin
tone labels are referenced by numeric indexes. Skin variants are also stored as
short tuples instead of repeated objects.

`preloadEmojiData()` accepts both the old object-array shape and the new
column payload. The CDN loader and `mojix-picker/data` type declarations now
use `EmojiDataPayload`, so runtime consumers still receive the normalized
`UnicodeEmoji[]` shape after loading.

**Files:** [scripts/build-emoji-data.mjs](../scripts/build-emoji-data.mjs),
[src/core/data.ts](../src/core/data.ts),
[src/core/data-source.ts](../src/core/data-source.ts),
[src/entries/data.ts](../src/entries/data.ts),
[src/index.ts](../src/index.ts).

**Measured impact after step 1.5 + 2.2 baseline:**

| Artifact                  | Before    | After     | Delta       |
|---------------------------|----------:|----------:|------------:|
| `emoji-data.json` raw     | 549 828 B | 229 493 B | -320 335 B  |
| `emoji-data.json` gzip    |  61 410 B |  55 692 B |   -5 718 B  |
| `emoji-data.json` Brotli  |  43 386 B |  38 933 B |   -4 453 B  |
| `dist/lib/MojiX-*.js` raw |  91 156 B |  94 068 B |   +2 912 B  |
| `dist/lib/MojiX-*.js` br  |  21 653 B |  22 312 B |     +659 B  |

### 2.3 — Split extra Lucide icons into an optional preset *(done)*

The default category icon registry now ships only the system glyphs
(`recent` through `flags`) plus `custom`. The decorative extra glyphs
(`sparkles`, `star`, `heart`, `bolt`, `music`, `gamepad`, `palette`, `code`,
`leaf`, `gift`, `rocket`) moved to the optional subpath
`mojix-picker/icons/extra`.

Importing `mojix-picker/icons/extra` registers those Lucide bodies in the same
runtime registry and also exports `extraCategoryIconBodies` and
`registerExtraCategoryIconBodies`. Without the optional import, extra glyph
requests fall back to their native emoji metadata instead of pulling the extra
Lucide paths into the default bundle.

**Files:** [src/components/icons/lucideCategoryIconBodies.ts](../src/components/icons/lucideCategoryIconBodies.ts),
[src/components/icons/extraLucideCategoryIconBodies.ts](../src/components/icons/extraLucideCategoryIconBodies.ts),
[src/entries/icons/extra.ts](../src/entries/icons/extra.ts),
[src/components/EmojiCategoryIcon.tsx](../src/components/EmojiCategoryIcon.tsx),
[vite.lib.config.ts](../vite.lib.config.ts),
[package.json](../package.json).

**Measured impact after step 2.1 baseline:**

| Artifact                                  | Before   | After    | Delta    |
|-------------------------------------------|---------:|---------:|---------:|
| Default JS graph raw (`MojiX` + base icon chunk) | 94 068 B | 91 549 B | -2 519 B |
| Default JS graph gzip                     | 26 213 B | 25 148 B | -1 065 B |
| Default JS graph Brotli                   | 22 312 B | 21 629 B |   -683 B |
| Optional `icons/extra.js` raw             |        - |  3 188 B |        - |
| Optional `icons/extra.js` Brotli          |        - |  1 172 B |        - |

### 2.4 — Headless-only entry `mojix-picker/headless` *(done)*

Root/context/hooks moved into [src/components/MojiXRoot.tsx](../src/components/MojiXRoot.tsx).
[src/components/MojiX.tsx](../src/components/MojiX.tsx) now contains only the
UI slot wrappers (`Search`, `List`, `CategoryNav`, `ActiveEmoji`,
`SkinToneButton`, etc.) and re-exports the root/hooks for the existing public
API.

The new `mojix-picker/headless` subpath exports `MojiXRoot`, the headless
hooks, and a small `MojiX.Root` namespace. It does not export the styled
`EmojiPicker` preset or the slot wrappers, so headless consumers get a stable
chunk boundary around state/data/selection logic without grid/sidebar/preview
UI code.

**Files:** [src/components/MojiXRoot.tsx](../src/components/MojiXRoot.tsx),
[src/components/MojiX.tsx](../src/components/MojiX.tsx),
[src/entries/headless.ts](../src/entries/headless.ts),
[vite.lib.config.ts](../vite.lib.config.ts),
[package.json](../package.json).

**Measured impact after step 2.3 baseline:**

| Artifact                                  | Size      |
|-------------------------------------------|----------:|
| `headless.js` raw                         |     329 B |
| `MojiXRoot-*.js` raw                      |  50 369 B |
| `MojiXRoot-*.js` Brotli                   |  12 698 B |
| Default JS graph raw after split          |  91 933 B |
| Headless JS graph raw (`headless` + root) |  50 698 B |
| Headless raw savings vs default graph     | -41 235 B |

### 3.3 — Brotli/gzip pre-compression *(done)*

The library build now emits `.br` (Brotli max quality) and `.gz` (zlib best
level) variants next to every `.js` / `.json` / `.css` ≥ 1 KB in `dist/lib` and
`dist/data`. Self-hosted CDNs (Nginx, Fastly, CloudFront) negotiate the
pre-compressed file directly, so consumers get the wire savings without runtime
code changes. jsdelivr already negotiates Brotli on-the-fly, so the gain there
is mostly cosmetic, but the pre-built artifacts make the post-compression
budget visible in `pack:check`.

A short-lived attempt to switch CSS minification to `lightningcss` was rolled
back: on this codebase it produced output 0.14% larger than esbuild, so
keeping esbuild was the right call. The Brotli pre-compression is the actual
win, and it is decoupled from the CSS minifier choice.

**Files:** [vite.lib.config.ts](../vite.lib.config.ts) (`precompressDirectory`
helper, hooked into `copyBundleDataPlugin.writeBundle`),
[scripts/check-package.mjs](../scripts/check-package.mjs)
(`ensurePrecompressedAssets` asserts `.br`/`.gz` for the critical artifacts).

**Measured impact:**

| Asset                 | Raw      | gzip                | Brotli              |
|-----------------------|---------:|--------------------:|--------------------:|
| `MojiX-*.js`          | 88 373 B | 24 666 B (−72%)     | **20 963 B (−76%)** |
| `style.css`           | 10 411 B |  2 416 B (−77%)     | **2 103 B (−80%)**  |
| `emoji-data.json`     | 699 552 B| 69 235 B (−90%)     | **47 104 B (−93%)** |
| `locales/ru.json`*    | 288 939 B| 56 650 B (−80%)     | **46 691 B (−84%)** |

\* Russian locale measured before step 3.1 split it.

### 3.1 — Split keywords / lazy search index *(done)*

Each locale pack used to ship as `Record<emojiId, { name, keywords[] }>`, with
keywords accounting for ~50–60% of the file. Russian (`289 KB`) and Ukrainian
(`309 KB`) were the heaviest. The build script now emits two files per locale:

- `dist/data/locales/<code>.json` — names only (`Record<id, { name }>`)
- `dist/data/locales/<code>.search.json` — keywords only (`Record<id, string[]>`)

The runtime keeps a separate `localeKeywordIndexes` map. `loadLocale(code)`
fetches the names file as before; the search index is fetched lazily by
`loadEmojiLocaleSearchIndex(code)`, triggered only when the user starts typing
a non-empty query. Legacy `registerEmojiLocalePack` packs that contain inline
`keywords` are detected and routed into the same map for backward compat, so
existing offline integrations keep working without changes.

A new atomic subpath `mojix-picker/locales/<code>/search` is published for
each locale, mirroring the existing `mojix-picker/locales/<code>` shape, for
fully offline consumers that want to pre-load the search index.

**New public API:**
- `loadEmojiLocaleSearchIndex(locale)` — async CDN load
- `preloadEmojiLocaleSearchIndex(locale, index)` — synchronous injection
- `registerEmojiLocaleSearchIndex(locale, index)` — alias of the above

**Files:** [scripts/build-emoji-data.mjs](../scripts/build-emoji-data.mjs)
(splits names/keywords),
[src/core/types.ts](../src/core/types.ts) (`keywords?` is now optional, new
`EmojiLocaleSearchIndex` type),
[src/core/i18n/index.ts](../src/core/i18n/index.ts) (search index store +
new APIs, `getLocalizedEmojiKeywords` reads from the index first),
[src/core/data-source.ts](../src/core/data-source.ts)
(`loadEmojiLocaleSearchFromCdn`),
[src/components/useEmojiPickerState.ts](../src/components/useEmojiPickerState.ts)
(lazy load on first non-empty `searchQuery`),
[vite.lib.config.ts](../vite.lib.config.ts) (`copyBundleDataPlugin` emits
`dist/data/locales/<code>.search.json` and
`dist/lib/node/locales/<code>/search.js`),
[package.json](../package.json) (`./locales/<code>/search` exports for all
eight locales),
[src/entries/locales/<code>.search.ts](../src/entries/locales/) × 8 atomic
subpath entries.

**Measured impact (raw → Brotli):**

| Locale | Old `.json`         | New names `.json`   | Search `.json` (lazy) |
|--------|--------------------:|--------------------:|----------------------:|
| `en`   | 181 KB              | **70 KB → 14 KB**   | 105 KB → 26 KB        |
| `de`   | 200 KB              | **74 KB → 15 KB**   | 121 KB → 31 KB        |
| `es`   | 179 KB              | **76 KB → 15 KB**   | 97 KB → 24 KB         |
| `fr`   | 216 KB              | **75 KB → 15 KB**   | 136 KB → 33 KB        |
| `ja`   | 202 KB              | **74 KB → 15 KB**   | 122 KB → 29 KB        |
| `pt`   | 203 KB              | **75 KB → 15 KB**   | 122 KB → 31 KB        |
| `ru`   | 289 KB              | **91 KB → 17 KB**   | 192 KB → 37 KB        |
| `uk`   | 309 KB              | **100 KB → 18 KB**  | 204 KB → 39 KB        |

For a typical Russian-locale cold-start (no search), the locale payload drops
from ~47 KB Brotli to ~17 KB Brotli (**−64%**). If the user opens the search
field, an additional ~37 KB Brotli loads on first keystroke and is cached.

**Regressions:** main JS chunk grew by 1.5 KB (88 373 → 89 920 B) for the new
search-index API; index entry by 140 B. Net wire savings vastly outweigh this.

## Tier 1 — Quick wins *(1.1-1.4 done; 1.5 planned, no API breaking)*

Each item is roughly a half-day of work and ships in a regular minor release.

### 1.1 Minify Lucide SVG path bodies *(done)*

[src/components/icons/lucideCategoryIconBodies.ts](../src/components/icons/lucideCategoryIconBodies.ts)
inlines 22 SVG icon bodies as template literals with `\n` separators and
whitespace inside `d="..."`. Run them through `svgo`/path compaction at build
time or hand-collapse to single lines. Realistic: **−3–4 KB** in the main JS
chunk.

### 1.2 Collapse `merge*` duplicates in `i18n/index.ts` *(done)*

[src/core/i18n/index.ts](../src/core/i18n/index.ts) has four near-identical
functions: `mergeLabels`, `mergeCategories`, `mergeSkinTones`,
`mergeEmojiTranslations`. Replace with one generic `mergeRecord<T>`. Realistic:
**−0.8–1.2 KB**.

### 1.3 Collapse sprite factory duplicates in `sprites.ts` *(done)*

[src/core/sprites.ts](../src/core/sprites.ts) has five overlapping factories:
`createEmojiCdnUrl`, `createEmojiLocalUrl`, `createEmojiSpriteSheet`,
`createEmojiCdnSpriteSheet`, `createEmojiLocalSpriteSheet`. Collapse into one
internal `createSpriteSheetUrl(config, mode: 'cdn' | 'local')` and keep public
API as one-line wrappers. Realistic: **−1–2 KB**.

### 1.4 Drop redundant `id` from `CATEGORY_META` *(done)*

[src/core/constants.ts](../src/core/constants.ts) `CATEGORY_META` records every
category as `{ id, label, icon }`, but `id` duplicates the object key. Drop it,
read the key when iterating, or build `CATEGORY_META` dynamically from
`CATEGORY_ORDER` + `CATEGORY_GLYPH_META`. Realistic: **−0.5–0.8 KB**.

### 1.5 Compute flag names with `Intl.DisplayNames` at runtime *(done)*

[scripts/build-emoji-data.mjs](../scripts/build-emoji-data.mjs) materializes
"Flag: Russia"-style names into every locale pack. Stop emitting them and call
`new Intl.DisplayNames([locale], { type: 'region' })` inside the loader.
~250 flags × 8 locales × ~25 bytes ≈ **−40–60 KB** across all locale packs
(noticeable wire savings on the locale CDN endpoint; modest impact on offline
bundles).

## Tier 2 — Medium refactors *(2.1, 2.3, 2.4 done; remaining items planned, no API breaking)*

Each item is one to three days and ships as a minor release.

### 2.1 Column-oriented `emoji-data.json` *(done)*

[scripts/build-emoji-data.mjs](../scripts/build-emoji-data.mjs) now emits a
column payload instead of an array of repeated objects. The old object-array
input is still accepted by `preloadEmojiData()` for offline integrations, but
the generated CDN data uses shared field order plus dictionaries for category,
subcategory, and skin-tone references.

```json
{
  "version": 1,
  "fields": ["id","native","name","aliases","emoticons","categoryId","subcategory","sheetX","sheetY","availability","skins"],
  "categories": ["smileys", "people"],
  "subcategories": ["face-smiling"],
  "skinTones": ["light", "medium-light", "medium", "medium-dark", "dark"],
  "rows": [["1f600","😀","Grinning face",["grinning"],[":D"],0,0,32,47,15,null]]
}
```

Measured: **-320 335 B** raw, **-5 718 B** gzip, **-4 453 B** Brotli on
`emoji-data.json`. The JS rehydration layer adds **+2 912 B** raw to the main
chunk, which is much smaller than the data payload reduction.

### 2.2 Drop redundant fields from `emoji-data.json` *(done)*

- `unified` duplicates `id.toUpperCase()` — drop it.
- `subcategory` — audit call sites; if unused, drop from build output.
- `availability` as four booleans — encode as a 4-bit mask
  (`apple=1`, `google=2`, `twitter=4`, `facebook=8`). 4 fields × ~1900 emoji
  ≈ −50–80 KB raw.

Realistic combined: **−80–130 KB** on `emoji-data.json` raw.

### 2.3 Split "extra" Lucide icons into an optional preset *(done)*

[src/components/icons/lucideCategoryIconBodies.ts](../src/components/icons/lucideCategoryIconBodies.ts)
now ships only the 11 system entries (recent…flags + custom). The 11 bonus
icons (sparkles, star, heart, bolt, music, gamepad, palette, code, leaf,
gift, rocket) live behind `mojix-picker/icons/extra` as an optional import.
Measured: **-2 519 B** raw on the default JS graph
(`MojiX-*.js` + the base icon registry chunk).

### 2.4 Headless-only entry: `mojix-picker/headless` *(done)*

[src/components/MojiX.tsx](../src/components/MojiX.tsx) no longer owns the
root/context/hooks. Those moved to
[src/components/MojiXRoot.tsx](../src/components/MojiXRoot.tsx), and the new
`mojix-picker/headless` subpath exports only `MojiXRoot`, hooks, and
`MojiX.Root`. Measured headless graph: **50 698 B raw** versus **91 933 B raw**
for the default JS graph, or **-41 235 B raw** for consumers that only need
headless state/data/selection logic.

### 2.5 Lazy virtualization in `EmojiGrid`

[src/components/EmojiGrid.tsx](../src/components/EmojiGrid.tsx) (1324 lines,
38 KB source) is the biggest single contributor to the main chunk.
[src/components/gridVirtualization.ts](../src/components/gridVirtualization.ts)
is already a separate module (5.3 KB). Activate the virtualization path only
when `emojis.length > VIRTUALIZE_THRESHOLD` (e.g., 200) and let small grids
(recent + custom) render naively. Realistic: **−3–6 KB** in the initial chunk
plus faster first paint for small grids.

## Tier 3 — Big steps

### 3.2 Vendor-split availability *(planned, 2.0)*

Today every emoji record carries
`availability: { apple, google, twitter, facebook }` (4 booleans) and
`sheetX/sheetY` for each skin variant. The grid coordinates are identical
across all four vendors (the upstream `emoji-datasource` ships them on a
shared grid), but **availability differs**: some emojis exist on Apple but not
on Twitter and vice versa. With ~1900 emoji × 4 booleans, the 4-byte block is
~60–80 KB raw before compression.

**Build:** emit `dist/data/emoji-data.core.json` with the shared structural
fields (`{ id, native, cat, sub, x, y, skins[].{tone, x, y} }`) and
`dist/data/availability.<vendor>.json` containing only the IDs **missing** on
that vendor (1–5 KB per vendor — the smaller side of the bitmap).

**Public API:** `preloadEmojiData(core)` unchanged.
`createEmojiSpriteSheet({ vendor, availability })` accepts the per-vendor
table; if omitted, "available everywhere" remains the default. Vendor entries
(`mojix-picker/sprites/<vendor>`) ship the table as a side import so a single
import wires both the sprite config and its availability set.

**Effect:** `emoji-data.json` raw 700 KB → ~550–600 KB; per-vendor
availability adds 1–5 KB. Brotli savings: **−15–25%** on the data payload.
Breaking only for consumers that read the raw JSON directly via
`mojix-picker/data` — schedule for `2.0` with a deprecation warning during
`1.x`.

### 3.4 Locale delta-coding against English *(planned)*

Many emoji names overlap with English in non-English locales (especially
flags, technical symbols, abbreviations). Each locale pack still stores an
independent `{ id: name }` table. Build-time delta: emit only entries where
`localizedName !== englishName`. Runtime: `loadLocale(code)` first ensures
`en` is loaded, then merges the delta on top — `mergeEmojiTranslations` is
already there. No public API change.

**Effect:** −40–80 KB for high-overlap locales (`es`, `fr`, `pt`); −10–30 KB
for low-overlap locales (`ja`, `ru`, `uk`). Minor breaking only for consumers
that read raw `mojix-picker/locales/<code>` JSON directly.

### 3.5 Drop `name` from base `emoji-data.json` *(planned, 2.0)*

`emoji-data.json` carries the English `name` for each emoji, then
`loadLocale('en')` re-emits the same string. Drop it from the base file and
make `name` strictly locale-derived. Requires guaranteeing the English locale
is always loaded (already implicit today).

**Effect:** −60–100 KB on `emoji-data.json` raw. Breaking for consumers that
read `emoji.name` directly off the raw record. Schedule for `2.0`; deprecate
in `1.x`.

## Cumulative effect target

For a default CDN consumer using the Russian locale and Twitter sprites,
combining everything in this roadmap targets:

| Channel               | Pre-roadmap | Current           | Remaining target    |
|-----------------------|-------------|-------------------|---------------------|
| `emoji-data.json` raw | 700 KB      | 229 KB            | ~150-190 KB         |
| Locale pack raw       | 289 KB      | 77 KB             | ~60-70 KB           |
| Search index (lazy)   | —           | 192 KB raw        | 192 KB raw          |
| JS main chunk         | 88 KB       | 92 KB             | ~80-85 KB           |
| **Cold-start Brotli** | ~120 KB     | **~78 KB**        | **~45-55 KB**       |

Cold-start = data + locale (no keywords) + JS chunk + CSS, after Brotli.
Search index loads only on first keystroke and is cached.

## Recommended sequence

1. **Tier 1.1 + 1.2 + 1.3 + 1.4** — done; measured -677 B on the main chunk
   and -267 B on the sprite chunk.
2. **Tier 1.5 + 2.2** — done; measured -149 724 B raw on `emoji-data.json`
   and -14 333 B raw on `locales/ru.json`.
3. **Tier 2.1** (column format) — done; measured -320 335 B raw on
   `emoji-data.json`.
4. **Tier 2.3** (extra Lucide icon preset) — done; measured -2 519 B raw on
   the default JS graph.
5. **Tier 2.4** (headless subpath) — done; measured -41 235 B raw for
   headless consumers versus the default JS graph.
6. **Tier 2.5** (lazy virtualization) — next Tier 2 PR; changes the grid render
   path, no breaking.
7. **Tier 3.4** (locale delta) — one PR after Tier 2 lands, minor.
8. **Tier 3.2 + 3.5** — paired in `2.0`; both change the `emoji-data.json`
   contract. Add deprecation warnings in `1.x` first.

## Verification

- `npm run build:package && npm pack --dry-run` — compare tarball and unpacked
  sizes before/after every step.
- `npm run pack:check` — keeps asserting the export targets exist, no `.cjs`
  files leak in, and `.br`/`.gz` variants of the critical assets are present.
- `rollup-plugin-visualizer` on the lib build — verify the main chunk shrinks
  and lazy chunks land on the expected boundaries.
- `npm run typecheck && npm test` — must stay green.
- `gzip -c dist/lib/*.js | wc -c` and `brotli -c -q 11 dist/lib/*.js | wc -c`
  for ad-hoc on-the-wire measurements.
- Manual smoke: `npm run dev`, open the picker, pick from each category, run
  a search, switch locale, switch skin tone — covers the lazy load paths
  introduced by step 3.1.
