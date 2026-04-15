import type { ReactNode } from 'react';
import type {
  EmojiAssetSource,
  EmojiPickerClassNames,
  EmojiPickerStyles,
  EmojiRenderable,
  EmojiSelection,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { EmojiSprite } from './EmojiSprite';
import {
  formatEmojiName,
  getSlotClassName,
  getSlotStyle,
} from './utils';

export interface EmojiPreviewProps {
  emoji: EmojiRenderable | null;
  selection: EmojiSelection | null;
  spriteSheet: EmojiSpriteSheetConfig;
  assetSource?: EmojiAssetSource;
  renderPreview?: (
    emoji: EmojiRenderable,
    selection: EmojiSelection,
  ) => ReactNode;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiPreview({
  emoji,
  selection,
  spriteSheet,
  assetSource,
  renderPreview,
  unstyled,
  classNames,
  styles,
}: EmojiPreviewProps) {
  if (!emoji || !selection) return null;

  const slotOptions = { unstyled, classNames, styles };

  if (renderPreview) {
    return (
      <footer
        className={getSlotClassName('preview', slotOptions)}
        style={getSlotStyle('preview', slotOptions)}
        data-mx-slot="preview"
      >
        {renderPreview(emoji, selection)}
      </footer>
    );
  }

  const displayName = formatEmojiName(selection.name);
  const aliases = selection.shortcodes
    .slice(0, 4)
    .map((shortcode) => `:${shortcode}:`);
  const primaryAlias = aliases[0];
  const secondaryAliases = aliases.slice(1, 3);

  return (
    <footer
      className={getSlotClassName('preview', slotOptions)}
      style={getSlotStyle('preview', slotOptions)}
      data-mx-slot="preview"
    >
      <div
        className={getSlotClassName('previewCard', slotOptions)}
        style={getSlotStyle('previewCard', slotOptions)}
        data-mx-slot="previewCard"
      >
        <EmojiSprite
          emoji={emoji}
          skinTone={selection.skinTone}
          size={30}
          spriteSheet={spriteSheet}
          assetSource={assetSource}
          assetContext="preview"
          title={displayName}
          alt={displayName}
        />
        <div
          className={getSlotClassName('previewCopy', slotOptions)}
          style={getSlotStyle('previewCopy', slotOptions)}
          data-mx-slot="previewCopy"
        >
          <div
            className={getSlotClassName('previewHeading', slotOptions)}
            style={getSlotStyle('previewHeading', slotOptions)}
            data-mx-slot="previewHeading"
          >
            <strong>{displayName}</strong>
            {primaryAlias && (
              <span
                className={getSlotClassName('chip', slotOptions)}
                style={getSlotStyle('chip', slotOptions)}
                data-mx-slot="chip"
              >
                {primaryAlias}
              </span>
            )}
          </div>
          <div
            className={getSlotClassName('previewSubline', slotOptions)}
            style={getSlotStyle('previewSubline', slotOptions)}
            data-mx-slot="previewSubline"
          >
            <span>{selection.native ?? primaryAlias ?? displayName}</span>
            <span>{selection.categoryLabel}</span>
          </div>
          {(secondaryAliases.length > 0 ||
            selection.emoticons.length > 0) && (
            <div
              className={getSlotClassName('previewMeta', slotOptions)}
              style={getSlotStyle('previewMeta', slotOptions)}
              data-mx-slot="previewMeta"
            >
              {secondaryAliases.map((alias) => (
                <span
                  key={alias}
                  className={getSlotClassName('chipMuted', slotOptions)}
                  style={getSlotStyle(
                    'chipMuted',
                    slotOptions,
                    getSlotStyle('chip', slotOptions),
                  )}
                  data-mx-slot="chipMuted"
                >
                  {alias}
                </span>
              ))}
              {selection.emoticons.slice(0, 2).map((emoticon) => (
                <span
                  key={emoticon}
                  className={getSlotClassName('chipMuted', slotOptions)}
                  style={getSlotStyle(
                    'chipMuted',
                    slotOptions,
                    getSlotStyle('chip', slotOptions),
                  )}
                  data-mx-slot="chipMuted"
                >
                  {emoticon}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
