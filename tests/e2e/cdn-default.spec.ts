import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const emojiDataJson = readFileSync(
  new URL('../../src/core/generated/emoji-data.json', import.meta.url),
  'utf8',
);

test.describe('MojiX CDN data loading', () => {
  test('loads emoji data from jsdelivr on first mount', async ({ page }) => {
    let emojiDataRequests = 0;

    await page.route(
      'https://cdn.jsdelivr.net/**/data/emoji-data.json',
      async (route) => {
        emojiDataRequests += 1;
        await new Promise((resolve) => setTimeout(resolve, 150));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: emojiDataJson,
        });
      },
    );

    await page.goto('/?fixture=cdn-default');
    await expect(
      page.getByRole('heading', { name: 'MojiX CDN fixture' }),
    ).toBeVisible();
    await expect(page.locator('[data-mx-slot="loading"]')).toBeVisible();
    await expect(page.locator('[data-mx-slot="emoji"]').nth(1)).toBeVisible();
    await expect(page.locator('[data-mx-slot="loading"]')).toHaveCount(0);
    expect(emojiDataRequests).toBe(1);
  });

  test('keeps loading visible and reports errors when the CDN request fails', async ({
    page,
  }) => {
    let emojiDataRequests = 0;

    await page.route(
      'https://cdn.jsdelivr.net/**/data/emoji-data.json',
      async (route) => {
        emojiDataRequests += 1;

        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"error":"unavailable"}',
        });
      },
    );

    await page.goto('/?fixture=cdn-failure');
    await expect(
      page.getByRole('heading', { name: 'MojiX CDN fixture' }),
    ).toBeVisible();
    await expect(page.locator('[data-mx-slot="loading"]')).toBeVisible();
    await expect(page.getByTestId('cdn-error-output')).not.toHaveText('none');
    await expect(page.locator('[data-mx-slot="emoji"]').first()).toContainText('👋');
    expect(emojiDataRequests).toBe(1);
  });
});
