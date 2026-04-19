# Migration Guide

This guide documents how to move from the monolithic `EmojiPicker` to the composable `MojiX.*` primitives, the pluggable search pipeline, and the headless engine layer introduced in v0.5.

> **Backward compatibility:** every API shipped in v0.1 remains available. `EmojiPicker`, `createLocalStorageRecentStore`, all existing props, slot names and CSS variables still work unchanged. You do not have to migrate to benefit from v0.5 — the new surface is purely additive.

## When to migrate

You probably do not need to migrate if:

- you drop `EmojiPicker` into the app with the default layout;
- you only tweak colors, locale, asset source, or sidebar icons;
- you inject a custom `recentStore` that already matches the `EmojiRecentStore` interface.

You probably want to migrate if you need any of:

- a non-default layout (popover, inline, sidebarless compact, split panes);
- search that you tokenize/normalize/rank yourself (CJK, fuzzy, per-locale ranking);
- host-driven "active emoji" state shared with other UI (preview in a different pane);
- engine logic outside a React tree (server-rendered search, a CLI, a worker).

## From monolithic `EmojiPicker` to `MojiX.*`

### Before

```tsx
import { EmojiPicker } from 'mojix-picker';
import 'mojix-picker/style.css';

<EmojiPicker
  locale="ru"
  columns={9}
  onEmojiSelect={(emoji) => console.log(emoji)}
/>;
```

### After (same UX, explicit composition)

```tsx
import { MojiX } from 'mojix-picker';
import 'mojix-picker/style.css';

<MojiX.Root
  locale="ru"
  columns={9}
  onEmojiSelect={(emoji) => console.log(emoji)}
>
  <MojiX.Search />
  <MojiX.Viewport>
    <MojiX.Loading />
    <MojiX.Empty />
    <MojiX.List />
  </MojiX.Viewport>
  <MojiX.Footer>
    <MojiX.SkinToneButton />
    <MojiX.ActiveEmoji />
  </MojiX.Footer>
  <MojiX.CategoryNav />
</MojiX.Root>;
```

The primitives share the same state hook (`useEmojiPickerState`) that backs `EmojiPicker`, so nothing changes semantically: same categories, same recents, same sprite pipeline.

### After (compact preset, no sidebar)

```tsx
import { CompactPicker } from 'mojix-picker/presets';
import 'mojix-picker/style.css';

<CompactPicker locale="ru" columns={8} />;
```

`CompactPicker` is the first official preset layout. It intentionally omits the category nav and the emoji preview, trading feature surface for footprint.

## Controlled state

v0.5 adds a third controlled pair on top of the existing `searchQuery` / `skinTone` / `activeCategory` triplet.

```tsx
const [activeEmojiId, setActiveEmojiId] = useState<string | null>(null);

<MojiX.Root
  activeEmojiId={activeEmojiId}
  onActiveEmojiChange={setActiveEmojiId}
>
  ...
</MojiX.Root>;
```

When `activeEmojiId` is provided, it drives the preview regardless of mouse hover. Host apps can now sync the preview with a second pane (documentation, history, moderation queue) without extra glue code.

Consume it from anywhere inside the tree:

```tsx
function PreviewPane() {
  const { emoji, setActiveEmojiId } = useActiveEmoji();

  return (
    <button onClick={() => setActiveEmojiId(null)}>
      Clear: {emoji?.name}
    </button>
  );
}
```

## Pluggable search

Default tokenize / normalize / rank behavior is unchanged. Override any combination via `searchConfig`:

```tsx
import type { EmojiSearchConfig } from 'mojix-picker';

const fuzzy: EmojiSearchConfig = {
  normalize: (value) => value.toLowerCase().replace(/\s+/g, ''),
  rank: ({ tokens, queryTerms }) => {
    let score = 0;
    for (const term of queryTerms) {
      const hit = tokens.some((token) => token.includes(term));
      if (!hit) return -1;
      score += 10;
    }
    return score;
  },
};

<MojiX.Root searchConfig={fuzzy}>...</MojiX.Root>;
```

All three functions are optional. Missing functions fall back to the built-in pipeline, so you can e.g. only swap `normalize` for accent-insensitive search.

## Headless engine (no React required)

The engine layer is callable outside React:

```ts
import {
  createEmojiIndex,
  createRecentEmojiStore,
  createSkinToneStore,
  resolveEmojiSelection,
  searchEmoji,
} from 'mojix-picker';

const index = createEmojiIndex({ locale: 'ru' });
const hits = index.search('сердце');
const selection = resolveEmojiSelection(hits[0], { skinTone: 'medium' });

const recents = createRecentEmojiStore({ storageKey: 'my-app:recent' });
recents.push({ id: selection.id, custom: false, skinTone: 'medium' });

const skinTone = createSkinToneStore({ defaultSkinTone: 'medium' });
skinTone.subscribe((tone) => console.log('tone changed:', tone));
```

Useful for:

- server-side search endpoints;
- sharing the same index between multiple picker instances;
- driving a non-React UI (vanilla, Svelte adapter, desktop shell).

## Asset resolution outside the grid

`useEmojiAssets()` exposes the active sprite sheet and a resolver. Use it when you need to render an emoji yourself (tooltip, notification, chat bubble) while staying consistent with the picker's asset strategy.

```tsx
function RecentChip({ emoji }) {
  const { resolve } = useEmojiAssets();
  const asset = resolve(emoji, { context: 'preview' });

  if (!asset || asset.kind !== 'image') {
    return <span>{emoji.native}</span>;
  }

  return <img src={asset.src} alt={asset.alt} />;
}
```

## Stable contracts

The following are stable as of v0.5 and will not change without a major bump:

- `MojiX.*` primitive names and their `data-mx-slot` attributes
- `EmojiPickerSlot` union (drives `classNames` / `styles`)
- CSS custom properties prefixed with `--mx-`
- Engine exports listed above and their option shapes
- `EmojiSelection` fields

Anything exported but not listed here is considered stable but may gain additional optional fields.

## Deprecations

None. v0.5 is additive. A future major release may harmonize the two recent-store factories (`createLocalStorageRecentStore` and `createRecentEmojiStore`), but both stay available for the entire 0.x line.
