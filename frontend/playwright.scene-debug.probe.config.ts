import { defineConfig, devices } from "@playwright/test";

/** 仅 FE · 无 setup-meta-chain · 用于 scene-debug 蓝带 step 实测 */
export default defineConfig({
  testDir: "./e2e",
  testMatch:
    "**/{traveltrust-scene-debug-blue-band,traveltrust-dom-compositor-audit,traveltrust-layer-kill-audit,traveltrust-blue-block-dom-origin,traveltrust-hero-p0-globe-acceptance,traveltrust-hero-p1-linkage,traveltrust-start-corridor-p2,traveltrust-hero-p2-theater,traveltrust-hero-p3-network-decor}.probe.spec.ts",
  timeout: 180_000,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012",
    navigationTimeout: 120_000,
  },
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_FE_SERVER !== "0",
    timeout: 300_000,
    env: {
      ...process.env,
      FRONTEND_PORT: "3012",
      TRAVELTRUST_FRONTEND_PORT: "3012",
      NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE: "1",
    },
  },
});
