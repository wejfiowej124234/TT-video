import { defineConfig, devices } from "@playwright/test";

/** TT-PH1-214/215 · 波次 B 目视；仅 FE，无 setup-meta-chain */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/site-theme-v1-wave-b-capture.spec.ts",
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012",
    navigationTimeout: 90_000,
  },
  webServer: {
    command: "npm run dev:webpack",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_FE_SERVER !== "0",
    timeout: 300_000,
    env: {
      ...process.env,
      FRONTEND_PORT: "3012",
      TRAVELTRUST_FRONTEND_PORT: "3012",
    },
  },
});
