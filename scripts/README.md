# Generation rules

These rules govern how `scripts/build-emoji-data.mjs` produces the JSON
artifacts under `src/core/generated/`. Any future generator must follow them.

## Outputs

- `src/core/generated/emoji-data.json` - the canonical, locale-independent
  catalog of emoji. It is stored as a column payload:
  `{ version, fields, categories, subcategories, skinTones, rows }`.
  Rows contain id, native emoji, name, aliases, emoticons, category,
  subcategory, sprite coordinates, vendor availability, and skin variations in
  field order. `unified` is derived from `id` at runtime; `availability` is
  stored as a 4-bit mask.
- `src/core/generated/emoji-locales.json` - combined per-locale name maps:
  `{ [locale]: { [emojiId]: { name } } }`.
- `src/core/generated/emoji-locale.<code>.json` - one names-only locale pack.
- `src/core/generated/emoji-locale.<code>.search.json` - one lazy keyword
  index per locale: `{ [emojiId]: string[] }`.
- `src/core/generated/emoji-meta.json` - sprite metadata: source package
  version and sprite grid size.

## Sources

- Catalog: `emoji-datasource` npm package
  (`node_modules/emoji-datasource/emoji.json`).
- Translations: CLDR annotations
  (`node_modules/cldr-annotations-full/annotations/<locale>/annotations.json`).
- Regional flag names: omitted from locale packs and computed at runtime with
  `Intl.DisplayNames`.

## Supported locales

Declared via `SUPPORTED_LOCALES` in the script. Every supported locale gets a
name map for non-regional-flag emoji and a separate lazy search index for
keyword lookup.

## Casing rules

Generated human-readable strings are sentence-cased: the full string is
lowercased, then the first character is uppercased.

Applies to:

- `emoji.name` in `emoji-data.json`.
- `emoji.name` per locale in generated locale name maps.
- Every keyword entry in generated search indexes.

Runtime regional flag labels, such as `Flag: andorra`, are sentence-cased by
the i18n layer and are not materialized into generated locale files.

Identifiers and shortcodes (`emoji.id`, `aliases`, `emoticons`, `shortcodes`)
are code-like tokens and must be preserved as provided by the source.

## Name fallback chain

For each non-regional-flag emoji and locale, the generated name is resolved in
this order:

1. CLDR `tts[0]` for the emoji's native sequence. Lookup first tries the exact
   native string, then with `U+FE0F` variation selectors stripped.
2. The catalog `emoji.name`, already sentence-cased.

The resolved value is run through `toSentenceCase` before being written.

Regional indicator flags are omitted from the generated name maps. Runtime
lookups derive `"<flag label>: <region name>"` with `Intl.DisplayNames` in
`src/core/i18n/index.ts`.

## Emoji data encoding

The generated catalog must stay column-oriented. Do not emit one object per
emoji unless the runtime compatibility layer is intentionally being changed.

- `fields` defines the order for every row.
- `categories`, `subcategories`, and `skinTones` are dictionaries referenced by
  numeric indexes from rows.
- Empty `aliases`, `emoticons`, and `skins` are stored as `null`.
- Skin variants are tuples:
  `[toneIndex, unified, native, sheetX, sheetY]`.

## Keywords

- Source: `annotation.default` from CLDR.
- Deduplicated, trimmed, sentence-cased, empty strings removed.
- Emoji with no CLDR annotation are omitted from the lazy search index.

## ID convention

Emoji ids are lowercase hyphenated unified sequences, such as `1f604` or
`1f468-200d-1f33e`. They are stable across generated catalog, locale, and
search files.

## Regeneration

Run `npm run emoji:data` from the project root. It is a pure function of the
inputs; deleting and regenerating must produce byte-equivalent output modulo
source version bumps.

## Adding a new locale

1. Ensure CLDR annotations exist at
   `node_modules/cldr-annotations-full/annotations/<code>/annotations.json`.
2. Add the code to `SUPPORTED_LOCALES`.
3. If needed, add a `FLAG_LABEL_BY_LOCALE[code]` entry in
   `src/core/i18n/index.ts` for runtime region-derived flag names.
4. Add a matching locale module under `src/core/i18n/locales/<code>.ts` that
   wires labels, categories, and skin-tone strings, and re-export it from
   `src/core/i18n/locales/index.ts`.
5. Regenerate and commit the updated JSON artifacts.
