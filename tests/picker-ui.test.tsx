import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { EmojiPicker } from '../src/index';

describe('picker UI theming hooks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('applies root color variables from the colors prop', () => {
    const { container } = render(
      <EmojiPicker
        colors={{
          accent: '#123456',
          hover: 'rgba(1, 2, 3, 0.25)',
          scrollbarThumb: 'rgba(9, 9, 9, 0.4)',
        }}
      />,
    );

    const root = container.querySelector(
      '[data-mx-slot="root"]',
    ) as HTMLDivElement | null;

    expect(root).not.toBeNull();
    expect(root?.style.getPropertyValue('--mx-accent')).toBe('#123456');
    expect(root?.style.getPropertyValue('--mx-hover')).toBe(
      'rgba(1, 2, 3, 0.25)',
    );
    expect(root?.style.getPropertyValue('--mx-scrollbar-thumb')).toBe(
      'rgba(9, 9, 9, 0.4)',
    );
  });

  it('supports per-item emoji and category hover colors', () => {
    const { container } = render(
      <EmojiPicker
        colors={{
          emojiHover: () => 'rgb(10, 20, 30)',
          categoryHover: () => 'rgb(40, 50, 60)',
        }}
      />,
    );

    const firstEmoji = container.querySelector(
      '[data-mx-slot="emoji"]',
    ) as HTMLButtonElement | null;
    const firstCategoryButton = container.querySelector(
      '[data-mx-slot="navButton"]',
    ) as HTMLButtonElement | null;

    expect(firstEmoji).not.toBeNull();
    expect(firstCategoryButton).not.toBeNull();
    expect(firstEmoji?.style.getPropertyValue('--mx-emoji-hover')).toBe(
      'rgb(10, 20, 30)',
    );
    expect(
      firstCategoryButton?.style.getPropertyValue('--mx-category-hover'),
    ).toBe('rgb(40, 50, 60)');
  });
});
