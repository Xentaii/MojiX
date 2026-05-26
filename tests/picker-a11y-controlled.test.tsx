import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { EmojiPicker, MojiX } from '../src/index';

const hiddenSystemCategories = {
  smileys: { hidden: true },
  people: { hidden: true },
  animals: { hidden: true },
  food: { hidden: true },
  activities: { hidden: true },
  travel: { hidden: true },
  objects: { hidden: true },
  symbols: { hidden: true },
  flags: { hidden: true },
} as const;

describe('picker accessibility and controlled integration', () => {
  it('supports PageDown/PageUp and Escape in the emoji grid', async () => {
    const customEmojis = Array.from({ length: 12 }, (_, index) => ({
      id: `emoji-${index}`,
      name: `Emoji ${index}`,
      native: String(index),
    }));

    const { container } = render(
      <EmojiPicker
        showPreview={false}
        trackHoverActive
        showRecents={false}
        showSkinTones={false}
        columns={4}
        categories={hiddenSystemCategories}
        customEmojis={customEmojis}
      />,
    );

    const emojis = await waitFor(() => {
      const buttons = Array.from(
        container.querySelectorAll('[data-mx-slot="emoji"]'),
      ) as HTMLButtonElement[];

      expect(buttons).toHaveLength(customEmojis.length);
      return buttons;
    });

    await act(async () => {
      emojis[0]?.focus();
    });
    expect(emojis[0]).toHaveFocus();

    fireEvent.keyDown(emojis[0]!, { key: 'PageDown' });
    expect(emojis[4]).toHaveFocus();

    fireEvent.keyDown(emojis[4]!, { key: 'PageUp' });
    expect(emojis[0]).toHaveFocus();

    fireEvent.mouseEnter(emojis[0]!);

    await waitFor(() => {
      expect(emojis[0]).toHaveAttribute('data-active', 'true');
    });

    fireEvent.keyDown(emojis[0]!, { key: 'Escape' });
    expect(emojis[0]).not.toHaveFocus();

    await waitFor(() => {
      expect(emojis[0]).not.toHaveAttribute('data-active');
    });
  });

  it('emits controlled recent updates without mutating local state', async () => {
    const onRecentEmojiChange = vi.fn();

    const { container } = render(
      <EmojiPicker
        recentEmoji={[]}
        onRecentEmojiChange={onRecentEmojiChange}
        showPreview={false}
        showSkinTones={false}
        categories={hiddenSystemCategories}
        customEmojis={[{ id: 'wave', name: 'Wave', native: 'w' }]}
      />,
    );

    const waveButton = await waitFor(() => {
      const button = container.querySelector(
        '[data-mx-slot="emoji"]',
      ) as HTMLButtonElement | null;

      expect(button).not.toBeNull();
      return button!;
    });

    fireEvent.click(waveButton);

    expect(onRecentEmojiChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'wave',
        custom: true,
        skinTone: 'default',
      }),
    ]);
  });

  it('cycles focus and reports close intent when root focus trap is enabled', () => {
    const onOpenChange = vi.fn();
    const { container, getByText } = render(
      <MojiX.Root open trapFocus onOpenChange={onOpenChange}>
        <button type="button">First</button>
        <button type="button">Last</button>
      </MojiX.Root>,
    );
    const root = container.querySelector(
      '[data-mx-slot="root"]',
    ) as HTMLDivElement;
    const first = getByText('First');
    const last = getByText('Last');

    last.focus();
    fireEvent.keyDown(root, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(root, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
