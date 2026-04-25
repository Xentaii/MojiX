import {
  createNativeAssetSource,
  createSpriteSheetAssetSource,
} from '../core/assets';
import {
  createEmojiSpriteSheet,
  resolveSpriteSheetConfig,
} from '../core/sprites';
import type {
  EmojiCategoryIconPreset,
  EmojiSpriteSheetConfig,
  ResolvedEmojiCategoryIcon,
} from '../core/types';
import { getLucideCategoryIconDefinition } from './icons/lucideCategoryIconBodies';
import { EmojiSprite } from './EmojiSprite';
import { createClassName } from './utils';
import type { CSSProperties } from 'react';

const NATIVE_SOURCE = createNativeAssetSource();
const FILLED_CATEGORY_ICON_BODIES: Partial<Record<string, string>> = {
  people: `<circle cx="9" cy="7.5" r="4" />
<path d="M2 20a7 7 0 0 1 14 0v1H2z" />
<circle cx="17.5" cy="8" r="3" />
<path d="M14 20a5 5 0 0 1 5-5h.5A2.5 2.5 0 0 1 22 17.5V21h-8z" />`,
};

export interface EmojiCategoryIconProps {
  icon: ResolvedEmojiCategoryIcon;
  label: string;
  size?: number;
  className?: string;
  spriteSheet?: EmojiSpriteSheetConfig;
}

type ResolvedCategoryIconStyle =
  | 'outline'
  | 'solid'
  | 'native'
  | Exclude<EmojiCategoryIconPreset, 'picker' | 'mono-filled' | 'mono-outline' | 'solid' | 'outline' | 'native'>;

function resolveIconStyle(
  style: EmojiCategoryIconPreset,
  spriteSheet?: EmojiSpriteSheetConfig,
): ResolvedCategoryIconStyle {
  if (style === 'picker') {
    return resolveSpriteSheetConfig(spriteSheet).vendor as ResolvedCategoryIconStyle;
  }

  if (style === 'solid' || style === 'mono-filled') {
    return 'solid';
  }

  if (style === 'outline' || style === 'mono-outline') {
    return 'outline';
  }

  return style as ResolvedCategoryIconStyle;
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

function renderMonochromeGlyph(
  icon: ResolvedEmojiCategoryIcon,
  filled: boolean,
) {
  const filledBody = FILLED_CATEGORY_ICON_BODIES[icon.glyph];
  const definition = getLucideCategoryIconDefinition(icon.glyph);

  if (!definition) {
    return null;
  }

  if (filled && filledBody) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="mx-picker__category-glyph"
        aria-hidden="true"
      >
        <g
          fill="currentColor"
          dangerouslySetInnerHTML={{ __html: filledBody }}
        />
      </svg>
    );
  }

  if (filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="mx-picker__category-glyph"
        aria-hidden="true"
      >
        <g
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: definition.body }}
        />
      </svg>
    );
  }

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

function renderNativeCategoryIcon(options: {
  icon: ResolvedEmojiCategoryIcon;
  label: string;
  size: number;
  className?: string;
  iconSizeStyle: CSSProperties;
}) {
  const { icon, label, size, className, iconSizeStyle } = options;

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

  if (resolvedStyle === 'outline' || resolvedStyle === 'solid') {
    const monochromeGlyph = renderMonochromeGlyph(
      icon,
      resolvedStyle === 'solid',
    );

    if (!monochromeGlyph) {
      return renderNativeCategoryIcon({
        icon,
        label,
        size,
        className,
        iconSizeStyle,
      });
    }

    return (
      <span
        aria-hidden="true"
        className={createClassName('mx-picker__category-icon', className)}
        style={iconSizeStyle}
      >
        {monochromeGlyph}
      </span>
    );
  }

  if (resolvedStyle === 'native') {
    return renderNativeCategoryIcon({
      icon,
      label,
      size,
      className,
      iconSizeStyle,
    });
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
