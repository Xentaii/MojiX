# Sprite Helpers

These exports help build and describe emoji spritesheet delivery.

## Sprite Builders

| Export | Kind | Description |
| --- | --- | --- |
| `createEmojiSpriteSheet` | Function | Normalizes a full spritesheet config from partial input. |
| `createEmojiCdnSpriteSheet` | Function | Builds a CDN-backed spritesheet config. |
| `createEmojiLocalSpriteSheet` | Function | Builds a local-path spritesheet config. |
| `defaultSpriteSheet` | Constant | Default CDN sprite config used by the picker when no custom strategy is provided. |

## URL Helpers

| Export | Kind | Description |
| --- | --- | --- |
| `createEmojiCdnUrl` | Function | Builds a CDN URL for a vendor sheet. |
| `createEmojiLocalUrl` | Function | Builds a local URL for a vendor sheet. |
| `resolveVendorPackageName` | Function | Maps a vendor to the underlying `emoji-datasource-*` package name. |

## Related Types

- `EmojiSpriteSheetConfig`
- `EmojiSpriteSheetContext`
- `EmojiSpriteSheetSource`
- `EmojiSpriteSheetVariant`
- `EmojiVendor`
