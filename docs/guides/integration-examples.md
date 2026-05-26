# Integration Examples

These examples show the API shape for common product surfaces.

## Chat Composer

```tsx
function ChatEmojiButton({ insertText }: { insertText: (text: string) => void }) {
  const [open, setOpen] = useState(false);

  usePreloadMojiX({ locale: 'en' });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>Emoji</PopoverTrigger>
      <PopoverContent>
        <EmojiPicker
          open={open}
          onOpenChange={setOpen}
          trapFocus
          showPreview={false}
          categoryScrollBehavior="instant"
          onEmojiSelect={(emoji) => insertText(emoji.native ?? emoji.id)}
        />
      </PopoverContent>
    </Popover>
  );
}
```

## Page Icon Picker

```tsx
function PageIconPicker({ value, onChange }: {
  value?: string;
  onChange: (emojiId: string) => void;
}) {
  return (
    <EmojiPicker
      value={value}
      showPreview={false}
      showSkinTones={false}
      recent={{ enabled: false }}
      onEmojiSelect={(emoji) => onChange(emoji.id)}
    />
  );
}
```

## Command Palette Emoji Insert

```tsx
function CommandEmojiSearch({ onPick }: { onPick: (value: string) => void }) {
  const [query, setQuery] = useState('');

  return (
    <MojiX.Root
      searchQuery={query}
      onSearchQueryChange={setQuery}
      showPreview={false}
      onEmojiSelect={(emoji) => onPick(emoji.native ?? emoji.id)}
    >
      <PaletteSearch />
      <PaletteEmojiList />
    </MojiX.Root>
  );
}

function PaletteSearch() {
  const { searchQuery, setSearchQuery, labels } = useEmojiSearch();

  return (
    <input
      type="search"
      value={searchQuery}
      aria-label={labels.searchPlaceholder}
      placeholder={labels.searchPlaceholder}
      onChange={(event) => setSearchQuery(event.currentTarget.value)}
    />
  );
}

function PaletteEmojiList() {
  const { sections } = useEmojiCategories();
  const { selectEmoji } = useEmojiSelection();

  return (
    <div role="listbox">
      {sections.flatMap((section) =>
        section.emojis.map((emoji) => (
          <button
            key={`${section.id}:${emoji.id}`}
            type="button"
            onClick={() => selectEmoji(emoji)}
          >
            {emoji.native ?? emoji.name}
          </button>
        )),
      )}
    </div>
  );
}
```

## Settings Modal With Controlled Recents

```tsx
function SettingsEmojiPicker() {
  const [recentEmoji, setRecentEmoji] = useState<RecentEmojiRecord[]>([]);
  const [skinTone, setSkinTone] = useState<EmojiSkinTone>('default');

  return (
    <EmojiPicker
      trapFocus
      recentEmoji={recentEmoji}
      onRecentEmojiChange={setRecentEmoji}
      skinTone={skinTone}
      onSkinToneChange={setSkinTone}
    />
  );
}
```

## Related Pages

- [Custom Layouts](./custom-layouts.md)
- [Picker Configuration](../api/picker-configuration.md)
- [Performance Recipes](./performance-recipes.md)
