import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://tt-web-staging.fly.dev";

export default defineConfig({
  testDir: "./e2e",
  timeout: 3_600_000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(process.env.PLAYWRIGHT_PROXY_SERVER
      ? { proxy: { server: process.env.PLAYWRIGHT_PROXY_SERVER } }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
