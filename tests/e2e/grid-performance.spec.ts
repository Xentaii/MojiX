import { expect, type Page, test } from '@playwright/test';

const CONTENT_SELECTOR = '[data-mx-slot="content"]';
const EMOJI_SELECTOR = '[data-mx-slot="emoji"]';

/**
 * Loads the performance fixture and waits for the (lazy) virtualized grid to
 * mount a meaningful number of cells.
 */
async function gotoPerformanceFixture(page: Page, query = '') {
  await page.goto(`/?fixture=performance${query}`);
  await expect(page.getByTestId('performance-fixture')).toBeVisible();
  await expect(page.locator(EMOJI_SELECTOR).first()).toBeVisible();
  await page.waitForFunction(
    (selector) => document.querySelectorAll(selector).length > 50,
    EMOJI_SELECTOR,
  );
}

/**
 * Scrolls the grid to its mid point, lets the virtual window settle (the grid
 * recomputes on rAF and again after a 200ms idle timer), and returns how many
 * emoji cells are mounted. A lighter render window mounts fewer cells.
 */
async function settledCellCountAtMiddle(page: Page) {
  return page.evaluate(
    async ({ content, emoji }) => {
      const el = document.querySelector(content);

      if (!el) {
        return 0;
      }

      el.scrollTop = Math.floor((el.scrollHeight - el.clientHeight) / 2);
      el.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      return document.querySelectorAll(emoji).length;
    },
    { content: CONTENT_SELECTOR, emoji: EMOJI_SELECTOR },
  );
}

test.describe('emoji grid performance', () => {
  test('high performanceMode mounts a lighter render window than balanced', async ({
    page,
  }) => {
    await gotoPerformanceFixture(page, '&mode=balanced');
    const balancedCells = await settledCellCountAtMiddle(page);

    await gotoPerformanceFixture(page, '&mode=high');
    const highCells = await settledCellCountAtMiddle(page);

    expect(highCells).toBeGreaterThan(0);
    // The grid must be virtualized (full dataset) for this to hold; if it were
    // not, both counts would render the whole dataset and be equal.
    expect(highCells).toBeLessThan(balancedCells);
  });

  test('performanceMode auto resolves to the lighter window on a low-core device', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        get: () => 2,
      });
    });

    // Forcing balanced ignores the device hint and gives us a reference.
    await gotoPerformanceFixture(page, '&mode=balanced');
    const balancedCells = await settledCellCountAtMiddle(page);

    // Default mode is 'auto'; with 2 reported cores it should pick 'high'.
    await gotoPerformanceFixture(page, '');
    const autoCells = await settledCellCountAtMiddle(page);

    expect(autoCells).toBeGreaterThan(0);
    expect(autoCells).toBeLessThan(balancedCells);
  });

  test('deferGridMount still mounts the grid after the shell paints', async ({
    page,
  }) => {
    // gotoPerformanceFixture waits for >50 mounted cells, so reaching it proves
    // the deferred grid mounts on the following frame rather than never.
    await gotoPerformanceFixture(page, '&defer=1');
    const cells = await page.locator(EMOJI_SELECTOR).count();
    expect(cells).toBeGreaterThan(50);
  });

  test('stays responsive while scrolling under CPU throttling', async ({
    page,
  }) => {
    test.skip(
      !process.env.PERF,
      'Timing-sensitive benchmark. Run with PERF=1 to enable.',
    );

    await page.addInitScript(() => {
      const store: number[] = [];
      (window as unknown as { __longTasks: number[] }).__longTasks = store;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            store.push(entry.duration);
          }
        }).observe({ entryTypes: ['longtask'] });
      } catch {
        // longtask timing not supported; the test will simply see no entries.
      }
    });

    await gotoPerformanceFixture(page, '&mode=high');

    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    // Ignore long tasks from the initial (unthrottled) load.
    await page.evaluate(() => {
      (window as unknown as { __longTasks: number[] }).__longTasks.length = 0;
    });

    await page.evaluate(async (content) => {
      const el = document.querySelector(content);

      if (!el) {
        return;
      }

      const max = el.scrollHeight - el.clientHeight;
      const steps = 12;

      for (let step = 0; step <= steps; step += 1) {
        el.scrollTop = Math.floor((max * step) / steps);
        el.dispatchEvent(new Event('scroll'));
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null)),
        );
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    }, CONTENT_SELECTOR);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    const longTasks = await page.evaluate(
      () => (window as unknown as { __longTasks: number[] }).__longTasks,
    );
    const worst = longTasks.length > 0 ? Math.max(...longTasks) : 0;

    console.log(
      `[perf] worst long task while scrolling @6x CPU: ${worst.toFixed(1)}ms (count=${longTasks.length})`,
    );

    // Generous bound: a single long task over this would mean a visible freeze.
    expect(worst).toBeLessThan(250);
  });
});
