import { startTransition, useEffect, useRef, useState } from 'react';
import { SKIN_TONE_OPTIONS } from '../lib/constants';
import { getLocalizedSkinToneLabel } from '../lib/i18n';
import type {
  EmojiLocaleDefinition,
  EmojiPickerLabels,
  EmojiSkinTone,
} from '../lib/types';
import { createClassName } from './utils';

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
}: EmojiToolbarProps) {
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const toneMenuRef = useRef<HTMLDivElement>(null);

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
    <div className="mx-picker__toolbar">
      <label className="mx-picker__search" htmlFor={searchId}>
        <span className="mx-picker__search-icon" aria-hidden="true">
          {SEARCH_ICON}
        </span>
        <input
          id={searchId}
          className="mx-picker__search-input"
          type="search"
          value={searchQuery}
          placeholder={labels.searchPlaceholder}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            startTransition(() => onSearchChange(nextValue));
          }}
        />
        {searchQuery && (
          <button
            type="button"
            className="mx-picker__search-clear"
            onClick={() => onSearchChange('')}
            aria-label={labels.clearSearch}
            title={labels.clearSearch}
          >
            {CLEAR_ICON}
          </button>
        )}
      </label>

      {showSkinTones && (
        <div className="mx-picker__tone-picker" ref={toneMenuRef}>
          <button
            type="button"
            className={createClassName(
              'mx-picker__tone-button',
              toneMenuOpen && 'is-open',
            )}
            onClick={() => setToneMenuOpen((open) => !open)}
            aria-label={labels.skinToneButton}
            title={labels.skinToneButton}
          >
            <span aria-hidden="true">
              {SKIN_TONE_OPTIONS.find((option) => option.tone === skinTone)
                ?.icon}
            </span>
          </button>

          {toneMenuOpen && (
            <div className="mx-picker__tone-menu">
              {SKIN_TONE_OPTIONS.map((option) => (
                <button
                  key={option.tone}
                  type="button"
                  className={createClassName(
                    'mx-picker__tone-option',
                    option.tone === skinTone && 'is-active',
                  )}
                  onClick={() => handleSkinToneSelect(option.tone)}
                  title={getLocalizedSkinToneLabel(
                    option.tone,
                    localeDefinition,
                  )}
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
