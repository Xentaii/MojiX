# Localization and Data

These exports cover locale resolution, async locale/data loading, and access to
the unicode emoji dataset when it has been preloaded or fetched already.

## Localization

| Export | Kind | Description |
| --- | --- | --- |
| `emojiPickerLocales` | Constant | Registry of locale packs explicitly registered at runtime. Starts empty. |
| `getLocalizedCategoryLabel` | Function | Resolves the visible label for a category id. |
| `getLocalizedEmojiKeywords` | Function | Returns localized keyword tokens for a renderable emoji. |
| `getLocalizedEmojiName` | Function | Returns the localized display name for a renderable emoji. |
| `getLocalizedSkinToneLabel` | Function | Resolves the label for a skin-tone option. |
| `loadLocale` | Function | Loads a locale pack on demand from the package CDN mirror and registers it. |
| `registerEmojiLocalePack` | Function | Registers a locale pack or merges locale overrides into the runtime registry. |
| `resolveLocaleDefinition` | Function | Resolves the active locale plus fallback chain into a normalized locale definition. |

## Data Access

| Export | Kind | Description |
| --- | --- | --- |
| `getUnicodeEmojiData` | Function | Returns the loaded unicode emoji dataset. Throws until data is ready. |
| `loadEmojiData` | Function | Loads the unicode emoji dataset from the package CDN mirror. |
| `preloadEmojiData` | Function | Seeds the unicode emoji dataset synchronously from local JSON or fetched data. |

## Subpath Modules

| Subpath | Default Export | Purpose |
| --- | --- | --- |
| `mojix-picker/data` | emoji dataset JSON | Offline/bootstrap path for `preloadEmojiData(...)`. |
| `mojix-picker/locales/<code>` | locale translation pack JSON | Offline/bootstrap path for `registerEmojiLocalePack(...)`. |
| `mojix-picker/sprites/<vendor>` | sprite config object | Tiny CDN sprite preset for one vendor. |

## Related Types

- `EmojiLocaleCode`
- `EmojiLocaleDefinition`
- `EmojiLocaleCategoryLabels`
- `EmojiLocaleEmojiTranslation`
- `UnicodeEmoji`
