/** Admin L5 Staging 审计专用 · 直连 tt-web-staging，不启本地 dev/API */
import { defineConfig, devices } from "@playwright/test";

const baseURL = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/admin-l5-staging-closure.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: "line",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});
