/**
 * AFDA · Admin Frontend Deep Audit · 浏览器 leg
 * 驱动：scripts/dev/run-admin-frontend-deep-audit.sh（AFDA_BROWSER=1）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { apiLoginReturnCredentials } from "./helpers/apiSession";
import { gotoWithBearerSession } from "./helpers/apiSession";
import { waitForAdminCapabilitiesReady } from "./helpers/adminCapabilitiesSession";
import { adminAppPageMainLocator } from "./helpers/smoke-nav";

type UiRow = {
  route: string;
  ui_reach: "PASS" | "FAIL" | "PARTIAL";
  shell: string;
  error_surface: string;
  note: string;
};

type Gap = {
  id: string;
  category: string;
  priority: "P0" | "P1" | "P2";
  route: string;
  title: string;
  observation: string;
  human_impact: string;
};

const uiMatrix: UiRow[] = [];
const gaps: Gap[] = [];

const PLACEHOLDER = "00000000-0000-4000-8000-0000000000ad";

/** 与 93-matrix-admin-domain-batch 并集 + onboarding/permissions 等 */
const STATIC_ROUTES: string[] = [
  "/admin",
  "/admin/inbox",
  "/admin/operator-guide",
  "/admin/provider-applications",
  "/admin/steward-applications",
  "/admin/approvals",
  "/admin/onboarding",
  "/admin/onboarding/entitlements",
  "/admin/onboarding/payment-events",
  "/admin/onboarding/webhook-jobs",
  "/admin/onboarding/compliance-audit",
  "/admin/permissions",
  "/admin/users",
  "/admin/guides",
  "/admin/orders",
  "/admin/disputes",
  "/admin/reviews",
  "/admin/trust-growth",
  "/admin/cross-check",
  "/admin/drift-summary",
  "/admin/finance-reconciliation",
  "/admin/finance-suite",
  "/admin/region-vault",
  "/admin/fee-router",
  "/admin/finance",
  "/admin/indexer",
  "/admin/indexer/reconcile-reports",
  "/admin/observability",
  "/admin/audit",
  "/admin/audit/operations",
  "/admin/auth-audit-events",
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
  "/admin/compliance",
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

const DETAIL_ROUTES: string[] = [
  `/admin/orders/${PLACEHOLDER}`,
  `/admin/disputes/${PLACEHOLDER}`,
  `/admin/users/${PLACEHOLDER}`,
  `/admin/guides/${PLACEHOLDER}`,
  `/admin/reviews/${PLACEHOLDER}`,
  `/admin/approvals/${PLACEHOLDER}`,
  `/admin/audit/logs/${PLACEHOLDER}`,
  `/admin/indexer/reconcile/${PLACEHOLDER}`,
  `/admin/config/releases/${PLACEHOLDER}`,
  `/admin/alerts/incidents/${PLACEHOLDER}`,
  `/admin/onboarding/entitlements/${PLACEHOLDER}`,
];

function afdaGate(): boolean {
  return process.env.AFDA_BROWSER === "1" && Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
}

function outDir(): string {
  return (process.env.AFDA_OUT?.trim() || "evidence/admin-frontend-deep-audit/latest").replace(/\\/g, "/");
}

function recordGap(gap: Gap): void {
  gaps.push(gap);
}

function recordUi(row: UiRow): void {
  uiMatrix.push(row);
}

async function reloginAdmin(
  request: import("@playwright/test").APIRequestContext,
  api: string,
  email: string,
): Promise<{ token: string; userId?: string } | null> {
  await request.post(`${api}/auth/seed-test-accounts`, {
    headers: { "Content-Type": "application/json" },
    data: { promote_admin_email: email },
  });
  return apiLoginReturnCredentials(request, api, email, process.env.AFDA_PASSWORD || "Test123!");
}

async function probeAdminPage(
  page: import("@playwright/test").Page,
  route: string,
  creds: { token: string; userId?: string },
  request?: import("@playwright/test").APIRequestContext,
  api?: string,
  adminEmail?: string,
): Promise<{ token: string; userId?: string }> {
  try {
    await gotoWithBearerSession(page, route, creds);
    let capabilitiesReady = true;
    try {
      await waitForAdminCapabilitiesReady(page, creds, 60_000);
    } catch {
      capabilitiesReady = false;
    }

    let onLogin = page.url().includes("/auth/login");
    if (onLogin && request && api && adminEmail) {
      const fresh = await reloginAdmin(request, api, adminEmail);
      if (fresh?.token) {
        creds.token = fresh.token;
        if (fresh.userId) creds.userId = fresh.userId;
        await gotoWithBearerSession(page, route, creds);
        let capabilitiesReadyRetry = true;
        try {
          await waitForAdminCapabilitiesReady(page, creds, 60_000);
        } catch {
          capabilitiesReadyRetry = false;
        }
        onLogin = page.url().includes("/auth/login");
        if (!onLogin) {
          capabilitiesReady = capabilitiesReadyRetry;
        }
      }
    }
    if (onLogin) {
      recordUi({ route, ui_reach: "FAIL", shell: "redirect_login", error_surface: "login", note: page.url() });
      recordGap({
        id: `AFDA-UI-${route.replace(/\//g, "-")}`,
        category: "UI可达性",
        priority: "P1",
        route,
        title: "管理员被重定向到登录页（含重登重试）",
        observation: page.url(),
        human_impact: "长链路爬取时会话可能过期；须刷新或重登",
      });
      return creds;
    }

    const mainRole = page.getByRole("main");
    const mainData = adminAppPageMainLocator(page);
    const mainVisible =
      (await mainRole.isVisible().catch(() => false)) ||
      (await mainData.first().isVisible().catch(() => false));
    const h1Visible = await page.locator("h1").first().isVisible().catch(() => false);
    const strip = page.locator('[data-tt-admin-capability-strip="1"][data-tt-admin-capabilities-loaded="1"]');
    const stripOk = capabilitiesReady && (await strip.count()) > 0;
    const alertVisible = await page.getByRole("alert").first().isVisible().catch(() => false);
    const advisory = await page.locator('[data-tt-admin-rbac-advisory="1"]').isVisible().catch(() => false);

    const shell = mainVisible ? "admin_app_page" : h1Visible ? "h1_only" : "no_main";
    const reach: UiRow["ui_reach"] =
      mainVisible && (stripOk || route === "/admin") ? "PASS" : mainVisible || h1Visible ? "PARTIAL" : "FAIL";

    recordUi({
      route,
      ui_reach: reach,
      shell,
      error_surface: alertVisible ? "alert" : advisory ? "rbac_advisory" : "none",
      note: stripOk ? "capabilities_ok" : "capabilities_pending",
    });

    if (reach === "FAIL") {
      recordGap({
        id: `AFDA-UI-${route.replace(/\//g, "-")}`,
        category: "UI可达性",
        priority: "P1",
        route,
        title: "页面壳层未挂载",
        observation: `shell=${shell} url=${page.url()}`,
        human_impact: "管理员打开页面无 main/h1，真人无法操作",
      });
    } else if (!capabilitiesReady && route !== "/admin") {
      recordGap({
        id: `AFDA-CAP-${route.replace(/\//g, "-")}`,
        category: "状态机一致性",
        priority: "P2",
        route,
        title: "capabilities strip 未 loaded",
        observation: "data-tt-admin-capabilities-loaded 缺失",
        human_impact: "菜单/按钮可能 pending 或误显",
      });
    }

    return creds;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordUi({ route, ui_reach: "FAIL", shell: "error", error_surface: "throw", note: msg.slice(0, 200) });
    recordGap({
      id: `AFDA-UI-${route.replace(/\//g, "-")}`,
      category: "UI可达性",
      priority: "P1",
      route,
      title: "页面探针异常",
      observation: msg.slice(0, 240),
      human_impact: "真人访问可能白屏或超时",
    });
  }
  return creds;
}

(afdaGate() ? test.describe : test.describe.skip)("AFDA · admin browser deep", () => {
  test.setTimeout(1_800_000);

  test.afterAll(() => {
    const dir = outDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "afda-browser-matrix.json"),
      JSON.stringify({ ui_matrix: uiMatrix, gaps, recorded_at: new Date().toISOString() }, null, 2),
    );
  });

  test("未登录 /admin/orders → 登录页", async ({ page }) => {
    await page.goto("/admin/orders", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 25_000 });
  });

  test("super_admin · 静态路由 UI 可达", async ({ page, request }) => {
    const api = process.env.PLAYWRIGHT_API_BASE_URL || "https://tt-api-staging.fly.dev";
    const email = process.env.AFDA_ADMIN_EMAIL || process.env.STAGING_AUDIT_EMAIL || "tourist@test.com";
    await request.post(`${api}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: { promote_admin_email: email },
    });
    const creds = await apiLoginReturnCredentials(request, api, email, process.env.AFDA_PASSWORD || "Test123!");
    if (!creds?.token) throw new Error("admin login failed");

    let session = creds;
    for (const route of STATIC_ROUTES) {
      await test.step(route, async () => {
        session = await probeAdminPage(page, route, session, request, api, email);
      });
    }
  });

  test("super_admin · 详情占位路由 UI 可达", async ({ page, request }) => {
    const api = process.env.PLAYWRIGHT_API_BASE_URL || "https://tt-api-staging.fly.dev";
    const email = process.env.AFDA_ADMIN_EMAIL || process.env.STAGING_AUDIT_EMAIL || "tourist@test.com";
    await request.post(`${api}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: { promote_admin_email: email },
    });
    const creds = await apiLoginReturnCredentials(request, api, email, process.env.AFDA_PASSWORD || "Test123!");
    if (!creds?.token) throw new Error("admin login failed");

    let session = creds;
    for (const route of DETAIL_ROUTES) {
      await test.step(route, async () => {
        session = await probeAdminPage(page, route, session, request, api, email);
      });
    }
  });
});
