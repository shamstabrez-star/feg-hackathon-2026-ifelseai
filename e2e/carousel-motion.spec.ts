import { expect, test } from "@playwright/test";
import {
  CYCLE_MS,
  RESUME_AFTER_INTERACTION_MS,
  TOL,
  cardGeometry,
  expectSingleStep,
  expectStationary,
  gotoCasino,
  hoverRail,
  noHorizontalOverflow,
  pos,
  rail,
  stepSize,
  touchSwipe,
  waitForStep,
} from "./rail";

/**
 * Real-browser verification of the existing calm Casino content rails.
 * No test-only UI or product hooks are used: every assertion reads the real
 * DOM (`scrollLeft`, bounding boxes) or drives real browser input.
 */

test.describe("Casino rail — idle motion", () => {
  test("advances exactly one discrete card after the rest cycle", async ({ page }) => {
    const track = await gotoCasino(page);
    const size = await stepSize(track);
    expect(size).toBeGreaterThan(100);

    const start = await pos(track);
    // Nothing may move before the first rest cycle elapses.
    await expectStationary(track, CYCLE_MS - 1500, "rail moved before the rest cycle");
    const { to } = await waitForStep(track, start, CYCLE_MS + 4000);
    expect(Math.abs(to - (start + size))).toBeLessThanOrEqual(TOL);

    // A second step follows one cycle later — discrete, never continuous.
    await expectSingleStep(track, to, CYCLE_MS + 4000);
    await noHorizontalOverflow(page);
  });

  test("cards keep alignment, size and order across an idle step", async ({ page }) => {
    const track = await gotoCasino(page);
    const before = await cardGeometry(track);
    const start = await pos(track);
    await waitForStep(track, start, CYCLE_MS * 2);
    const after = await cardGeometry(track);

    expect(after.map((c) => c.name)).toEqual(before.map((c) => c.name));
    expect(after.map((c) => c.width)).toEqual(before.map((c) => c.width));
    expect(after.map((c) => c.height)).toEqual(before.map((c) => c.height));
    expect(after.map((c) => c.offset)).toEqual(before.map((c) => c.offset));
    // No vertical drift / layout shift.
    for (let i = 0; i < after.length; i++) {
      expect(Math.abs(after[i]!.top - before[i]!.top)).toBeLessThanOrEqual(1);
    }
    await noHorizontalOverflow(page);
  });

  test("stops at the end of the row and returns to the start", async ({ page }) => {
    const track = await gotoCasino(page);
    const right = page.getByRole("button", { name: "Scroll Slots games right" });
    for (let i = 0; i < 8; i++) {
      const max = await track.evaluate((el) => el.scrollWidth - el.clientWidth);
      if ((await pos(track)) >= max - TOL) break;
      await right.click();
      await page.waitForTimeout(700);
    }
    const at = await pos(track);
    expect(at).toBeGreaterThan(TOL);

    // Release the focus the arrow button took, and keep the pointer away.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(5, 5);
    const { to } = await waitForStep(track, at, RESUME_AFTER_INTERACTION_MS + CYCLE_MS * 2 + 4000);
    expect(to).toBeLessThanOrEqual(TOL);
  });
});

