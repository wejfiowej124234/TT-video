/** Staging Admin Final Validation · Playwright walkthrough */
import { defineConfig, devices } from "@playwright/test";

const baseURL = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/admin-staging-final-validation-walkthrough.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: "line",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
});
