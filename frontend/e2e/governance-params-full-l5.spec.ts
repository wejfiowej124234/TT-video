/**
 * ① Governance Params L5 Full · 全页探针走廊（公开读 · 无需登录）
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;

test.describe("Governance params full L5 probes (① local)", () => {
  test("/governance/params exposes frozen L5 shell and main sections", async ({ page, request }) => {
    test.setTimeout(120_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await page.goto("/governance/params", { timeout: 60_000 });

    const shell = page.locator('[data-tt-governance-params-page="1"]');
    await expect(shell).toBeVisible({ timeout: 30_000 });
    await expect(shell).toHaveAttribute("data-tt-ui-frozen", "governance-params-l5-20260612");
    await expect(shell).toHaveAttribute("data-tt-governance-params-closure-probe", "governance-params-full-v1");

    await expect(page.locator("#gov-params-diff")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#gov-params-fee-split")).toBeVisible();
    await expect(page.locator("#gov-params-countries")).toBeVisible();

    await expect(page.getByTestId("governance-params-p553-data-scope")).toBeAttached();
    await expect(page.locator('[data-tt-governance-params-participate="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-governance-params-page-notice="1"]')).toBeVisible();
  });
});
