export type EmojiPopoverPlacement = 'top' | 'bottom' | 'auto';
export type EmojiPopoverSide = 'top' | 'bottom';
export type EmojiPopoverAlign = 'start' | 'end' | 'center';

export interface EmojiPopoverAnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface EmojiPopoverViewport {
  width: number;
  height: number;
}

export interface ComputeEmojiPopoverPositionOptions {
  /** Trigger rectangle in viewport coordinates (e.g. from getBoundingClientRect). */
  anchor: EmojiPopoverAnchorRect;
  /** Intrinsic size the popover content would like to take. */
  content: { width: number; height: number };
  viewport: EmojiPopoverViewport;
  /** Preferred side; `'auto'` flips to wherever the content fits. */
  placement?: EmojiPopoverPlacement;
  /** Gap between the anchor and the content. */
  offset?: number;
  /** Horizontal alignment of the content relative to the anchor. */
  align?: EmojiPopoverAlign;
  /** Minimum gap kept from every viewport edge. */
  padding?: number;
}

export interface EmojiPopoverPosition {
  /** Coordinates for a `position: fixed` element. */
  left: number;
  top: number;
  /** Side the content was placed on, after flipping. */
  side: EmojiPopoverSide;
  /** Height the content may occupy without overflowing the viewport. */
  maxHeight: number;
  /** Width the content may occupy without overflowing the viewport. */
  maxWidth: number;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Picks the side that honors the caller's preference when it fits, and
 * otherwise flips to the side with more room so the content stays visible.
 */
function resolveSide(
  placement: EmojiPopoverPlacement,
  spaceAbove: number,
  spaceBelow: number,
  contentHeight: number,
): EmojiPopoverSide {
  if (placement === 'top') {
    return spaceAbove >= contentHeight || spaceAbove >= spaceBelow
      ? 'top'
      : 'bottom';
  }

  if (placement === 'bottom') {
    return spaceBelow >= contentHeight || spaceBelow >= spaceAbove
      ? 'bottom'
      : 'top';
  }

  if (spaceBelow >= contentHeight) {
    return 'bottom';
  }

  if (spaceAbove >= contentHeight) {
    return 'top';
  }

  return spaceBelow >= spaceAbove ? 'bottom' : 'top';
}

/**
 * Computes a viewport-aware position for a popover anchored to a trigger,
 * flipping (top/bottom) and shifting (horizontally) so it never overflows the
 * viewport edges, and capping `maxHeight`/`maxWidth` so the picker can shrink
 * and scroll instead of being clipped. Pure function — no DOM access.
 */
export function computeEmojiPopoverPosition(
  options: ComputeEmojiPopoverPositionOptions,
): EmojiPopoverPosition {
  const {
    anchor,
    content,
    viewport,
    placement = 'auto',
    offset = 8,
    align = 'start',
    padding = 8,
  } = options;

  const spaceBelow = viewport.height - (anchor.top + anchor.height) - offset;
  const spaceAbove = anchor.top - offset;
  const side = resolveSide(placement, spaceAbove, spaceBelow, content.height);

  const availableSpace = Math.max(
    0,
    (side === 'bottom' ? spaceBelow : spaceAbove) - padding,
  );
  const maxHeight = Math.max(0, Math.min(content.height, availableSpace));
  const maxWidth = Math.max(
    0,
    Math.min(content.width, viewport.width - padding * 2),
  );

  const top =
    side === 'bottom'
      ? anchor.top + anchor.height + offset
      : anchor.top - offset - maxHeight;

  let left: number;

  if (align === 'end') {
    left = anchor.left + anchor.width - maxWidth;
  } else if (align === 'center') {
    left = anchor.left + anchor.width / 2 - maxWidth / 2;
  } else {
    left = anchor.left;
  }

  left = clamp(left, padding, viewport.width - maxWidth - padding);

  return {
    left,
    top,
    side,
    maxHeight,
    maxWidth,
  };
}
