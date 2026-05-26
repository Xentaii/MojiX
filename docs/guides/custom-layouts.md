# Custom Layouts

MojiX can be used as a drop-in picker, a themed picker, or a fully custom
composition built from public primitives. The default `EmojiPicker` is itself
assembled on top of the same state layer exposed through `MojiX.*`.

## Choose a Layer

| Layer | Best for | Main exports |
| --- | --- | --- |
| Default picker | Fast integration with the bundled UI | `EmojiPicker` |
| Preset | Smaller opinionated layout with the same behavior | `CompactPicker` from `mojix-picker/presets` |
| Headless primitives | Custom layout with MojiX-managed state | `MojiX.Root`, `MojiX.Search`, `MojiX.List`, hooks |
| Engine helpers | Framework-agnostic search, selection, and persistence | `createEmojiIndex`, `searchEmoji`, `resolveEmojiSelection` |

## Minimal Headless Picker

```tsx
import { MojiX } from 'mojix-picker';
import 'mojix-picker/style.css';

export function CustomEmojiPicker() {
  return (
    <MojiX.Root onEmojiSelect={(emoji) => console.log(emoji)}>
      <MojiX.Search />
      <MojiX.Viewport>
        <MojiX.Empty>No emoji found.</MojiX.Empty>
        <MojiX.List />
      </MojiX.Viewport>
      <MojiX.CategoryNav />
    </MojiX.Root>
  );
}
```

## App-Fitted Layout

This example keeps MojiX state and grid behavior, but replaces the surrounding
chrome with application UI: a custom topbar, custom category nav, a remove
button, an app-styled skin-tone control, no preview, and instant category jumps.

```tsx
import { MojiX } from 'mojix-picker';
import 'mojix-picker/style.css';

export function ComposerEmojiPanel({
  onEmoji,
  onRemove,
}: {
  onEmoji: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <MojiX.Root
      className="composer-emoji-panel"
      showPreview={false}
      categoryScrollBehavior="instant"
      onEmojiSelect={(emoji) => onEmoji(emoji.native ?? emoji.id)}
    >
      <div className="composer-emoji-topbar">
        <MojiX.Search />
        <button type="button" onClick={onRemove} aria-label="Remove emoji">
          Delete
        </button>
        <MojiX.SkinTone>
          {({ skinTone, setSkinTone, options }) => (
            <div className="composer-tone-tabs">
              {options.map((option) => (
                <button
                  key={option.tone}
                  type="button"
                  aria-pressed={skinTone === option.tone}
                  onClick={() => setSkinTone(option.tone)}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          )}
        </MojiX.SkinTone>
      </div>

      <MojiX.CategoryNav>
        {({ sections, selectedCategory, visibleCategory, selectCategory }) => (
          <nav className="composer-category-nav" aria-label="Emoji categories">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                aria-current={selectedCategory === section.id}
                data-visible={visibleCategory === section.id || undefined}
                onClick={() => selectCategory(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        )}
      </MojiX.CategoryNav>

      <MojiX.Viewport>
        <MojiX.Loading />
        <MojiX.Empty>No emoji found.</MojiX.Empty>
        <MojiX.List />
      </MojiX.Viewport>
    </MojiX.Root>
  );
}
```

## Design Notes

- Start with `EmojiPicker` when the bundled layout is close enough.
- Use `classNames`, `styles`, and CSS variables before replacing structure.
- Move to `MojiX.*` when layout order, surrounding chrome, or render-prop
  access matters.
- Use engine helpers only when React UI is not the integration point.
- Use `selectedCategory` for "what the user picked" and `visibleCategory` for
  scroll-position indicators.
- Keep preview off with `showPreview={false}` for CSS-only hover, or opt back
  into hover state with `trackHoverActive`.

## Related Pages

- [Headless Primitives](../api/headless-primitives.md)
- [Picker Configuration](../api/picker-configuration.md)
- [Components](../api/components.md)
