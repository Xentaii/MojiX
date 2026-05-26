# React Integration Scenarios

These snippets are intentionally small and app-shaped. They are meant to be
copied into a real design system rather than run as a standalone demo.

## Chat Composer

Use `open`, `onOpenChange`, `trapFocus`, and `showPreview={false}` for a
popover that feels keyboard-native and avoids hover state work.

```tsx
<EmojiPicker
  open={open}
  onOpenChange={setOpen}
  trapFocus
  showPreview={false}
  categoryScrollBehavior="instant"
  onEmojiSelect={(emoji) => insertText(emoji.native ?? emoji.id)}
/>
```

## Page Icon Picker

Use controlled `value`, hide skin tones, and disable recents when the picker is
choosing a durable page icon rather than writing chat text.

```tsx
<EmojiPicker
  value={pageIconId}
  showPreview={false}
  showSkinTones={false}
  recent={{ enabled: false }}
  onEmojiSelect={(emoji) => setPageIconId(emoji.id)}
/>
```

## Command Palette Insert

Use the headless entry when the palette owns all chrome and only needs MojiX
state/search/category behavior.

```tsx
import {
  MojiX,
  useEmojiCategories,
  useEmojiSearch,
  useEmojiSelection,
} from 'mojix-picker/headless';

<MojiX.Root
  searchQuery={query}
  onSearchQueryChange={setQuery}
  showPreview={false}
  onEmojiSelect={(emoji) => runCommand(emoji.native ?? emoji.id)}
>
  <PaletteSearch />
  <PaletteEmojiList />
</MojiX.Root>
```

## Settings Modal

Use controlled recents and skin tone when picker state belongs to a settings
form or account profile rather than local browser storage.

```tsx
<EmojiPicker
  recentEmoji={recentEmoji}
  onRecentEmojiChange={setRecentEmoji}
  skinTone={skinTone}
  onSkinToneChange={setSkinTone}
/>
```

More complete versions live in
[Integration Examples](../../docs/guides/integration-examples.md).
