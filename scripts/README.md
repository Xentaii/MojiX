# Generation rules

These rules govern how `scripts/build-emoji-data.mjs` produces the JSON artifacts under `src/core/generated/`. Any future generator must follow them.

## Outputs

- `src/core/generated/emoji-data.json` — the canonical, locale-independent catalog of emoji (id, unicode, sprite coordinates, skin variations, aliases, emoticons, category).
- `src/core/generated/emoji-locales.json` — per-locale translations: `{ [locale]: { [emojiId]: { name, keywords } } }`.
- `src/core/generated/emoji-meta.json` — sprite metadata (source package version, sprite grid size).

## Sources

- Catalog: `emoji-datasource` npm package (`node_modules/emoji-datasource/emoji.json`).
- Translations: CLDR annotations (`node_modules/cldr-annotations-full/annotations/<locale>/annotations.json`).
- Flag names: `Intl.DisplayNames` (region type) for locales where CLDR does not provide annotations for regional indicator pairs.

## Supported locales

Declared via `SUPPORTED_LOCALES` in the script. Every supported locale gets a full translation map covering every emoji in the catalog — no emoji may be absent from a locale file.

## Casing rules (mandatory)

All human-readable strings in generated JSON must be in **sentence case**: the full string is lowercased, then the first character is uppercased. No `ALL CAPS`, no `Title Case`, no `camelCase` output.

Applies to:

- `emoji.name` in `emoji-data.json`.
- `emoji.name` per locale in `emoji-locales.json`.
- Every entry of `emoji.keywords` per locale.
- Derived flag labels (e.g. `Флаг: андорра`, `Flag: andorra`).

Identifiers and shortcodes (`emoji.id`, `aliases`, `emoticons`, `shortcodes`) are **not** sentence-cased — they are code-like tokens and are preserved as provided by the source.

Implementation helper: `toSentenceCase(value)` and `normalizeKeywords(values)` in `build-emoji-data.mjs`. Use these rather than ad-hoc `.toLowerCase()` calls so rules stay consistent.

## Fallback chain for a translated name

For each emoji and locale, the name is resolved in this order:

1. CLDR `tts[0]` for the emoji's native sequence. Lookup first tries the exact native string, then with `U+FE0F` variation selectors stripped.
2. For flags (category `flags`), derive a label via `Intl.DisplayNames` in the target locale: `"<flag label>: <region name>"`, where `<flag label>` is provided by `FLAG_LABEL_BY_LOCALE`.
3. The catalog `emoji.name` (already sentence-cased).

The resolved value is then run through `toSentenceCase` before being written.

## Keywords

- Source: `annotation.default` from CLDR.
- Deduplicated, trimmed, sentence-cased, empty strings removed.
- Emoji with no CLDR annotation get an empty keyword list (still present under their id).

## ID convention

Emoji ids are lowercase hyphenated unified sequences (e.g. `1f604`, `1f468-200d-1f33e`). They are stable across locales and must match between `emoji-data.json` and `emoji-locales.json`.

## Regeneration

Run `npm run emoji:data` from the project root. It is a pure function of the inputs — deleting and regenerating must produce byte-equivalent output modulo source version bumps.

## Adding a new locale

1. Ensure CLDR annotations exist at `node_modules/cldr-annotations-full/annotations/<code>/annotations.json`.
2. Add the code to `SUPPORTED_LOCALES`.
3. If needed, add a `FLAG_LABEL_BY_LOCALE[code]` entry (used for region-derived flag names).
4. Add a matching locale module under `src/core/i18n/locales/<code>.ts` that wires labels, categories, and skin-tone strings, and re-exports it from `src/core/i18n/locales/index.ts`.
5. Regenerate and commit the updated JSON artifacts.
