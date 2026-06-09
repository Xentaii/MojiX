# Performance Recipes

Use these recipes as starting points for production integrations.

## Cold-Start Sensitive Popover

- Call `usePreloadMojiX({ locale, spriteSheet })` in the route shell, toolbar,
  or composer that owns the emoji button.
- Use `categoryScrollBehavior="instant"` when category clicks should snap
  without animating through intermediate sections.
- Keep `showPreview={false}` if the UI does not need preview metadata; hover
  stays CSS-only unless `trackHoverActive` is set.

```tsx
const spriteSheet = createEmojiSpriteSheet({ vendor: 'twitter' });

function ComposerShell() {
  usePreloadMojiX({ locale: 'en', spriteSheet });

  return (
    <EmojiPicker
      locale="en"
      spriteSheet={spriteSheet}
      showPreview={false}
      categoryScrollBehavior="instant"
    />
  );
}
```

## Warming A Hidden Picker At Startup

The picker body always renders while the component is mounted (visibility is the
host's concern), so you can fully warm a picker that is not on screen yet:

- Call `preloadEmojiPicker({ locale, spriteSheet, warmSpriteSheet: true })` (or
  `usePreloadMojiX(...)`) at app startup to warm data, locale, search index,
  sprite-sheet decode, and the lazy grid chunk before the picker is opened.
- Mount the picker in a hidden, inert container (e.g. a closed popover kept in
  the DOM, or `hidden`/`visibility:hidden` rather than conditional rendering) so
  its tree stays built — reopening then costs nothing.
- The grid only mounts a screenful of cells on first paint, so even a freshly
  shown picker does not create every category's cells at once.
- Add `deferGridMount` so the shell paints first and the grid arrives one frame
  later when the picker becomes visible.

```tsx
// App startup
usePreloadMojiX({ locale: 'en', spriteSheet, warmSpriteSheet: true });

// Hidden until opened; the tree (and its warmed caches) persist.
<div hidden={!open}>
  <EmojiPicker locale="en" spriteSheet={spriteSheet} deferGridMount />
</div>
```

## Huge Custom Emoji List

- Leave virtualization enabled.
- Provide stable `customEmojis`, `renderEmoji`, `classNames`, and `styles`
  references with `useMemo`/`useCallback`.
- Use `trackHoverActive={false}` when custom hover UI is pure CSS.
- Group custom emoji into categories so navigation can jump directly to each
  block.

## Tauri, Electron, And Offline Apps

- Import `mojix-picker/data` and locale subpaths during app bootstrap.
- Use `createEmojiLocalSpriteSheet(...)` with bundled sprite PNG assets.
- Warm with `preloadEmojiPicker({ spriteSheet, warmSpriteSheet: true })`
  before opening the window or popover.
- Consider `configureMojiXDataSource({ preparedCache: false })` when the app
  already ships all data locally and does not need IndexedDB persistence.

## Mobile WebView

- Prefer native emoji or a single local 64px sheet.
- Keep `columns` modest and preserve virtualization.
- Disable preview on compact layouts to reduce hover/focus state work.
- Avoid smooth category scroll on low-end devices by setting
  `categoryScrollBehavior="instant"`.

## Low-End Devices

- Set `performanceMode` (defaults to `'auto'`, which detects constrained
  devices and shrinks the render window). Force `'high'` to opt in everywhere.
- Preload only likely first categories with
  `preloadEmojiPicker({ shards: ['smileys', 'people'] })`.
- Render with `loadCategoryShards` so the rest loads on navigation.
- Use `configureMojiXDataSource({ workerPreparation: true })` when the runtime
  supports Web Workers.
- Keep custom renderers lightweight; expensive previews belong behind
  `MojiX.ActiveEmoji`, not inside every emoji cell.

## Measuring It Yourself

There is a dedicated demo route for profiling and a Playwright benchmark:

- Open `/?fixture=performance` in the demo (`npm run dev`). Append
  `&mode=high` or `&mode=balanced` to force a mode.
- In Chrome DevTools use **Performance monitor** (watch "JS event listeners"
  and style/layout recalcs while scrolling) and the **Performance** panel with
  **CPU: 6× slowdown** to emulate a weak machine.
- Run the structural checks (high mounts a lighter window than balanced;
  `auto` detects a low-core device) with `npm run test:e2e`.
- Run the timing benchmark (worst long task while scrolling under 6× CPU
  throttling) with `PERF=1 npx playwright test grid-performance`.

## Related Pages

- [Package Delivery](./package-delivery.md)
- [Sprite Sheets](../api/sprite-sheets.md)
- [Caching and Storage](../api/caching-and-storage.md)
- [Custom Layouts](./custom-layouts.md)