test.describe("Casino rail — interaction pauses and deferred resume", () => {
  test("desktop hover pauses; resumes with one step only after the pointer leaves", async ({
    page,
  }) => {
    const track = await gotoCasino(page);
    await hoverRail(track);
    const held = await pos(track);
    // Stationary for well over two full rest cycles while hovered.
    await expectStationary(track, CYCLE_MS * 2, "rail moved while hovered");
    expect(Math.abs((await pos(track)) - held)).toBeLessThanOrEqual(TOL);

    await page.mouse.move(5, 5);
    await expectSingleStep(track, held, CYCLE_MS + 4000);
  });

  test("card click pauses motion and never navigates away", async ({ page }) => {
    const track = await gotoCasino(page);
    const url = page.url();
    const card = track.getByRole("button", { name: /Book of Fortune/ });
    await card.click();
    await page.mouse.move(5, 5);

    // Opening a game is an active task context: automatic motion stays off.
    expect(page.url()).toBe(url);
    await expectStationary(track, CYCLE_MS * 2, "rail moved after a card was opened");
    expect(page.url()).toBe(url);
  });

  test("keyboard focus pauses, arrows still scroll, focus is never stolen", async ({ page }) => {
    const track = await gotoCasino(page);
    await track.focus();
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    expect(focused).toBe("Slots games");

    const held = await pos(track);
    await expectStationary(track, CYCLE_MS * 2, "rail moved while focused");
    // Focus stayed exactly where the customer put it.
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
      "Slots games",
    );

    // Manual keyboard scrolling still works.
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(600);
    expect(await pos(track)).toBeGreaterThan(held);

    const manual = await pos(track);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await expectStationary(track, RESUME_AFTER_INTERACTION_MS - 2000, "resumed inside cooldown");
    await waitForStep(track, manual, RESUME_AFTER_INTERACTION_MS + CYCLE_MS + 4000);
  });

  test("manual arrow controls move exactly one card and remain usable", async ({ page }) => {
    const track = await gotoCasino(page);
    await hoverRail(track);
    const size = await stepSize(track);
    const start = await pos(track);
    await page.getByRole("button", { name: "Scroll Slots games right" }).click();
    await page.waitForTimeout(900);
    const right = await pos(track);
    const max = await track.evaluate((el) => el.scrollWidth - el.clientWidth);
    // One card forward, or the end of the row when fewer than one card remains.
    expect(right).toBeGreaterThan(start);
    expect(right - start).toBeLessThanOrEqual(size + TOL);
    expect(right === max || Math.abs(right - (start + size)) <= TOL).toBe(true);

    await page.getByRole("button", { name: "Scroll Slots games left" }).click();
    await page.waitForTimeout(900);
    expect(Math.abs((await pos(track)) - start)).toBeLessThanOrEqual(TOL);
    await noHorizontalOverflow(page);
  });
});

test.describe("Casino rail — touch input", () => {
  test.skip(({ hasTouch }) => !hasTouch, "touch-capable projects only");

  test("tap opens a game without navigation and holds motion", async ({ page }) => {
    const track = await gotoCasino(page);
    const url = page.url();
    const card = track.getByRole("button", { name: /Book of Fortune/ });
    await card.tap();
    expect(page.url()).toBe(url);
    await expectStationary(track, CYCLE_MS * 2, "rail moved after a tap");
  });

  test("swipe scrolls the rail and pauses autoplay", async ({ page }) => {
    const track = await gotoCasino(page);
    const before = await pos(track);
    await touchSwipe(page, track, -180);
    await page.waitForTimeout(700);
    const after = await pos(track);
    // Manual gesture control is preserved (real touch scrolling).
    expect(after).toBeGreaterThan(before);
    await expectStationary(track, RESUME_AFTER_INTERACTION_MS - 1500, "rail moved after a swipe");
    await noHorizontalOverflow(page);
  });
});

test.describe("Casino rail — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("autoplay never moves the rail, manual controls still work", async ({ page }) => {
    const track = await gotoCasino(page);
    const start = await pos(track);
    // Three full autoplay cycles: the position must never change.
    await expectStationary(track, CYCLE_MS * 3, "autoplay ran under reduced motion");
    expect(Math.abs((await pos(track)) - start)).toBeLessThanOrEqual(TOL);

    const size = await stepSize(track);
    await page.getByRole("button", { name: "Scroll Slots games right" }).click();
    await page.waitForTimeout(900);
    const moved = await pos(track);
    const limit = await track.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(moved).toBeGreaterThan(start);
    expect(moved === limit || Math.abs(moved - (start + size)) <= TOL).toBe(true);

    // Still no autoplay afterwards.
    await page.mouse.move(5, 5);
    await expectStationary(track, CYCLE_MS * 2, "autoplay resumed under reduced motion");
  });
});
