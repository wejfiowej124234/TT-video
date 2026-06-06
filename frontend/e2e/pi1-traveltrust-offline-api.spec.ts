/**
 * PH1-FE-02 · API 未起时 /meta、/me 不应对浏览器抛 500（Next route 降级）
 * 运行：不启动 8080 也可跑（`cd frontend && npx playwright test e2e/pi1-traveltrust-offline-api.spec.ts`）
 */
import { test, expect } from "@playwright/test";

import { gotoSmoke } from "./helpers/smoke-nav";
import { traveltrustNetworkPageShell } from "./helpers/pageShells";

test.describe("PI-1 · /traveltrust offline API shell (PH1-FE-02)", () => {
  test("GET /meta is not HTTP 500", async ({ request }) => {
    test.setTimeout(120_000);
    const res = await request.get("/meta", { timeout: 90_000 });
    expect(res.status()).not.toBe(500);
    if (res.ok()) {
      const body = (await res.json()) as { service?: string; api_version?: string };
      expect(body.service === "traveltrust-api" || Boolean(body.api_version)).toBeTruthy();
    }
  });

  test("GET /api/v1/me without session is not HTTP 500", async ({ request }) => {
    const res = await request.get("/api/v1/me");
    expect(res.status()).not.toBe(500);
    expect([401, 503]).toContain(res.status());
  });

  test("/traveltrust shell loads with page-brief fallback when API down", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toBeVisible({ timeout: 20_000 });
    await expect(shell).toHaveAttribute("data-tt-traveltrust-ia-version", "v6");
    const ready = await shell.getAttribute("data-tt-traveltrust-page-brief-ready");
    expect(ready === "0" || ready === "1").toBeTruthy();
  });
});
