import { useEffect, useRef, useState } from 'react';
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

export interface EmojiSkinToneButtonProps {
  skinTone: EmojiSkinTone;
  onSkinToneChange: (tone: EmojiSkinTone) => void;
  labels: EmojiPickerLabels;
  localeDefinition: EmojiLocaleDefinition;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiSkinToneButton({
  skinTone,
  onSkinToneChange,
  labels,
  localeDefinition,
  unstyled,
  classNames,
  styles,
}: EmojiSkinToneButtonProps) {
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
          {SKIN_TONE_OPTIONS.find((option) => option.tone === skinTone)?.icon}
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
              data-active={option.tone === skinTone ? 'true' : undefined}
            >
              <span aria-hidden="true">{option.icon}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
