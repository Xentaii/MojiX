import { useEffect, useRef, useState } from 'react';
import { SKIN_TONE_OPTIONS } from '../lib/constants';
import {
  getUnicodeEmojiById,
  resolveUnicodeEmojiVariant,
} from '../lib/data';
import { getLocalizedSkinToneLabel } from '../lib/i18n';
import type {
  EmojiAssetSource,
  EmojiLocaleDefinition,
  EmojiPickerClassNames,
  EmojiPickerLabels,
  EmojiPickerStyles,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { EmojiSprite } from './EmojiSprite';
import { getSlotClassName, getSlotStyle } from './utils';

const SKIN_TONE_PREVIEW_EMOJI_ID = '1f91a';

export interface EmojiSkinToneButtonProps {
  skinTone: EmojiSkinTone;
  onSkinToneChange: (tone: EmojiSkinTone) => void;
  labels: EmojiPickerLabels;
  localeDefinition: EmojiLocaleDefinition;
  spriteSheet?: EmojiSpriteSheetConfig;
  assetSource?: EmojiAssetSource;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiSkinToneButton({
  skinTone,
  onSkinToneChange,
  labels,
  localeDefinition,
  spriteSheet,
  assetSource,
  unstyled,
  classNames,
  styles,
}: EmojiSkinToneButtonProps) {
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const toneMenuRef = useRef<HTMLDivElement>(null);
  const slotOptions = { unstyled, classNames, styles };
  const handEmoji = getUnicodeEmojiById(SKIN_TONE_PREVIEW_EMOJI_ID);

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

  function renderToneIcon(nextSkinTone: EmojiSkinTone) {
    if (!handEmoji) {
      return (
        <span aria-hidden="true">
          {SKIN_TONE_OPTIONS.find((option) => option.tone === nextSkinTone)?.icon}
        </span>
      );
    }

    return (
      <span className="mx-picker__tone-emoji" aria-hidden="true">
        <span className="mx-picker__tone-native-fallback">
          {resolveUnicodeEmojiVariant(handEmoji, nextSkinTone).native}
        </span>
        <span className="mx-picker__tone-sprite">
          <EmojiSprite
            emoji={handEmoji}
            skinTone={nextSkinTone}
            size={22}
            spriteSheet={spriteSheet}
            assetSource={assetSource}
            assetContext="grid"
          />
        </span>
      </span>
    );
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
        {renderToneIcon(skinTone)}
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
              aria-label={getLocalizedSkinToneLabel(
                option.tone,
                localeDefinition,
              )}
              data-mx-slot="toneOption"
              data-active={option.tone === skinTone ? 'true' : undefined}
            >
              {renderToneIcon(option.tone)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
