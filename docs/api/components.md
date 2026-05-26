# Components

These exports are the ready-made UI pieces available from the package root.

## Primary Components

| Export | Kind | Description |
| --- | --- | --- |
| `EmojiPicker` | Component | Batteries-included picker composed from the public primitives. |
| `EmojiGrid` | Component | Scrollable emoji grid with sections, keyboard navigation, and virtualization placeholders. |
| `EmojiCategoryIcon` | Component | Default category icon renderer for outline, emoji-native, and vendor sprite styles. |
| `EmojiPreview` | Component | Default bottom preview card. |
| `EmojiSearchField` | Component | Default search field UI. |
| `EmojiSidebar` | Component | Default category navigation UI. |
| `EmojiSkinToneButton` | Component | Default skin tone picker trigger and menu. |
| `EmojiSprite` | Component | Generic emoji asset renderer for sprite, native, image, or svg assets. |
| `EmojiToolbar` | Component | Default toolbar wrapper used by the bundled UI. |

## Usage Notes

- `EmojiPicker` is the best starting point when you want a drop-in experience.
- The lower-level components are useful when you already have picker state and want to compose your own layout.
- `EmojiCategoryIcon` is the easiest way to reuse the same category icon logic in custom layouts when you override `renderCategoryIcon`.

## Stability Contract

The `EmojiPickerSlot` names, `data-mx-slot` values, `data-category-id`,
`data-active`, `data-selected`, `data-open`, and the theme variables documented
here are treated as the stable styling/integration contract. Beta releases may
add slots or attributes, but existing names should not be renamed or removed in
a beta/minor update without a migration note.

## Slot ClassNames and DOM Map

Every styled slot includes `data-mx-slot="<slot>"` and can be targeted through
`classNames`, `styles`, or CSS. The default `EmojiPicker` structure is:

```html
<div data-mx-slot="root">
  <div data-mx-slot="panel">
    <div data-mx-slot="toolbar">
      <label data-mx-slot="search">
        <span data-mx-slot="searchIcon"></span>
        <input data-mx-slot="searchInput" />
        <button data-mx-slot="searchClear"></button>
      </label>
      <div data-mx-slot="tonePicker">
        <button data-mx-slot="toneButton"></button>
        <div data-mx-slot="toneMenu">
          <button data-mx-slot="toneOption"></button>
        </div>
      </div>
    </div>
    <div data-mx-slot="viewport">
      <div data-mx-slot="loading"></div>
      <div data-mx-slot="empty"></div>
      <div data-mx-slot="content">
        <section data-mx-slot="section">
          <header data-mx-slot="sectionHeader">
            <span data-mx-slot="sectionIcon"></span>
          </header>
          <div data-mx-slot="grid">
            <button data-mx-slot="emoji"></button>
            <div data-mx-slot="gridPlaceholder"></div>
          </div>
        </section>
      </div>
    </div>
    <div data-mx-slot="preview">
      <div data-mx-slot="previewCard">
        <div data-mx-slot="previewCopy">
          <div data-mx-slot="previewHeading"></div>
          <div data-mx-slot="previewSubline"></div>
          <div data-mx-slot="previewMeta">
            <span data-mx-slot="chip"></span>
            <span data-mx-slot="chipMuted"></span>
          </div>
        </div>
      </div>
    </div>
    <div data-mx-slot="footer"></div>
  </div>
  <div data-mx-slot="sidebar">
    <button data-mx-slot="navButton"></button>
  </div>
</div>
```

| Slot | Element | Notes |
| --- | --- | --- |
| `root` | `div` | Provider/root container; receives theme CSS variables. |
| `panel` | `div` | Main picker column. |
| `viewport` | `div` | Wrapper around loading, empty, and list content. |
| `toolbar` | `div` | Search plus skin-tone control. |
| `search` | `label` | Search field shell. |
| `searchIcon` | `span` | Decorative search icon. |
| `searchInput` | `input` | Text input. |
| `searchClear` | `button` | Clear query button. |
| `tonePicker` | `div` | Skin-tone popover root. |
| `toneButton` | `button` | Skin-tone trigger. |
| `toneMenu` | `div` | Skin-tone options popover. |
| `toneOption` | `button` | One tone option. |
| `content` | `div` | Scroll container for sections. |
| `section` | `section` | One category section. |
| `sectionHeader` | `header` | Sticky category label row. |
| `sectionIcon` | `span` | Category icon inside a section header. |
| `grid` | `div` | Emoji grid for one section. |
| `gridPlaceholder` | `div` | Virtualization spacer row. |
| `emoji` | `button` | Emoji cell. Hover is handled by CSS unless hover tracking is enabled. |
| `preview` | `div` | Default active emoji preview area. |
| `previewCard` | `div` | Preview card layout. |
| `previewCopy` | `div` | Preview text column. |
| `previewHeading` | `div` | Emoji display name row. |
| `previewSubline` | `div` | Native glyph/category row. |
| `previewMeta` | `div` | Shortcodes and metadata row. |
| `footer` | `div` | Optional headless footer container. |
| `chip` | `span` | Accent metadata chip. |
| `chipMuted` | `span` | Muted metadata chip. |
| `empty` | `div` | Empty state. |
| `loading` | `div` | Loading state. |
| `sidebar` | `div` | Horizontal category nav. |
| `navButton` | `button` | One category nav item. |

## Related Files

- [Picker Configuration](./picker-configuration.md)
- [Headless Primitives](./headless-primitives.md)
