import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared helpers for the Casino content-rail E2E suite.
 *
 * All timings mirror the production component (src/components/psk/ContentRail.tsx):
 * a discrete step every REST+STEP ms, and a RESUME_AFTER_INTERACTION_MS quiet
 * window after any real customer interaction.
 */
export const STEP_MS = 600;
export const REST_MS = 6500;
export const CYCLE_MS = REST_MS + STEP_MS; // 7100
export const RESUME_AFTER_INTERACTION_MS = 9000;
/** Position tolerance in px: smooth scrolling settles on sub-pixel values. */
export const TOL = 6;

export const RAIL_LABEL = "Slots games";

export function rail(page: Page): Locator {
  return page.getByRole("group", { name: RAIL_LABEL });
}

export async function gotoCasino(page: Page): Promise<Locator> {
  await page.goto("/casino");
  const track = rail(page);
  await track.waitFor();
  // Wait for hydration: the session reference only renders once the client has
  // mounted, which is also when the rail's own event handlers become live.
  await expect(
    page.getByRole("region", { name: "PSK Intelligence judge panel" }).getByText(/S-[A-Z0-9]{4}/),
  ).toBeVisible();
  // Keep the rail inside the viewport: hover/tap/keyboard input must land on
  // the real element, and Playwright must not auto-scroll mid-test.
  await track.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  // Rails only auto-advance when there is something to scroll.
  await expect
    .poll(async () => track.evaluate((el) => el.scrollWidth - el.clientWidth))
    .toBeGreaterThan(4);
  return track;
}



/**
 * Hovering the rail pauses automatic motion, so it is also the deterministic
 * way to hold the rail still before exercising the manual controls.
 */
export async function hoverRail(track: Locator) {
  await track.hover();
  await track.page().waitForTimeout(250);
  await track.hover();
}

export function pos(track: Locator): Promise<number> {
  return track.evaluate((el) => el.scrollLeft);
}


/** One discrete step = one card + the 8px gap. */
export async function stepSize(track: Locator): Promise<number> {
  return track.evaluate((el) => {
    const card = el.querySelector<HTMLElement>("[data-rail-item]");
    return (card?.offsetWidth ?? 0) + 8;
  });
}

/** Fails if the rail moves at all during `ms`. Samples every 500ms. */
export async function expectStationary(track: Locator, ms: number, why: string) {
  const start = await pos(track);
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    await track.page().waitForTimeout(500);
    const now = await pos(track);
    expect(Math.abs(now - start), `${why} (moved after ${ms - (deadline - Date.now())}ms)`).
      toBeLessThanOrEqual(TOL);
  }
}

/** Waits for the next discrete advance and returns when/where it happened. */
export async function waitForStep(
  track: Locator,
  from: number,
  timeoutMs: number,
): Promise<{ at: number; to: number }> {
  const t0 = Date.now();
  const deadline = t0 + timeoutMs;
  while (Date.now() < deadline) {
    const now = await pos(track);
    if (Math.abs(now - from) > TOL) {
      // Let the 600ms smooth transition settle before measuring the landing spot.
      await track.page().waitForTimeout(STEP_MS + 300);
      return { at: Date.now() - t0, to: await pos(track) };
    }
    await track.page().waitForTimeout(200);
  }
  throw new Error(`Rail did not advance within ${timeoutMs}ms (still at ${from})`);
}

/** Asserts exactly one controlled step of one card happened from `from`. */
export async function expectSingleStep(track: Locator, from: number, timeoutMs: number) {
  const size = await stepSize(track);
  const { to } = await waitForStep(track, from, timeoutMs);
  expect(Math.abs(to - (from + size))).toBeLessThanOrEqual(TOL);
  // ...and nothing else moves for the remainder of the rest window.
  await expectStationary(track, CYCLE_MS - STEP_MS - 1500, "second step arrived too early");
}

/** Card geometry, used for alignment / jitter assertions. */
export async function cardGeometry(track: Locator) {
  return track.evaluate((el) => {
    const items = [...el.querySelectorAll<HTMLElement>("[data-rail-item]")];
    const box = el.getBoundingClientRect();
    return items.map((item) => {
      const r = item.getBoundingClientRect();
      return {
        name: item.textContent?.trim() ?? "",
        width: Math.round(r.width),
        height: Math.round(r.height),
        top: Math.round(r.top - box.top),
        // offset inside the track's own scroll space: stable regardless of scroll
        offset: Math.round(item.offsetLeft),
      };
    });
  });
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page-level horizontal overflow").toBeLessThanOrEqual(1);
}

/**
 * Real touch input through CDP (Chromium): genuine browser touch events, not a
 * JS-dispatched synthetic event.
 */
export async function touchSwipe(page: Page, track: Locator, dx: number) {
  const box = await track.boundingBox();
  if (!box) throw new Error("rail not visible");
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 6; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (dx * i) / 6, y }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
