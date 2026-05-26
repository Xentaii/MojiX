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

- Preload only likely first categories with
  `preloadEmojiPicker({ shards: ['smileys', 'people'] })`.
- Render with `loadCategoryShards` so the rest loads on navigation.
- Use `configureMojiXDataSource({ workerPreparation: true })` when the runtime
  supports Web Workers.
- Keep custom renderers lightweight; expensive previews belong behind
  `MojiX.ActiveEmoji`, not inside every emoji cell.

## Related Pages

- [Package Delivery](./package-delivery.md)
- [Sprite Sheets](../api/sprite-sheets.md)
- [Caching and Storage](../api/caching-and-storage.md)
- [Custom Layouts](./custom-layouts.md)
