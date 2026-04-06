/**
 * E2E：关键路径见 e2e/smoke.spec.ts、e2e/core-path.spec.ts、e2e/release-flow.spec.ts
 * 运行：npx playwright install 后 npm run e2e（能连上 baseURL 则复用已有 dev/start，否则自动启动）
 *
 * 可选：`PLAYWRIGHT_SKIP_ESCROW_API_TESTS=1` 跳过 `e2e/53-main-path.spec.ts`（仅本地；CI 勿设）。
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3012",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3012",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
