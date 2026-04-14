import {
  createNativeAssetSource,
  createSpriteSheetAssetSource,
} from '../lib/assets';
import {
  createEmojiSpriteSheet,
  resolveSpriteSheetConfig,
} from '../lib/sprites';
import type {
  EmojiCategoryIconPreset,
  EmojiSpriteSheetConfig,
  ResolvedEmojiCategoryIcon,
} from '../lib/types';
import { LUCIDE_CATEGORY_ICON_BODIES } from './icons/lucideCategoryIconBodies';
import { EmojiSprite } from './EmojiSprite';
import { createClassName } from './utils';

const NATIVE_SOURCE = createNativeAssetSource();

export interface EmojiCategoryIconProps {
  icon: ResolvedEmojiCategoryIcon;
  label: string;
  size?: number;
  className?: string;
  spriteSheet?: EmojiSpriteSheetConfig;
}

function resolveIconStyle(
  style: EmojiCategoryIconPreset,
  spriteSheet?: EmojiSpriteSheetConfig,
) {
  if (style === 'picker') {
    return resolveSpriteSheetConfig(spriteSheet).vendor;
  }

  if (style === 'solid' || style === 'mono-filled') {
    return 'outline';
  }

  if (style === 'mono-outline') {
    return 'outline';
  }

  return style;
}

function createVendorSheet(
  style: EmojiCategoryIconPreset,
  spriteSheet?: EmojiSpriteSheetConfig,
) {
  const resolvedPickerSheet = resolveSpriteSheetConfig(spriteSheet);

  if (style === 'picker') {
    return resolvedPickerSheet;
  }

  return createEmojiSpriteSheet({
    vendor: style,
    sheetSize: resolvedPickerSheet.sheetSize,
    padding: resolvedPickerSheet.padding,
    gridSize: resolvedPickerSheet.gridSize,
    variant: resolvedPickerSheet.variant,
    fallbackNative: true,
    source: 'cdn',
    version: resolvedPickerSheet.version,
  });
}

function renderMonochromeGlyph(icon: ResolvedEmojiCategoryIcon) {
  const definition =
    LUCIDE_CATEGORY_ICON_BODIES[icon.glyph] ??
    LUCIDE_CATEGORY_ICON_BODIES.sparkles;

  return (
    <svg
      viewBox="0 0 24 24"
      className="mx-picker__category-glyph"
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: definition.body }}
      />
    </svg>
  );
}

export function EmojiCategoryIcon({
  icon,
  label,
  size = 18,
  className,
  spriteSheet,
}: EmojiCategoryIconProps) {
  const resolvedStyle = resolveIconStyle(icon.style, spriteSheet);
  const iconSizeStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size}px`,
  };

  if (resolvedStyle === 'outline') {
    return (
      <span
        aria-hidden="true"
        className={createClassName('mx-picker__category-icon', className)}
        style={iconSizeStyle}
      >
        {renderMonochromeGlyph(icon)}
      </span>
    );
  }

  if (resolvedStyle === 'native') {
    if (icon.renderable?.kind === 'unicode') {
      return (
        <EmojiSprite
          emoji={icon.renderable}
          size={size}
          assetSource={NATIVE_SOURCE}
          className={createClassName(
            'mx-picker__category-icon',
            className,
          )}
          title={label}
        />
      );
    }

    if (icon.renderable) {
      return (
        <EmojiSprite
          emoji={icon.renderable}
          size={size}
          className={createClassName(
            'mx-picker__category-icon',
            className,
          )}
          title={label}
        />
      );
    }

    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={createClassName(
          'mx-picker__category-icon',
          'mx-picker__category-native',
          className,
        )}
        style={iconSizeStyle}
      >
        {icon.emoji}
      </span>
    );
  }

  if (icon.renderable?.kind === 'unicode') {
    const vendorSheet = createVendorSheet(resolvedStyle, spriteSheet);

    return (
      <EmojiSprite
        emoji={icon.renderable}
        size={size}
        spriteSheet={vendorSheet}
        assetSource={createSpriteSheetAssetSource({
          spriteSheet: vendorSheet,
        })}
        className={createClassName(
          'mx-picker__category-icon',
          className,
        )}
        title={label}
      />
    );
  }

  if (icon.renderable) {
    return (
      <EmojiSprite
        emoji={icon.renderable}
        size={size}
        className={createClassName(
          'mx-picker__category-icon',
          className,
        )}
        title={label}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={createClassName(
        'mx-picker__category-icon',
        'mx-picker__category-native',
        className,
      )}
      style={iconSizeStyle}
    >
      {icon.emoji}
    </span>
  );
}
