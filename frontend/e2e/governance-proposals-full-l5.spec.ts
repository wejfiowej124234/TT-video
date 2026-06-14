/**
 * ① Governance Proposals L5 Full · list/create 冻结壳探针
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("Governance proposals full L5 probes (① local)", () => {
  test("list + create expose frozen L5 shell and wallet panel", async ({ page, request }) => {
    test.setTimeout(120_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);

    await page.goto("/governance/proposals", { timeout: 60_000 });
    const listShell = page.locator('[data-tt-governance-proposals-page="1"]').first();
    await expect(listShell).toBeVisible({ timeout: 30_000 });
    await expect(listShell).toHaveAttribute("data-tt-ui-frozen", "governance-proposals-l5-20260613");
    await expect(listShell).toHaveAttribute(
      "data-tt-governance-proposals-closure-probe",
      "governance-proposals-full-v1",
    );

    await page.goto(
      "/auth/login?returnUrl=" + encodeURIComponent("/governance/proposals/new?from=steward_workbench"),
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("multi-demo@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/governance\/proposals\/new/, { timeout: 60_000 });

    const createShell = page.locator('[data-tt-governance-proposal-create-page="1"]');
    await expect(createShell).toBeVisible({ timeout: 30_000 });
    await expect(createShell).toHaveAttribute("data-tt-ui-frozen", "governance-proposals-l5-20260613");
    await expect(page.locator('[data-tt-governance-wallet-connect-panel="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-steward-subpage-back-workbench="1"]')).toBeVisible();
  });
});
