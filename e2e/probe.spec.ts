import { test } from "@playwright/test";
test("nav probe", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Real Madrid/ }).first().click();
  await page.getByRole("button", { name: /odds \d/ }).first().click();
  await page.waitForTimeout(800);
  const menu = page.getByRole("button", { name: "Open navigation" });
  console.log("menuVisible", await menu.isVisible(), "count", await menu.count());
  await menu.click({ timeout: 8000 }).catch((e) => console.log("MENUFAIL", String(e).slice(0, 300)));
  await page.waitForTimeout(500);
  console.log("dialog", await page.getByRole("dialog", { name: "PSK navigation" }).count(), "casino", await page.getByRole("link", { name: "Casino", exact: true }).count());
});
