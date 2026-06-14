import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012";
const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const isWin = process.platform === "win32";
const startApiCmd = isWin
  ? "powershell -NoProfile -ExecutionPolicy Bypass -File ../scripts/dev/start-api-for-playwright.ps1"
  : "bash ../scripts/dev/start-api-for-playwright.sh";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: startApiCmd,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: process.env.CI ? "npm run start" : "npm run dev",
      url: baseURL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
});
