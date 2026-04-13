# MojiX

Universal React emoji picker with:

- compact modal-first UI
- CDN-first spritesheet delivery
- vendor presets for `twitter`, `google`, `apple`, `facebook`
- `default`, `indexed-128`, `indexed-256`, and `clean` sheet variants
- optional runtime sprite caching
- built-in i18n for picker UI and emoji names
- English-first search with selected-locale support
- recents with `localStorage` persistence
- skin tone switching
- custom emoji support

## Development

```bash
npm install
npm run emoji:data
npm run dev
```

## Build

```bash
npm run build
```

This produces:

- `dist/demo` for the demo app
- `dist/lib` for the reusable package build

## Architecture

- `src/lib/data.ts`: normalized emoji dataset helpers and search
- `src/lib/i18n.ts`: locale resolution and localized emoji names/keywords
- `src/lib/sprites.ts`: sprite presets, URL builders, and background-position math
- `src/lib/sprite-cache.ts`: runtime cache helpers for remote sheets
- `src/lib/storage.ts`: recents and skin tone persistence
- `src/components/EmojiPicker.tsx`: picker UI and interaction state
- `src/components/EmojiSprite.tsx`: Unicode/custom emoji rendering surface

## CDN-First Example

```tsx
import {
  EmojiPicker,
  createEmojiSpriteSheet,
} from 'mojix';
import 'mojix/style.css';

export function ComposerEmojiPicker() {
  return (
    <EmojiPicker
      locale="ru"
      spriteSheet={createEmojiSpriteSheet({
        source: 'cdn',
        vendor: 'twitter',
        sheetSize: 64,
        variant: 'indexed-256',
      })}
      onEmojiSelect={(emoji) => console.log(emoji)}
    />
  );
}
```

Default CDN preset:

```txt
https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@16.0.0/img/twitter/sheets-256/64.png
```

## Cache Warmup

```tsx
import {
  EmojiPicker,
  createEmojiSpriteSheet,
  warmEmojiSpriteSheet,
} from 'mojix';

const spriteSheet = createEmojiSpriteSheet({
  source: 'cdn',
  vendor: 'google',
  sheetSize: 64,
  variant: 'clean',
  cache: {
    enabled: true,
  },
});

await warmEmojiSpriteSheet(spriteSheet);

<EmojiPicker spriteSheet={spriteSheet} />;
```

When cache is enabled, MojiX can download the active CDN sheet and keep it in managed browser storage. On regular web apps this is the safest portable default.

If you need true file-system caching in Electron, Tauri, or another host shell, pass a custom cache adapter through `spriteSheet.cache.adapter`. The adapter decides where bytes are stored and returns a URL the renderer can use.

## Local Sprite Preset

```tsx
<EmojiPicker
  spriteSheet={createEmojiSpriteSheet({
    source: 'local',
    vendor: 'twitter',
    sheetSize: 64,
    variant: 'indexed-256',
    basePath: '/sprites',
  })}
/>
```

You can also point directly at a specific local file:

```tsx
<EmojiPicker
  spriteSheet={createEmojiLocalSpriteSheet('/sprites/twitter/sheets-256/64.png', {
    vendor: 'twitter',
    sheetSize: 64,
    variant: 'indexed-256',
  })}
/>
```

## Localization

```tsx
<EmojiPicker
  locale="ru"
  locales={{
    ru: {
      labels: {
        searchPlaceholder: 'Найти эмодзи',
      },
    },
  }}
/>
```

Search keeps English as the primary ranking language, while also indexing emoji names and keywords from the active locale.
