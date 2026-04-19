import { describe, expect, it } from 'vitest';
import {
  computeEmojiGridPlaceholderHeight,
  computeEmojiGridVirtualWindow,
  expandEmojiGridVirtualWindow,
  findEmojiGridActiveSectionId,
  getEmojiGridRowCount,
  resolveEmojiGridVirtualization,
} from '../src/components/gridVirtualization';

describe('grid virtualization helpers', () => {
  it('resolves default virtualization settings', () => {
    expect(resolveEmojiGridVirtualization()).toEqual({
      enabled: true,
      overscanRows: 4,
    });
    expect(resolveEmojiGridVirtualization(false)).toEqual({
      enabled: false,
      overscanRows: 0,
    });
    expect(
      resolveEmojiGridVirtualization({ enabled: true, overscanRows: 6 }),
    ).toEqual({
      enabled: true,
      overscanRows: 6,
    });
  });

  it('computes row counts and placeholder heights', () => {
    expect(getEmojiGridRowCount(0, 8)).toBe(0);
    expect(getEmojiGridRowCount(17, 8)).toBe(3);
    expect(computeEmojiGridPlaceholderHeight(0, 40, 4)).toBe(0);
    expect(computeEmojiGridPlaceholderHeight(3, 40, 4)).toBe(128);
  });

  it('creates an empty window for fully offscreen sections', () => {
    expect(
      computeEmojiGridVirtualWindow({
        rowCount: 12,
        scrollTop: 0,
        viewportHeight: 200,
        gridTop: 500,
        rowHeight: 40,
        rowGap: 4,
        overscanRows: 2,
      }),
    ).toEqual({
      startRow: 0,
      endRow: -1,
      beforeRows: 12,
      afterRows: 0,
      rowHeight: 40,
      rowGap: 4,
    });
  });

  it('expands the rendered window to keep the active row mounted', () => {
    const window = computeEmojiGridVirtualWindow({
      rowCount: 20,
      scrollTop: 0,
      viewportHeight: 220,
      gridTop: 0,
      rowHeight: 40,
      rowGap: 4,
      overscanRows: 1,
    });

    expect(
      expandEmojiGridVirtualWindow(window, 20, 10),
    ).toMatchObject({
      startRow: 0,
      endRow: 10,
      beforeRows: 0,
      afterRows: 9,
    });
  });

  it('finds the active category from cached section offsets', () => {
    expect(
      findEmojiGridActiveSectionId({
        sections: [
          { id: 'recent', sectionTop: 0 },
          { id: 'smileys', sectionTop: 120 },
          { id: 'people', sectionTop: 320 },
        ],
        thresholdTop: 180,
        fallbackId: 'recent',
      }),
    ).toBe('smileys');
  });
});
