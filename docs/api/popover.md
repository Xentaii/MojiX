# Popover Mode (`mojix-picker/popover`)

`EmojiPicker` is the **standalone** picker — it lives directly in your layout.
For a **triggered** picker (an emoji button that opens a floating panel), import
`EmojiPickerPopover` from the optional `mojix-picker/popover` entry. It wraps the
same picker with a zero-dependency, viewport-aware popover layer, so the core
package stays lean for consumers who only need the standalone picker.

```tsx
import { EmojiPickerPopover } from 'mojix-picker/popover';
import 'mojix-picker/style.css';

function Composer() {
  return (
    <EmojiPickerPopover
      trigger={(t) => (
        <button
          ref={t.ref}
          type="button"
          aria-haspopup={t['aria-haspopup']}
          aria-expanded={t['aria-expanded']}
          onClick={t.onClick}
        >
          😀
        </button>
      )}
      placement="top"
      align="end"
      onEmojiSelect={(emoji) => console.log(emoji.native)}
    />
  );
}
```

The `trigger` render prop hands you `ref`, `onClick`, `aria-haspopup`, and
`aria-expanded` to spread onto your own button — you keep full control of how the
trigger looks.

## Props

`EmojiPickerPopover` accepts **every** `EmojiPicker` prop (forwarded to the inner
picker) plus the popover-specific props below.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `trigger` | `(props) => ReactNode` | — | Renders the toggle. Spread the supplied props onto your button. |
| `open` / `defaultOpen` / `onOpenChange` | controlled state | — | Drive open state externally or let the component own it. |
| `placement` | `'top' \| 'bottom' \| 'auto'` | `'auto'` | Preferred side. `auto` flips to wherever the picker fits. |
| `align` | `'start' \| 'end' \| 'center'` | `'start'` | Horizontal alignment to the trigger. |
| `offset` | `number` | `8` | Gap between trigger and popover. |
| `viewportPadding` | `number` | `8` | Minimum gap kept from every viewport edge. |
| `popoverWidth` / `popoverHeight` | `number` | `340` / `420` | Popover surface size (height is capped to the viewport). |
| `closeOnOutsideClick` | `boolean` | `true` | Dismiss on a pointer press outside the popover. |
| `closeOnEscape` | `boolean` | `true` | Dismiss on `Escape`. |
| `closeOnSelect` | `boolean` | `true` | Close after an emoji is picked. Set `false` for multi-pick. |
| `opacity` | `number` | `1` | Opacity of the popover surface. |
| `portal` | `boolean` | `true` | Render into `document.body` so ancestors can't clip it. |
| `popoverClassName` / `popoverStyle` | — | — | Style the floating surface. Position/size are applied inline. |

## Mode-specific behavior

- **Viewport-aware positioning.** The popover flips top/bottom and shifts
  horizontally so it never overflows the viewport, and caps its height so the
  grid scrolls instead of being clipped. Recomputed on scroll and resize while
  open. The math is exposed as the pure `computeEmojiPopoverPosition(...)` if you
  need it.
- **Dismissal.** Outside-click and `Escape` are built in and individually
  toggleable; focus returns to the trigger on close.
- **Lazy by open.** The picker only mounts while open, so the warmed data, locale,
  and sprite caches make reopening cheap. Pair with `deferGridMount` for an
  instant-feeling open, and `preloadEmojiPicker(...)` at startup to warm assets.

The standalone `EmojiPicker` keeps all of its own optimizations (bounded first
paint, virtualization, `performanceMode`); popover mode only adds the floating
layer on top.
