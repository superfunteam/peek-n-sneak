import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium, webkit, type Browser, type Page } from 'playwright';
import {
  createGame,
  hideAt,
  nextRound,
  advanceGame,
  EMPTY_INPUT,
  publicState,
} from '../game/engine';

const origin = process.env.TEST_ORIGIN ?? 'http://localhost:5173';
const engines = { chromium, webkit };
const browsers: Partial<Record<keyof typeof engines, Browser>> = {};
before(async () => {
  for (const [name, engine] of Object.entries(engines))
    browsers[name as keyof typeof engines] = await engine.launch({
      headless: true,
    });
});
after(async () => {
  await Promise.all(Object.values(browsers).map((b) => b!.close()));
});

const dimensions = (page: Page) =>
  page.evaluate(() => {
    const [screen, canvasBounds, controls, status] = [
      '.screen-bezel',
      'canvas',
      '.touch-controls',
      '.play-status',
    ].map((selector) => {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 10) / 10);
    });
    const canvas = document.querySelector('canvas')!;
    return {
      screen,
      canvas: canvasBounds,
      controls,
      status,
      buffer: [canvas.width, canvas.height],
      scroll: [scrollX, scrollY],
      zoom: visualViewport!.scale,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
const waitStatus = (page: Page, text: string) =>
  page.waitForFunction(
    (expected) =>
      document.querySelector('.play-status')?.textContent?.includes(expected),
    text,
  );
const xPixel = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      document
        .querySelector('canvas')!
        .getContext('2d')!
        .getImageData(197, 144, 1, 1).data,
    ),
  );

for (const engine of Object.keys(engines) as (keyof typeof engines)[])
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ])
    test(`${engine} ${viewport.width}×${viewport.height}: prompts, empty searches, and rounds keep the game fixed`, async () => {
      const page = await browsers[engine]!.newPage({
        viewport,
        isMobile: true,
        hasTouch: true,
      });
      const game = createGame('houston');
      hideAt(game, 'pink-a', 'closet');
      let revision = 0;
      // Controlled server snapshots exercise the real React/Phaser UI without a
      // production room, a 50-second bot wait, or a backend dependency.
      await page.route('**/api/rooms**', (route) =>
        route.fulfill({
          json: {
            code: 'BROWSERTEST1',
            token: 'browser-test-session',
            player: 0,
            game: publicState(game, 0),
            started: true,
            ready: [false, false],
            opponentConnected: true,
            left: null,
            revision: ++revision,
          },
        }),
      );
      try {
        await page.goto(origin);
        await page.getByRole('tab', { name: 'With a friend' }).click();
        await page
          .getByRole('button', { name: 'Make a room', exact: true })
          .click();
        await waitStatus(page, 'Walk to a hiding spot');
        await page.locator('canvas').waitFor();
        await page.evaluate(async () => {
          await document.fonts.ready;
          scrollTo(0, 0);
        });
        // Allow Phaser's initial scale refresh, not gameplay-driven rescaling.
        await page.waitForTimeout(300);
        const baseline = await dimensions(page);
        assert.deepEqual(baseline.buffer, [320, 208]);
        assert.equal(baseline.zoom, 1);
        assert.equal(baseline.overflow, false);
        const canvasBox = await page.locator('canvas').boundingBox();
        assert.ok(canvasBox);
        await page.touchscreen.tap(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2,
        );
        await page.touchscreen.tap(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2,
        );
        assert.deepEqual(
          await dimensions(page),
          baseline,
          'repeated game touches do not zoom or scroll',
        );

        Object.assign(game.players[0], { x: 202, y: 142 });
        await waitStatus(page, 'Under the couch');
        assert.deepEqual(
          await dimensions(page),
          baseline,
          'approaching a spot',
        );

        advanceGame(game, [{ x: 0, y: 0, action: true }, EMPTY_INPUT], 0.8);
        assert.ok(game.checked.includes('living-a/sofa-under'));
        await waitStatus(page, 'Nobody here.');
        await page.waitForFunction(
          () =>
            document
              .querySelector('canvas')!
              .getContext('2d')!
              .getImageData(197, 144, 1, 1).data[0] === 245,
        );
        assert.deepEqual(await xPixel(page), [245, 172, 130, 255]);
        assert.deepEqual(
          await dimensions(page),
          baseline,
          'empty search and wrapped feedback',
        );

        Object.assign(game.players[0], { room: 'blue-a', x: 170, y: 170 });
        await page.waitForFunction(() =>
          document.querySelector('.room-label')?.textContent?.includes('Blue'),
        );
        assert.deepEqual(await dimensions(page), baseline, 'changing rooms');
        Object.assign(game.players[0], { room: 'living-a', x: 202, y: 142 });
        game.expert = true;
        await waitStatus(page, 'Nobody here.');
        await page.waitForTimeout(100);
        assert.deepEqual(
          await xPixel(page),
          [245, 172, 130, 255],
          'X persists when returning, including Expert',
        );

        nextRound(game);
        Object.assign(game.players[0], { x: 202, y: 142 });
        await waitStatus(page, 'HIDE');
        await page.waitForTimeout(100);
        assert.notDeepEqual(
          await xPixel(page),
          [245, 172, 130, 255],
          'X clears for the new round',
        );
        assert.deepEqual(await dimensions(page), baseline, 'round change');

        const gestures = await page
          .locator('.screen-bezel')
          .evaluate((el) => getComputedStyle(el).touchAction);
        assert.equal(gestures, 'none');
        if (viewport.width <= 760) {
          const inputSize = await page
            .getByRole('textbox', { name: 'Game invite link' })
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
          assert.ok(inputSize >= 16, 'invite field avoids phone focus zoom');
        }
      } finally {
        await page.close();
      }
    });
