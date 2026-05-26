# Sprite Sheets

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

## Runtime Helpers

| Export | Kind | Description |
| --- | --- | --- |
| `clearEmojiSpriteStyleCache` | Function | Clears the internal cache of computed sprite tile styles. Most apps never need this; it is useful for tests or apps that rotate through many custom sheet URLs. |

## Loading Strategies

MojiX uses one physical spritesheet per picker config, so the core strategy is:
preload exactly the sheet you intend to render, then let each emoji cell address
its tile through CSS.

### Eager CDN Sheet

Use this for popovers where the first open must feel instant and the app can
fetch from the npm CDN mirror:

```ts
import {
  createEmojiSpriteSheet,
  createSpriteSheetAssetSource,
  preloadEmojiPicker,
} from 'mojix-picker';

const spriteSheet = createEmojiSpriteSheet({
  source: 'cdn',
  vendor: 'twitter',
  variant: 'indexed-256',
  sheetSize: 64,
  fallbackNative: true,
});

await preloadEmojiPicker({
  locale: 'en',
  spriteSheet,
  warmSpriteSheet: true,
});

const gridAssetSource = createSpriteSheetAssetSource();
```

### Local Sheet Override

Use this for offline, Electron, Tauri, and apps with their own asset pipeline:

```ts
import { createEmojiLocalSpriteSheet } from 'mojix-picker';

const spriteSheet = createEmojiLocalSpriteSheet('/assets/mojix-sprites', {
  vendor: 'google',
  variant: 'indexed-256',
  cache: { preload: 'mount' },
});
```

Pass a direct `.png` URL instead of a base path when your bundler fingerprints
the asset:

```ts
const spriteSheet = createEmojiLocalSpriteSheet(spritePngUrl, {
  vendor: 'apple',
});
```

### Manual / Lazy Warmup

Use `cache: { preload: 'manual' }` when the sheet should load only after an
intent signal such as pointer hover, focus, or a command-palette open:

```ts
const spriteSheet = createEmojiSpriteSheet({
  vendor: 'twitter',
  cache: { preload: 'manual' },
});

button.addEventListener('pointerenter', () => {
  void preloadEmojiPicker({ spriteSheet, warmSpriteSheet: true });
});
```

`fallbackNative: true` keeps unsupported or failed sprite scenarios usable by
falling back to native emoji where possible. For custom emoji, provide an
`imageUrl` or custom `assetSource` fallback.

## Related Types

- `EmojiSpriteSheetConfig`
- `EmojiSpriteSheetContext`
- `EmojiSpriteSheetSource`
- `EmojiSpriteSheetVariant`
- `EmojiVendor`
