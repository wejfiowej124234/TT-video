import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://tt-web-staging.fly.dev";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(process.env.PLAYWRIGHT_PROXY_SERVER
      ? { proxy: { server: process.env.PLAYWRIGHT_PROXY_SERVER } }
      : {}),
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
});
