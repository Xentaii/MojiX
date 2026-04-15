import type { CSSProperties } from 'react';
import { resolveEmojiAsset } from '../core/assets';
import { getSpriteStyle, resolveSpriteSheetConfig } from '../core/sprites';
import type {
  EmojiAssetRenderContext,
  EmojiAssetSource,
  EmojiRenderable,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
} from '../core/types';
import { createClassName } from './utils';

export interface EmojiSpriteProps {
  emoji: EmojiRenderable;
  spriteSheet?: EmojiSpriteSheetConfig;
  assetSource?: EmojiAssetSource;
  assetContext?: EmojiAssetRenderContext;
  skinTone?: EmojiSkinTone;
  size?: number;
  className?: string;
  title?: string;
  alt?: string;
}

export function EmojiSprite({
  emoji,
  spriteSheet,
  assetSource,
  assetContext = 'grid',
  skinTone = 'default',
  size = 24,
  className,
  title,
  alt,
}: EmojiSpriteProps) {
  const resolvedConfig = resolveSpriteSheetConfig(spriteSheet);
  const asset = resolveEmojiAsset({
    emoji,
    skinTone,
    context: assetContext,
    spriteSheet: resolvedConfig,
    assetSource,
  });

  if (!asset) {
    return null;
  }

  if (asset.kind === 'image' || asset.kind === 'svg') {
      return (
        <img
          className={createClassName('mx-emoji-sprite', className)}
          src={asset.src}
          alt={alt ?? asset.alt ?? emoji.name}
          title={title ?? alt ?? asset.alt ?? emoji.name}
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

  if (asset.kind === 'native') {
    return (
      <span
        role="img"
        aria-label={alt ?? emoji.name}
        title={title ?? alt ?? emoji.name}
        className={createClassName('mx-emoji-native', className)}
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
      >
        {asset.native}
      </span>
    );
  }

  const effectiveSpriteSheet = asset.spriteSheet ?? resolvedConfig;

  return (
    <span
      role="img"
      aria-label={alt ?? emoji.name}
      title={title ?? alt ?? emoji.name}
      className={createClassName('mx-emoji-sprite', className)}
      style={getSpriteStyle({
        sheetX: asset.sheetX,
        sheetY: asset.sheetY,
        renderSize: size,
        spriteSheet: effectiveSpriteSheet,
        overrideUrl: asset.sheetUrl,
        overrideSheetSize: asset.sheetSize,
        overridePadding: asset.padding,
        overrideGridSize: asset.gridSize,
      })}
    />
  );
}
