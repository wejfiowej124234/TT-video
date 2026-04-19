/**
 * 93 矩阵 · **Admin 独立业务域** 企业级页面验证（与 `smoke-admin.spec.ts` **互补**：本文件断言 **main + h1**、权限门、非法 id 错误面；**不**改既有 smoke 文件）。
 *
 * **盘点**：`evidence/93-batch-admin-domain/inventory.md`（已验证 / 仅可达 / 深链占位 / 写壳）。
 * **TT-L4**：`describe` 名含 **`@e2e-sepolia-deferred`**，与 **`chromium-sepolia`** `grepInvert` 一致。
 *
 * 复跑：`cd frontend && npx playwright test e2e/93-matrix-admin-domain-batch.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

const ADMIN_DETAIL_PLACEHOLDER_ID = "00000000-0000-4000-8000-0000000000ad";

/** 静态列表/仪表盘（无动态段）；与 frontend/app/admin 下各 page.tsx 扫描一致（2026-04-19）。 */
const ADMIN_STATIC_ROUTES: string[] = [
  "/admin",
  "/admin/trust-growth",
  "/admin/cross-check",
  "/admin/drift-summary",
  "/admin/finance-reconciliation",
  "/admin/region-vault",
  "/admin/fee-router",
  "/admin/finance",
  "/admin/indexer",
  "/admin/indexer/reconcile-reports",
  "/admin/observability",
  "/admin/orders",
  "/admin/disputes",
  "/admin/reviews",
  "/admin/users",
  "/admin/guides",
  "/admin/approvals",
  "/admin/audit",
  "/admin/audit/operations",
  "/admin/alerts/incidents",
  "/admin/schema",
  "/admin/api-versions",
  "/admin/jobs",
  "/admin/scheduler/jobs",
  "/admin/lifecycle",
  "/admin/policies",
  "/admin/internal-tools/audits",
  "/admin/config",
  "/admin/config/releases",
  "/admin/flags",
  "/admin/secrets/metadata",
  "/admin/tenants/scopes",
  "/admin/compliance/requests",
  "/admin/community/reports",
  "/admin/community/appeals",
  "/admin/community/appeals/review",
  "/admin/community/moderation/cases",
  "/admin/community/risk-signals",
  "/admin/community/policy-change-logs",
  "/admin/community/ranking/snapshots",
  "/admin/community/penalties",
  "/admin/community/comments/visibility",
  "/admin/community/abuse-policy",
  "/admin/media/access-logs",
  "/admin/media/signed-url-tokens",
];

/** 详情 / 写壳：占位 UUID；API 可 404；页面须 main 与 h1 可见（与 smoke-admin 同源占位策略）。 */
const ADMIN_DETAIL_ROUTES: string[] = [
  `/admin/orders/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/disputes/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/users/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/guides/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/reviews/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/approvals/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/audit/logs/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/indexer/reconcile/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/config/releases/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/alerts/incidents/${ADMIN_DETAIL_PLACEHOLDER_ID}`,
  `/admin/compliance/requests/${encodeURIComponent(ADMIN_DETAIL_PLACEHOLDER_ID)}/events`,
  `/admin/compliance/requests/${encodeURIComponent(ADMIN_DETAIL_PLACEHOLDER_ID)}/update`,
];

async function assertAdminShell(page: import("@playwright/test").Page) {
  await expect(page.getByRole("main")).toBeVisible({ timeout: 45_000 });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
}

test.describe("93-admin domain · static hub & lists @e2e-sepolia-deferred", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("全部静态路由：main + h1（生产级壳断言）", async ({ page }) => {
    test.setTimeout(900_000);
    for (const path of ADMIN_STATIC_ROUTES) {
      await test.step(path, async () => {
        await gotoSmoke(page, path);
        await assertAdminShell(page);
      });
    }
  });
});

test.describe("93-admin domain · detail & compliance write shells @e2e-sepolia-deferred", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("占位详情与合规模板页：main + h1", async ({ page }) => {
    test.setTimeout(450_000);
    for (const path of ADMIN_DETAIL_ROUTES) {
      await test.step(path, async () => {
        await gotoSmoke(page, path);
        await assertAdminShell(page);
      });
    }
  });
});

test.describe("93-admin domain · permission gate (no admin cookie) @e2e-sepolia-deferred", () => {
  test("未带 traveltrust_user_id 访问 /admin/orders → /auth/login", async ({ page, context }) => {
    test.setTimeout(90_000);
    await context.clearCookies();
    await page.goto("/admin/orders", { timeout: 60_000 });
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 25_000 });
    expect(page.url()).toMatch(/returnUrl=/);
  });
});

test.describe("93-admin domain · invalid order id error surface @e2e-sepolia-deferred", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("/admin/orders/not-a-uuid 呈现错误 alert 或加载完成壳", async ({ page }) => {
    test.setTimeout(120_000);
    await gotoSmoke(page, "/admin/orders/not-a-uuid");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 45_000 });
    const alert = page.getByRole("alert");
    const h1 = page.locator("h1").first();
    const hasAlert = await alert.isVisible().catch(() => false);
    const hasH1 = await h1.isVisible().catch(() => false);
    expect(hasAlert || hasH1).toBeTruthy();
    if (hasAlert) {
      await expect(alert).toBeVisible();
    }
  });
});
