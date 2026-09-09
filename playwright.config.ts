import { defineConfig, devices } from "@playwright/test";

/**
 * Real-browser E2E for the existing Casino content rails.
 *
 * The rail advances one discrete step every ~7.1s and pauses for ~9s after an
 * interaction, so tests are intentionally long-running: give them room.
 */
const PORT = Number(process.env["E2E_PORT"] ?? 8080);
const baseURL = process.env["E2E_BASE_URL"] ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.output",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  timeout: 120_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  fullyParallel: true,
  workers: process.env["CI"] ? 2 : 3,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet-834",
      use: { ...devices["Desktop Chrome"], viewport: { width: 834, height: 1112 }, hasTouch: true },
    },
    {
      name: "mobile-430",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 430, height: 932 },
        hasTouch: true,
        isMobile: false, // Chromium rejects isMobile with some channels; touch is what we need.
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile-375",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: false,
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
