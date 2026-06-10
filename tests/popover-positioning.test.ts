import { describe, expect, it } from 'vitest';
import { computeEmojiPopoverPosition } from '../src/components/popover/positioning';

const VIEWPORT = { width: 1000, height: 800 };

describe('computeEmojiPopoverPosition', () => {
  it('places the content below the anchor when it fits (auto)', () => {
    const result = computeEmojiPopoverPosition({
      anchor: { top: 100, left: 200, width: 40, height: 40 },
      content: { width: 320, height: 400 },
      viewport: VIEWPORT,
      offset: 8,
    });

    expect(result.side).toBe('bottom');
    expect(result.top).toBe(148); // 100 + 40 + 8
    expect(result.left).toBe(200);
    expect(result.maxHeight).toBe(400);
  });

  it('flips above when there is no room below', () => {
    const result = computeEmojiPopoverPosition({
      anchor: { top: 720, left: 200, width: 40, height: 40 },
      content: { width: 320, height: 400 },
      viewport: VIEWPORT,
      offset: 8,
    });

    expect(result.side).toBe('top');
    // sits above the anchor: anchor.top - offset - maxHeight
    expect(result.top).toBe(720 - 8 - result.maxHeight);
    expect(result.top).toBeGreaterThanOrEqual(0);
  });

  it('caps maxHeight to the available space so it never overflows', () => {
    const result = computeEmojiPopoverPosition({
      anchor: { top: 40, left: 200, width: 40, height: 40 },
      content: { width: 320, height: 700 },
      viewport: { width: 1000, height: 480 },
      offset: 8,
      padding: 8,
    });

    // bottom space = 480 - 80 - 8 - 8 = 384
    expect(result.side).toBe('bottom');
    expect(result.maxHeight).toBe(384);
  });

  it('aligns the right edges with align="end"', () => {
    const result = computeEmojiPopoverPosition({
      anchor: { top: 100, left: 600, width: 40, height: 40 },
      content: { width: 320, height: 300 },
      viewport: VIEWPORT,
      align: 'end',
    });

    // right edge of content == right edge of anchor (640) -> left = 320
    expect(result.left).toBe(320);
  });

  it('shifts horizontally to stay inside the viewport', () => {
    const result = computeEmojiPopoverPosition({
      anchor: { top: 100, left: 960, width: 40, height: 40 },
      content: { width: 320, height: 300 },
      viewport: VIEWPORT,
      padding: 8,
    });

    // would overflow right; clamped to viewport.width - width - padding
    expect(result.left).toBe(1000 - 320 - 8);
  });

  it('honors an explicit placement that fits', () => {
    const result = computeEmojiPopoverPosition({
      anchor: { top: 400, left: 200, width: 40, height: 40 },
      content: { width: 320, height: 200 },
      viewport: VIEWPORT,
      placement: 'top',
    });

    expect(result.side).toBe('top');
  });
});
