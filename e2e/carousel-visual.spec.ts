import { expect, test } from "@playwright/test";
import { CYCLE_MS, cardGeometry, gotoCasino, pos, waitForStep } from "./rail";

/**
 * Focused visual regression around one idle step. Only the rail region is
 * captured (never the whole page) and the dynamic judge panel is never in
 * frame, so the baselines stay stable.
 */
test("idle step keeps the rail visually stable", async ({ page }) => {
  const track = await gotoCasino(page);
  const section = page.locator("section", { has: track }).last();

  await expect(section).toHaveScreenshot("rail-before-step.png");
  const before = await cardGeometry(track);

  const start = await pos(track);
  await waitForStep(track, start, CYCLE_MS * 2);
  await page.waitForTimeout(500);

  await expect(section).toHaveScreenshot("rail-after-step.png");
  const after = await cardGeometry(track);
  expect(after.map((c) => `${c.width}x${c.height}@${c.offset}`)).toEqual(
    before.map((c) => `${c.width}x${c.height}@${c.offset}`),
  );
});
