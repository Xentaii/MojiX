import { resolveUnicodeEmojiVariant } from './data';
import {
  defaultSpriteSheet,
  resolveSpriteSheetConfig,
  vendorCanRenderEmoji,
} from './sprites';
import type {
  EmojiAssetRequest,
  EmojiAssetSource,
  EmojiImageAssetSource,
  EmojiMixedAssetSource,
  EmojiNativeAssetSource,
  EmojiResolvedAsset,
  EmojiSpriteSheetAssetSource,
  EmojiSvgAssetSource,
} from './types';

function resolveDefaultEmojiAsset(
  request: EmojiAssetRequest,
): EmojiResolvedAsset | null {
  const { emoji, skinTone } = request;

  if (emoji.kind === 'custom') {
    if (emoji.imageUrl) {
      return {
        kind: 'image',
        src: emoji.imageUrl,
        alt: emoji.name,
      };
    }

    if (emoji.sprite) {
      return {
        kind: 'sprite',
        sheetX: emoji.sprite.sheetX,
        sheetY: emoji.sprite.sheetY,
        sheetUrl: emoji.sprite.sheetUrl,
        sheetSize: emoji.sprite.sheetSize,
        padding: emoji.sprite.padding,
        gridSize: emoji.sprite.gridSize,
      };
    }

    if (emoji.native) {
      return {
        kind: 'native',
        native: emoji.native,
      };
    }

    return null;
  }

  const variant = resolveUnicodeEmojiVariant(emoji, skinTone);
  const spriteSheet = resolveSpriteSheetConfig(
    request.spriteSheet ?? defaultSpriteSheet,
  );
  const canUseSprite =
    vendorCanRenderEmoji(spriteSheet.vendor, emoji.availability, {
      emojiId: emoji.id,
      missingEmojiIds: spriteSheet.availability,
    }) ||
    !spriteSheet.fallbackNative;

  if (!canUseSprite) {
    return {
      kind: 'native',
      native: variant.native,
    };
  }

  return {
    kind: 'sprite',
    sheetX: variant.sheetX,
    sheetY: variant.sheetY,
    spriteSheet,
  };
}

function resolveFromSource(
  source: EmojiAssetSource,
  request: EmojiAssetRequest,
): EmojiResolvedAsset | null {
  switch (source.type) {
    case 'native': {
      if (request.emoji.kind === 'unicode') {
        const variant = resolveUnicodeEmojiVariant(
          request.emoji,
          request.skinTone,
        );
        return { kind: 'native', native: variant.native };
      }

      if (request.emoji.kind === 'custom' && request.emoji.native) {
        return { kind: 'native', native: request.emoji.native };
      }

      return null;
    }

    case 'spriteSheet': {
      const fallback = resolveDefaultEmojiAsset({
        ...request,
        spriteSheet: source.spriteSheet ?? request.spriteSheet,
      });

      return fallback?.kind === 'sprite' ? fallback : null;
    }

    case 'image': {
      const src = source.resolveUrl(request);

      if (!src) {
        return null;
      }

      return {
        kind: 'image',
        src,
        alt: request.emoji.name,
      };
    }

    case 'svg': {
      const src = source.resolveUrl(request);

      if (!src) {
        return null;
      }

      return {
        kind: 'svg',
        src,
        alt: request.emoji.name,
      };
    }

    case 'mixed': {
      const primarySource =
        request.emoji.kind === 'custom'
          ? source.custom
          : source.unicode;

      return (
        (primarySource && resolveFromSource(primarySource, request)) ||
        (source.fallback && resolveFromSource(source.fallback, request)) ||
        null
      );
    }

    default:
      return null;
  }
}

export function createNativeAssetSource(): EmojiNativeAssetSource {
  return {
    type: 'native',
  };
}

export function createSpriteSheetAssetSource(options: {
  spriteSheet?: EmojiAssetRequest['spriteSheet'];
} = {}): EmojiSpriteSheetAssetSource {
  return {
    type: 'spriteSheet',
    spriteSheet: options.spriteSheet,
  };
}

export function createImageAssetSource(options: {
  resolveUrl: EmojiImageAssetSource['resolveUrl'];
}): EmojiImageAssetSource {
  return {
    type: 'image',
    resolveUrl: options.resolveUrl,
  };
}

export function createSvgAssetSource(options: {
  resolveUrl: EmojiSvgAssetSource['resolveUrl'];
}): EmojiSvgAssetSource {
  return {
    type: 'svg',
    resolveUrl: options.resolveUrl,
  };
}

export function createMixedAssetSource(
  options: Omit<EmojiMixedAssetSource, 'type'>,
): EmojiMixedAssetSource {
  return {
    type: 'mixed',
    unicode: options.unicode,
    custom: options.custom,
    fallback: options.fallback,
  };
}

export function resolveEmojiAsset(
  request: EmojiAssetRequest & {
    assetSource?: EmojiAssetSource;
  },
): EmojiResolvedAsset | null {
  if (request.assetSource) {
    const resolved = resolveFromSource(request.assetSource, request);
    if (resolved) {
      return resolved;
    }
  }

  return resolveDefaultEmojiAsset(request);
}
