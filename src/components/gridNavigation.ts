import type { EmojiSection } from '../core/types';

export interface EmojiGridTabStop {
  sectionIndex: number;
  emojiIndex: number;
}

/**
 * Resolves the grid tab stop for the emoji cell containing an event target, or
 * `null` when the event did not originate inside a cell. Used by the grids to
 * delegate click/hover/focus handling to the scroll container instead of
 * attaching listeners to every cell button.
 */
export function getEmojiGridTabStopFromTarget(
  target: EventTarget | null,
): EmojiGridTabStop | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const cell = target.closest<HTMLElement>('[data-mx-slot="emoji"]');

  if (!cell) {
    return null;
  }

  const sectionIndex = Number(cell.dataset.section);
  const emojiIndex = Number(cell.dataset.index);

  if (!Number.isInteger(sectionIndex) || !Number.isInteger(emojiIndex)) {
    return null;
  }

  return { sectionIndex, emojiIndex } satisfies EmojiGridTabStop;
}

export function getEmojiGridTabStopByOffset(
  sections: EmojiSection[],
  current: EmojiGridTabStop,
  offset: number,
) {
  let cursor = 0;
  let currentFlatIndex = -1;

  for (
    let sectionIndex = 0;
    sectionIndex < sections.length;
    sectionIndex += 1
  ) {
    const section = sections[sectionIndex];

    if (!section) {
      continue;
    }

    if (sectionIndex === current.sectionIndex) {
      currentFlatIndex = cursor + current.emojiIndex;
    }

    cursor += section.emojis.length;
  }

  if (cursor === 0 || currentFlatIndex < 0) {
    return null;
  }

  const targetFlatIndex = Math.min(
    Math.max(currentFlatIndex + offset, 0),
    cursor - 1,
  );
  let targetCursor = 0;

  for (
    let sectionIndex = 0;
    sectionIndex < sections.length;
    sectionIndex += 1
  ) {
    const section = sections[sectionIndex];

    if (!section) {
      continue;
    }

    const nextCursor = targetCursor + section.emojis.length;

    if (targetFlatIndex < nextCursor) {
      return {
        sectionIndex,
        emojiIndex: targetFlatIndex - targetCursor,
      } satisfies EmojiGridTabStop;
    }

    targetCursor = nextCursor;
  }

  return null;
}

export function getEmojiGridPageOffset(options: {
  columns: number;
  containerHeight: number;
  rowHeight: number;
  direction: 1 | -1;
}) {
  const pageRows = Math.max(
    1,
    Math.floor(options.containerHeight / Math.max(options.rowHeight, 1)),
  );

  return (
    options.direction * Math.max(options.columns, pageRows * options.columns)
  );
}
