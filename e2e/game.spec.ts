import { expect, test, type Page } from '@playwright/test';

/** Collects console errors and page errors (incl. CSP violations). */
function track_errors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('ai-restaurant-battle:settings', JSON.stringify({ language: 'en' }));
    }
  });
});

test('title screen renders the 3D plaza and starts a game', async ({ page }) => {
  const errors = track_errors(page);
  await page.goto('/');
  await expect(page.locator('.scene-canvas')).toBeVisible();
  await expect(page.locator('#scene-fallback')).toBeHidden();
  await expect(page.locator('#title-heading')).toHaveText('AI Restaurant Battle');

  await page.getByRole('button', { name: '日本語' }).click();
  await expect(page.locator('#start-button')).toHaveText('お店をオープン');
  const track = page.locator('#title-screen .track-option[data-track="lunchRush"]');
  await track.click();
  await expect(track).toHaveClass(/active/);

  await page.locator('#restaurant-name').fill('<b>Neko</b> Diner');
  await page.locator('#start-button').click();
  await expect(page.locator('#game-ui')).toBeVisible();
  await expect(page.locator('.day-label')).toHaveText('1日目 / 7');
  await expect(page.locator('.ranking-row')).toHaveCount(6);
  await expect(page.locator('.ranking-row.is-player .name')).toHaveText('bNeko/b Diner');
  expect(errors).toEqual([]);
});

test('core loop: time passes, actions give feedback, pause works', async ({ page }) => {
  const errors = track_errors(page);
  await page.goto('/');
  await page.locator('#start-button').click();
  const clock = page.locator('.clock');
  await expect(clock).toHaveText(/^(1:00|0:5\d)$/);
  const first = await clock.textContent();
  await expect(clock).not.toHaveText(first as string, { timeout: 4000 });

  await page.getByRole('tab', { name: /Marketing/ }).click();
  await page.locator('#campaign-social').click();
  await expect(page.locator('.toast').filter({ hasText: 'Social media launched!' })).toBeVisible();

  await page.keyboard.press('1');
  await page.locator('#add-dish-button').click();
  await page.locator('#dish-name').fill('Gyoza');
  await page.locator('#dish-submit').click();
  await expect(page.locator('.menu-card .dish-name').filter({ hasText: 'Gyoza' })).toBeVisible();

  await page.locator('body').click({ position: { x: 640, y: 300 } });
  await page.keyboard.press('p');
  await expect(page.locator('.settings-modal')).toBeVisible();
  const frozen = await clock.textContent();
  await page.waitForTimeout(1500);
  await expect(clock).toHaveText(frozen as string);
  await page.keyboard.press('Escape');
  await expect(page.locator('.settings-modal')).toBeHidden();
  expect(errors).toEqual([]);
});

test('clicking a shop in 3D shows rival intel', async ({ page }) => {
  await page.goto('/');
  await page.locator('#start-button').click();
  await page.waitForTimeout(500);
  const box = await page.locator('#stage').boundingBox();
  if (!box) throw new Error('stage not laid out');
  // The player's shop sits at the front-center of the framed plaza.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.72);
  await expect(page.locator('.rival-intel')).toBeVisible();
});

test('a full game ends with results and can be replayed', async ({ page }) => {
  await page.goto('/');
  await page.locator('#start-button').click();
  await page.evaluate(() => {
    const app = (
      window as unknown as { __app: { get_engine(): { tick(): void; is_over(): boolean } } }
    ).__app;
    const engine = app.get_engine();
    while (!engine.is_over()) engine.tick();
  });
  await expect(page.locator('.gameover-modal')).toBeVisible();
  await expect(page.locator('.result-row')).toHaveCount(6);
  await expect(page.locator('.award')).toHaveCount(4);
  await page.locator('#replay-button').click();
  await expect(page.locator('.gameover-modal')).toBeHidden();
  await expect(page.locator('.day-label')).toHaveText('Day 1 / 7');
});

test('progress survives a reload via Continue', async ({ page }) => {
  await page.goto('/');
  await page.locator('#start-button').click();
  await page.evaluate(() => {
    const app = (window as unknown as { __app: { get_engine(): { tick(): void } } }).__app;
    for (let i = 0; i < 30; i++) app.get_engine().tick();
  });
  await page.reload();
  await page.locator('#continue-button').click();
  await expect(page.locator('#game-ui')).toBeVisible();
  await expect(page.locator('.clock')).toHaveText(/0:[23]\d/);
});

test('mobile layout has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#start-button').click();
  await expect(page.locator('#dock')).toBeVisible();
  const overflow = await page.evaluate(() => {
    const ui = document.getElementById('game-ui') as HTMLElement;
    return ui.scrollWidth - ui.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);
});

test('background music plays after the first interaction and switches tracks', async ({ page }) => {
  await page.addInitScript(() => {
    const stats = { contexts: [] as AudioContext[], oscillators: 0 };
    (window as unknown as { __audioStats: typeof stats }).__audioStats = stats;
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        stats.contexts.push(this);
      }
      override createOscillator(): OscillatorNode {
        stats.oscillators += 1;
        return super.createOscillator();
      }
    };
  });
  await page.goto('/');
  const read = () =>
    page.evaluate(() => {
      const { contexts, oscillators } = (
        window as unknown as { __audioStats: { contexts: AudioContext[]; oscillators: number } }
      ).__audioStats;
      return { count: contexts.length, state: contexts[0]?.state, oscillators };
    });
  expect((await read()).count).toBe(0);

  await page.locator('#title-screen .track-option[data-track="kitchenBounce"]').click();
  await expect.poll(async () => (await read()).state).toBe('running');
  const before = (await read()).oscillators;
  await expect.poll(async () => (await read()).oscillators).toBeGreaterThan(before + 20);

  await page.locator('#title-screen .track-option[data-track="off"]').click();
  await page.waitForTimeout(800);
  const silent = (await read()).oscillators;
  await page.waitForTimeout(1000);
  expect((await read()).oscillators).toBe(silent);
  expect((await read()).count).toBe(1);
});
