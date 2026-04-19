import { expect, test } from '@playwright/test';

test.describe('MojiX accessibility fixture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?fixture=a11y');
    await expect(
      page.getByRole('heading', {
        name: 'MojiX accessibility fixture',
      }),
    ).toBeVisible();
  });

  test('search input exposes an accessible name and clear action', async ({
    page,
  }) => {
    const searchbox = page.getByRole('searchbox', {
      name: 'Search emoji, aliases, emoticons',
    });

    await expect(searchbox).toBeVisible();
    await searchbox.fill('rocket');
    await expect(
      page.getByRole('button', { name: 'Clear search' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(searchbox).toHaveValue('');
  });

  test('initial visible categories render emoji instead of an empty placeholder window', async ({
    page,
  }) => {
    const smileysSection = page.locator(
      'section[data-category-id="smileys"]',
    );
    const smileysEmoji = smileysSection.locator(
      '[data-mx-slot="emoji"]',
    );

    await expect(smileysSection).toBeVisible();
    await expect(smileysEmoji.first()).toBeVisible();
  });

  test('keyboard navigation can move through the virtualized grid and select an emoji', async ({
    page,
  }) => {
    const searchbox = page.getByRole('searchbox', {
      name: 'Search emoji, aliases, emoticons',
    });

    await searchbox.fill('face');

    const firstEmoji = page.locator('[data-mx-slot="emoji"]').first();
    await firstEmoji.focus();
    await expect(firstEmoji).toBeFocused();

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('ArrowDown');
    }

    await page.keyboard.press('Enter');

    await expect(
      page.getByTestId('selection-output'),
    ).not.toHaveText('No emoji selected');
  });

  test('skin tone controls expose labelled options', async ({ page }) => {
    const toneButton = page.getByRole('button', {
      name: 'Skin tone',
    });

    await expect(toneButton).toBeVisible();
    await toneButton.click();

    await expect(
      page.getByRole('button', { name: /^Light$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Medium dark$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Dark$/ }),
    ).toBeVisible();
  });
});
