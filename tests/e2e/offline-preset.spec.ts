import { expect, test } from '@playwright/test';

test.describe('MojiX offline preset', () => {
  test('renders without hitting jsdelivr when bootstrap preloads local data', async ({
    page,
  }) => {
    let jsdelivrRequests = 0;

    await page.route('https://cdn.jsdelivr.net/**', async (route) => {
      jsdelivrRequests += 1;
      await route.abort();
    });

    await page.goto('/?fixture=offline-preset');
    await expect(
      page.getByRole('heading', { name: 'MojiX offline fixture' }),
    ).toBeVisible();
    await expect(page.locator('[data-mx-slot="loading"]')).toHaveCount(0);
    await expect(page.locator('[data-mx-slot="emoji"]').first()).toBeVisible();

    await page.locator('[data-mx-slot="emoji"]').first().click();
    await expect(page.getByTestId('offline-selection-output')).not.toHaveText(
      'No emoji selected',
    );
    expect(jsdelivrRequests).toBe(0);
  });
});
