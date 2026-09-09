import { test } from "@playwright/test";
import { waitHydrated } from "./rail";
test("nav probe", async ({ page }) => {
  await page.goto("/");
  await waitHydrated(page);
  await page.getByRole("link", { name: /Real Madrid/ }).first().click();
  await page.getByRole("button", { name: /odds \d/ }).first().click();
  await page.waitForTimeout(800);
  const close = page.getByRole("button", { name: "Close betslip" });
  console.log("closeVisible", await close.isVisible().catch(() => "err"));
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForTimeout(400);
  const menu = page.getByRole("button", { name: "Open navigation" });
  console.log("menuVisible", await menu.isVisible());
  await menu.click({ timeout: 8000 }).catch((e) => console.log("MENUFAIL", String(e).slice(0, 400)));
  await page.waitForTimeout(600);
  console.log("dialog", await page.getByRole("dialog", { name: "PSK navigation" }).count(), "casino", await page.getByRole("link", { name: "Casino", exact: true }).count());
});
