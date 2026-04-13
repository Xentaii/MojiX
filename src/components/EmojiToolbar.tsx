import { startTransition, useEffect, useRef, useState } from 'react';
import { SKIN_TONE_OPTIONS } from '../lib/constants';
import { getLocalizedSkinToneLabel } from '../lib/i18n';
import type {
  EmojiLocaleDefinition,
  EmojiPickerClassNames,
  EmojiPickerLabels,
  EmojiPickerStyles,
  EmojiSkinTone,
} from '../lib/types';
import { getSlotClassName, getSlotStyle } from './utils';

const SEARCH_ICON = String.fromCodePoint(0x2315);
const CLEAR_ICON = String.fromCodePoint(0x2715);

export interface EmojiToolbarProps {
  searchId: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  skinTone: EmojiSkinTone;
  onSkinToneChange: (tone: EmojiSkinTone) => void;
  showSkinTones: boolean;
  labels: EmojiPickerLabels;
  localeDefinition: EmojiLocaleDefinition;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiToolbar({
  searchId,
  searchQuery,
  onSearchChange,
  skinTone,
  onSkinToneChange,
  showSkinTones,
  labels,
  localeDefinition,
  unstyled,
  classNames,
  styles,
}: EmojiToolbarProps) {
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const toneMenuRef = useRef<HTMLDivElement>(null);
  const slotOptions = { unstyled, classNames, styles };

  useEffect(() => {
    function handleDocumentPointerDown(event: MouseEvent) {
      if (!toneMenuRef.current?.contains(event.target as Node)) {
        setToneMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentPointerDown);
    return () =>
      document.removeEventListener('mousedown', handleDocumentPointerDown);
  }, []);

  function handleSkinToneSelect(nextSkinTone: EmojiSkinTone) {
    onSkinToneChange(nextSkinTone);
    setToneMenuOpen(false);
  }

  return (
    <div
      className={getSlotClassName('toolbar', slotOptions)}
      style={getSlotStyle('toolbar', slotOptions)}
      data-mx-slot="toolbar"
    >
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

      {showSkinTones && (
        <div
          className={getSlotClassName('tonePicker', slotOptions)}
          style={getSlotStyle('tonePicker', slotOptions)}
          ref={toneMenuRef}
          data-mx-slot="tonePicker"
        >
          <button
            type="button"
            className={getSlotClassName(
              'toneButton',
              slotOptions,
              !unstyled && toneMenuOpen && 'is-open',
            )}
            style={getSlotStyle('toneButton', slotOptions)}
            onClick={() => setToneMenuOpen((open) => !open)}
            aria-label={labels.skinToneButton}
            title={labels.skinToneButton}
            data-mx-slot="toneButton"
            data-open={toneMenuOpen ? 'true' : undefined}
          >
            <span aria-hidden="true">
              {SKIN_TONE_OPTIONS.find((option) => option.tone === skinTone)
                ?.icon}
            </span>
          </button>

          {toneMenuOpen && (
            <div
              className={getSlotClassName('toneMenu', slotOptions)}
              style={getSlotStyle('toneMenu', slotOptions)}
              data-mx-slot="toneMenu"
            >
              {SKIN_TONE_OPTIONS.map((option) => (
                <button
                  key={option.tone}
                  type="button"
                  className={getSlotClassName(
                    'toneOption',
                    slotOptions,
                    !unstyled && option.tone === skinTone && 'is-active',
                  )}
                  style={getSlotStyle('toneOption', slotOptions)}
                  onClick={() => handleSkinToneSelect(option.tone)}
                  title={getLocalizedSkinToneLabel(
                    option.tone,
                    localeDefinition,
                  )}
                  data-mx-slot="toneOption"
                  data-active={
                    option.tone === skinTone ? 'true' : undefined
                  }
                >
                  <span aria-hidden="true">{option.icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
