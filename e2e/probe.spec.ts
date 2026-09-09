import { test } from "@playwright/test";
import { gotoCasino, pos, TOL } from "./rail";
test("end wrap probe", async ({ page }) => {
  const track = await gotoCasino(page);
  const right = page.getByRole("button", { name: "Scroll Slots games right" });
  for (let i = 0; i < 8; i++) {
    const max = await track.evaluate((el) => el.scrollWidth - el.clientWidth);
    if ((await pos(track)) >= max - TOL) break;
    await right.click(); await page.waitForTimeout(700);
  }
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.mouse.move(5, 5);
  const t0 = Date.now(); const out: string[] = [];
  for (let i = 0; i < 50; i++) { out.push(`${Date.now()-t0}:${Math.round(await pos(track))}`); await page.waitForTimeout(500); }
  console.log("WRAP", out.join(" "));
});
test("sports probe", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: /Real Madrid/ }).first();
  console.log("LINKS", await page.getByRole("link", { name: /Real Madrid/ }).count());
  await link.click({ timeout: 15000 }).catch((e) => console.log("LINKFAIL", String(e).slice(0, 200)));
  await page.waitForTimeout(1500);
  console.log("URL", page.url());
  const odds = page.getByRole("button", { name: /odds \d/ });
  console.log("ODDS", await odds.count());
  await odds.first().click({ timeout: 15000 }).catch((e) => console.log("ODDSFAIL", String(e).slice(0, 200)));
  const casino = page.getByRole("link", { name: "Casino", exact: true });
  console.log("CASINO", await casino.count());
});
