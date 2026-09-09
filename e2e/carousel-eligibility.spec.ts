import { expect, test } from "@playwright/test";
import {
  CYCLE_MS,
  RESUME_AFTER_INTERACTION_MS,
  expectSingleStep,
  expectStationary,
  gotoCasino,
  noHorizontalOverflow,
  pos,
  rail,
} from "./rail";

/**
 * Motion eligibility: session state, search, betslip/transaction and
 * background-tab behaviour. Everything is observed in the real browser.
 */

test.describe("Casino rail — eligibility", () => {
  test("search results replace the rails and nothing moves", async ({ page }) => {
    await gotoCasino(page);
    await page.getByLabel("Search casino games").fill("Book");
    await expect(page.getByText('2 games for "Book"')).toBeVisible();
    await expect(rail(page)).toHaveCount(0);
    await page.waitForTimeout(CYCLE_MS + 1500);
    await expect(rail(page)).toHaveCount(0);
    await noHorizontalOverflow(page);
  });

  test("an active sports selection suppresses motion after moving to Casino", async ({ page }) => {
    await page.goto("/");
    // Open an event and take a price: this is a real customer action.
    await page.getByRole("link", { name: /Real Madrid/ }).first().click();
    await page.getByRole("button", { name: /odds \d/ }).first().click();

    // Client-side navigation keeps the live session state. On narrow layouts
    // the products live behind the compact navigation panel.
    const menu = page.getByRole("button", { name: "Open navigation" });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("link", { name: "Casino", exact: true }).first().click();

    const track = rail(page);
    await track.first().waitFor();
    await page.mouse.move(5, 5);
    await expectStationary(track.first(), CYCLE_MS * 2, "motion ran with an active selection");
    await noHorizontalOverflow(page);
  });


  test("hidden document blocks autoplay; restore resumes only when eligible", async ({ page }) => {
    const track = await gotoCasino(page);

    // Limitation: headless Chromium cannot be backgrounded from the test, so
    // document visibility is overridden at the document level and a real
    // `visibilitychange` event is dispatched. The component reads
    // `document.hidden`, which is exactly what this replaces.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const held = await pos(track);
    await expectStationary(track, CYCLE_MS * 2, "rail advanced while the tab was hidden");

    // Restore visibility *and* immediately interact, so the rail is still in
    // its interaction cooldown: it must not step early.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // A genuine, non-committing interaction (keyboard on the rail) so the
    // quiet window applies without opening a game.
    await track.focus();
    await page.keyboard.press("Shift");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());


    await expectStationary(
      track,
      RESUME_AFTER_INTERACTION_MS - 1500,
      "rail resumed inside the cooldown after restore",
    );
    // Once every condition holds again, exactly one controlled step follows.
    await expectSingleStep(track, held, RESUME_AFTER_INTERACTION_MS + CYCLE_MS + 4000);
  });
});
