import type { ReactNode } from 'react';
import type {
  EmojiRenderable,
  EmojiSelection,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { EmojiSprite } from './EmojiSprite';
import { formatEmojiName } from './utils';

export interface EmojiPreviewProps {
  emoji: EmojiRenderable | null;
  selection: EmojiSelection | null;
  spriteSheet: EmojiSpriteSheetConfig;
  renderPreview?: (
    emoji: EmojiRenderable,
    selection: EmojiSelection,
  ) => ReactNode;
}

export function EmojiPreview({
  emoji,
  selection,
  spriteSheet,
  renderPreview,
}: EmojiPreviewProps) {
  if (!emoji || !selection) return null;

  if (renderPreview) {
    return (
      <footer className="mx-picker__preview">
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
    <footer className="mx-picker__preview">
      <div className="mx-picker__preview-card">
        <EmojiSprite
          emoji={emoji}
          skinTone={selection.skinTone}
          size={30}
          spriteSheet={spriteSheet}
        />
        <div className="mx-picker__preview-copy">
          <div className="mx-picker__preview-heading">
            <strong>{displayName}</strong>
            {primaryAlias && (
              <span className="mx-picker__chip">{primaryAlias}</span>
            )}
          </div>
          <div className="mx-picker__preview-subline">
            <span>{selection.native ?? primaryAlias ?? displayName}</span>
            <span>{selection.categoryLabel}</span>
          </div>
          {(secondaryAliases.length > 0 ||
            selection.emoticons.length > 0) && (
            <div className="mx-picker__preview-meta">
              {secondaryAliases.map((alias) => (
                <span
                  key={alias}
                  className="mx-picker__chip mx-picker__chip--muted"
                >
                  {alias}
                </span>
              ))}
              {selection.emoticons.slice(0, 2).map((emoticon) => (
                <span
                  key={emoticon}
                  className="mx-picker__chip mx-picker__chip--muted"
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
