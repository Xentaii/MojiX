import type { CSSProperties } from 'react';
import { resolveUnicodeEmojiVariant } from '../lib/data';
import {
  getSpriteStyle,
  resolveSpriteSheetConfig,
  vendorCanRenderEmoji,
} from '../lib/sprites';
import type {
  EmojiRenderable,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { createClassName } from './utils';

export interface EmojiSpriteProps {
  emoji: EmojiRenderable;
  spriteSheet?: EmojiSpriteSheetConfig;
  skinTone?: EmojiSkinTone;
  size?: number;
  className?: string;
  title?: string;
}

export function EmojiSprite({
  emoji,
  spriteSheet,
  skinTone = 'default',
  size = 24,
  className,
  title,
}: EmojiSpriteProps) {
  if (emoji.kind === 'custom') {
    if (emoji.imageUrl) {
      return (
        <img
          className={createClassName('mx-emoji-sprite', className)}
          src={emoji.imageUrl}
          alt={emoji.name}
          title={title ?? emoji.name}
          width={size}
          height={size}
          loading="lazy"
          style={
            {
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: `${Math.max(4, size * 0.22)}px`,
            } satisfies CSSProperties
          }
        />
      );
    }

    if (emoji.sprite) {
      return (
        <span
          role="img"
          aria-label={emoji.name}
          title={title ?? emoji.name}
          className={createClassName('mx-emoji-sprite', className)}
          style={getSpriteStyle({
            sheetX: emoji.sprite.sheetX,
            sheetY: emoji.sprite.sheetY,
            renderSize: size,
            spriteSheet,
            overrideUrl: emoji.sprite.sheetUrl,
            overrideSheetSize: emoji.sprite.sheetSize,
            overridePadding: emoji.sprite.padding,
            overrideGridSize: emoji.sprite.gridSize,
          })}
        />
      );
    }

    return (
      <span
        role="img"
        aria-label={emoji.name}
        title={title ?? emoji.name}
        className={createClassName('mx-emoji-native', className)}
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
      >
        {emoji.native ?? '\u2728'}
      </span>
    );
  }

  const resolvedConfig = resolveSpriteSheetConfig(spriteSheet);
  const variant = resolveUnicodeEmojiVariant(emoji, skinTone);
  const shouldUseSprite =
    vendorCanRenderEmoji(resolvedConfig.vendor, emoji.availability) ||
    !resolvedConfig.fallbackNative;

  if (!shouldUseSprite) {
    return (
      <span
        role="img"
        aria-label={emoji.name}
        title={title ?? emoji.name}
        className={createClassName('mx-emoji-native', className)}
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
      >
        {variant.native}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={emoji.name}
      title={title ?? emoji.name}
      className={createClassName('mx-emoji-sprite', className)}
      style={getSpriteStyle({
        sheetX: variant.sheetX,
        sheetY: variant.sheetY,
        renderSize: size,
        spriteSheet: resolvedConfig,
      })}
    />
  );
}
