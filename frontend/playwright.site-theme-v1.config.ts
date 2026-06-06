import { defineConfig, devices } from "@playwright/test";

/** TT-PH1-213 · 仅 FE 目视截图；无 setup-meta-chain / 全栈 API 闸 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "**/site-theme-v1-evidence-capture.spec.ts",
    "**/site-theme-v1-did-rank-guide-modal.spec.ts",
    "**/site-theme-v1-v2-hard-refresh.spec.ts",
  ],
  timeout: 180_000,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012",
    navigationTimeout: 120_000,
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
