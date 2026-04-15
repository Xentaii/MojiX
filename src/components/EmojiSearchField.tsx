import { startTransition } from 'react';
import type {
  EmojiPickerClassNames,
  EmojiPickerLabels,
  EmojiPickerStyles,
} from '../core/types';
import { getSlotClassName, getSlotStyle } from './utils';

const SEARCH_ICON = String.fromCodePoint(0x2315);
const CLEAR_ICON = String.fromCodePoint(0x2715);

export interface EmojiSearchFieldProps {
  searchId: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  labels: EmojiPickerLabels;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiSearchField({
  searchId,
  searchQuery,
  onSearchChange,
  labels,
  unstyled,
  classNames,
  styles,
}: EmojiSearchFieldProps) {
  const slotOptions = { unstyled, classNames, styles };

  return (
    <label
      className={getSlotClassName('search', slotOptions)}
      style={getSlotStyle('search', slotOptions)}
      htmlFor={searchId}
      data-mx-slot="search"
    >
      <span
        className={getSlotClassName('searchIcon', slotOptions)}
        style={getSlotStyle('searchIcon', slotOptions)}
        aria-hidden="true"
        data-mx-slot="searchIcon"
      >
        {SEARCH_ICON}
      </span>
      <input
        id={searchId}
        className={getSlotClassName('searchInput', slotOptions)}
        style={getSlotStyle('searchInput', slotOptions)}
        type="search"
        value={searchQuery}
        placeholder={labels.searchPlaceholder}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          startTransition(() => onSearchChange(nextValue));
        }}
        data-mx-slot="searchInput"
      />
      {searchQuery && (
        <button
          type="button"
          className={getSlotClassName('searchClear', slotOptions)}
          style={getSlotStyle('searchClear', slotOptions)}
          onClick={() => onSearchChange('')}
          aria-label={labels.clearSearch}
          title={labels.clearSearch}
          data-mx-slot="searchClear"
        >
          {CLEAR_ICON}
        </button>
      )}
    </label>
  );
}
