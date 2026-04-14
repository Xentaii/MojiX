# Localization and Data

These exports cover locale resolution and access to the bundled unicode emoji dataset.

## Localization

| Export | Kind | Description |
| --- | --- | --- |
| `emojiPickerLocales` | Constant | Built-in locale map bundled with the library. |
| `getLocalizedCategoryLabel` | Function | Resolves the visible label for a category id. |
| `getLocalizedEmojiKeywords` | Function | Returns localized keyword tokens for a renderable emoji. |
| `getLocalizedEmojiName` | Function | Returns the localized display name for a renderable emoji. |
| `getLocalizedSkinToneLabel` | Function | Resolves the label for a skin-tone option. |
| `resolveLocaleDefinition` | Function | Resolves the active locale plus fallback chain into a normalized locale definition. |

## Data Access

| Export | Kind | Description |
| --- | --- | --- |
| `getUnicodeEmojiData` | Function | Returns the bundled unicode emoji dataset used by the picker. |

## Related Types

- `EmojiLocaleCode`
- `EmojiLocaleDefinition`
- `EmojiLocaleCategoryLabels`
- `EmojiLocaleEmojiTranslation`
- `UnicodeEmoji`
