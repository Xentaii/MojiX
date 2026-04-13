# MojiX

Universal React emoji picker with:

- compact modal-first UI
- CDN-first spritesheet delivery
- vendor presets for `twitter`, `google`, `apple`, `facebook`
- `default`, `indexed-128`, `indexed-256`, and `clean` sheet variants
- optional runtime sprite caching
- built-in i18n for picker UI and emoji names
- English-first search with selected-locale support
- `unstyled`, `classNames`, and slot-level `styles`
- exported structural primitives: `EmojiToolbar`, `EmojiGrid`, `EmojiPreview`, `EmojiSidebar`
- recents with `localStorage` persistence
- controlled or uncontrolled search and skin tone
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
- `src/components/EmojiPicker.tsx`: picker orchestration and public component API
- `src/components/EmojiToolbar.tsx`: search and skin tone controls
- `src/components/EmojiGrid.tsx`: virtualized emoji grid and keyboard navigation
- `src/components/EmojiPreview.tsx`: preview surface
- `src/components/EmojiSidebar.tsx`: category navigation

## CDN-First Example

```tsx
import { EmojiPicker, createEmojiSpriteSheet } from 'mojix';
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

## Customization

`EmojiPicker` supports three levels of UI customization:

- theme the default UI with CSS variables and root `className`
- override individual slots with `classNames` and `styles`
- remove built-in classes with `unstyled` and style through your own selectors or `[data-mx-slot]`

```tsx
<EmojiPicker
  unstyled
  classNames={{
    root: 'my-picker',
    toolbar: 'my-toolbar',
    searchInput: 'my-search-input',
    emoji: 'my-emoji-button',
    sidebar: 'my-sidebar',
    navButton: 'my-nav-button',
  }}
  styles={{
    root: { width: 360 },
    preview: { borderTop: '1px solid var(--border)' },
  }}
/>
```

Stable slot attributes are present on structural parts such as:

- `root`
- `panel`
- `toolbar`
- `content`
- `section`
- `grid`
- `emoji`
- `preview`
- `sidebar`

Example CSS target:

```css
[data-mx-slot='emoji'][data-active='true'] {
  transform: translateY(-1px);
}
```

## Controlled State

Search and skin tone can be controlled from the outside:

```tsx
import type { EmojiSkinTone } from 'mojix';

const [searchQuery, setSearchQuery] = useState('');
const [skinTone, setSkinTone] = useState<EmojiSkinTone>('medium');

<EmojiPicker
  searchQuery={searchQuery}
  onSearchQueryChange={setSearchQuery}
  skinTone={skinTone}
  onSkinToneChange={setSkinTone}
/>;
```

If those props are omitted, MojiX keeps the current uncontrolled behavior.

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

## Structural Primitives

MojiX also exports the current structural components:

- `EmojiToolbar`
- `EmojiGrid`
- `EmojiPreview`
- `EmojiSidebar`
- `EmojiSprite`

These are not the final headless API yet, but they already allow advanced integrations to reuse parts of the built-in picker instead of forking it.

## Roadmap

The long-term direction is to evolve MojiX into a layered system with a headless/composable API plus the current default UI on top.

See [docs/HEADLESS_API_ROADMAP.md](./docs/HEADLESS_API_ROADMAP.md) for:

- target public API
- asset provider direction
- localization goals
- version-by-version roadmap toward `v1.0`
