# Cache and Storage

These exports cover runtime spritesheet warmup plus local persistence helpers for recents and skin tone.

## Cache Helpers

| Export | Kind | Description |
| --- | --- | --- |
| `createBrowserSpriteSheetCacheAdapter` | Function | Creates a browser cache adapter for spritesheet fetches. |
| `warmEmojiSpriteSheet` | Function | Preloads a spritesheet and returns the warmed asset descriptor. |

## Recent and Skin Tone Storage

| Export | Kind | Description |
| --- | --- | --- |
| `createLocalStorageRecentStore` | Function | Creates a recent-emoji store backed by `localStorage`. |
| `pushRecentEmoji` | Function | Inserts or updates a recent record and trims to a limit. |
| `readRecentEmoji` | Function | Reads recent emoji records from storage. |
| `writeRecentEmoji` | Function | Writes recent emoji records to storage. |
| `readStoredSkinTone` | Function | Reads a persisted skin tone with fallback handling. |
| `writeStoredSkinTone` | Function | Persists the current skin tone. |

## Related Types

- `EmojiRecentStore`
- `EmojiSpriteSheetCacheAdapter`
- `EmojiSpriteSheetCacheConfig`
- `EmojiSpriteSheetCacheMode`
- `EmojiSpriteSheetCachedAsset`
- `EmojiSpriteSheetCacheRequest`
