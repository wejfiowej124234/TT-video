/**
 * ADM-U01 Shell Browser Audit · 六角色侧栏 / 菜单 / 路由 / 可见性 × API 对拍
 *
 * 驱动：scripts/dev/run-adm-u01-shell-browser-audit.sh
 * 机读：$ADM_U01_SHELL_EVIDENCE_DIR/adm-u01-shell-browser-findings.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { ADMIN_PERM, type AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { ADM_U01_SHELL_GROUP_VISIBILITY } from "@/lib/admin/admU01ShellGroupVisibility";

import { waitForAdminCapabilitiesReady, gotoWithAdminShellSessionReady } from "./helpers/adminCapabilitiesSession";
import { defaultApiBase } from "./helpers/apiSession";
import {
  ADM_U01_ROLES,
  ADM_U01_SHELL_GROUP_IDS,
  admU01TokenForRole,
  type AdmU01Role,
} from "./helpers/admU01ShellMatrix";

const enabled = process.env.ADM_U01_SHELL_BROWSER === "1";
const feBase = (
  process.env.ADM_U01_PLAYWRIGHT_FE_BASE ??
  process.env.STAGING_FE_BASE ??
  "http://127.0.0.1:3012"
).replace(/\/$/, "");

const evidenceDir =
  process.env.ADM_U01_SHELL_EVIDENCE_DIR?.trim() ||
  join(process.cwd(), "..", "evidence", "adm-u01-shell-browser-audit", "latest");

const apiMatrixPath =
  process.env.ADM_U01_API_MATRIX_PATH?.trim() ||
  join(evidenceDir, "matrix-api-results.json");

type MatrixRow = {
  probe_id: string;
  role: string;
  http: number;
  status: string;
  method?: string;
  path?: string;
};

type Finding = {
  id: string;
  priority: "P0" | "P1" | "P2";
  category: string;
  role: AdmU01Role;
  target: string;
  title: string;
  observation: string;
};

type ShellRow = {
  role: AdmU01Role;
  group_id: string;
  expected_visible: boolean;
  actual_visible: boolean;
  status: "PASS" | "FAIL";
};

type MenuRow = {
  role: AdmU01Role;
  href: string;
  permission: string | null;
  expected_visible: boolean;
  actual_visible: boolean;
  status: "PASS" | "FAIL";
};

type RouteRow = {
  role: AdmU01Role;
  route: string;
  api_probe: string;
  ui_reach: "PASS" | "FAIL" | "PARTIAL";
  login_redirect: boolean;
  perm_denied: boolean;
  main_visible: boolean;
  status: "PASS" | "FAIL";
};

type VisibilityRow = {
  role: AdmU01Role;
  route: string;
  permission: string;
  ui_has_perm: boolean;
  api_allows: boolean;
  status: "PASS" | "FAIL";
};

const ROLE_DISPLAY: Record<AdmU01Role, string> = {
  SuperAdmin: "Super Admin",
  Ops: "Admin",
  CS: "CS",
  Risk: "Risk",
  Finance: "Finance",
  Auditor: "Compliance",
};

const MENU_AUDIT: { group: string; href: string; permission: AdminPermissionId | null }[] = [
  { group: "finance", href: "/admin/finance", permission: ADMIN_PERM.FINANCE_READ },
  { group: "community", href: "/admin/community/penalties", permission: ADMIN_PERM.COMMUNITY_MODERATE },
  { group: "governance", href: "/admin/trust-growth", permission: ADMIN_PERM.TRUST_GROWTH_WRITE },
  { group: "more", href: "/admin/flags", permission: ADMIN_PERM.PLATFORM_READ },
  { group: "operations", href: "/admin/disputes", permission: ADMIN_PERM.ORDERS_READ },
];

const ROUTE_AUDIT: {
  route: string;
  apiProbe: string | null;
  readPerm: AdminPermissionId;
}[] = [
  { route: "/admin/finance", apiProbe: "finance.summary", readPerm: ADMIN_PERM.FINANCE_READ },
  { route: "/admin/community/reports", apiProbe: "community.reports_list", readPerm: ADMIN_PERM.COMMUNITY_READ },
  { route: "/admin/trust-growth", apiProbe: null, readPerm: ADMIN_PERM.TRUST_GROWTH_WRITE },
  { route: "/admin/flags", apiProbe: "config.flags_list", readPerm: ADMIN_PERM.PLATFORM_READ },
  { route: "/admin/approvals", apiProbe: null, readPerm: ADMIN_PERM.APPROVE },
  { route: "/admin/users", apiProbe: "ops.users_list", readPerm: ADMIN_PERM.USERS_READ },
];

const shellMatrix: ShellRow[] = [];
const menuMatrix: MenuRow[] = [];
const routeMatrix: RouteRow[] = [];
const visibilityMatrix: VisibilityRow[] = [];
const issues: Finding[] = [];
let issueSeq = 0;

function addIssue(
  priority: Finding["priority"],
  category: string,
  role: AdmU01Role,
  target: string,
  title: string,
  observation: string,
): void {
  issueSeq += 1;
  issues.push({
    id: `ADM-SHELL-${priority.replace("P", "")}-${String(issueSeq).padStart(3, "0")}`,
    priority,
    category,
    role,
    target,
    title,
    observation,
  });
}

function loadApiMatrix(): MatrixRow[] {
  if (!existsSync(apiMatrixPath)) return [];
  try {
    return JSON.parse(readFileSync(apiMatrixPath, "utf8")) as MatrixRow[];
  } catch {
    return [];
  }
}

function apiAllowsList(apiRows: MatrixRow[], probeId: string, role: AdmU01Role): boolean | null {
  const row = apiRows.find((r) => r.probe_id === probeId && r.role === role);
  if (!row) return null;
  return row.http === 200;
}

function hasPermission(perms: string[], perm: string): boolean {
  return perms.includes(perm);
}

function linkExpectedVisible(role: AdmU01Role, group: string, permission: string | null, perms: string[]): boolean {
  if (!ADM_U01_SHELL_GROUP_VISIBILITY[group as keyof typeof ADM_U01_SHELL_GROUP_VISIBILITY]?.[role]) {
    return false;
  }
  if (!permission) return true;
  return hasPermission(perms, permission);
}

async function fetchCapabilities(
  request: import("@playwright/test").APIRequestContext,
  token: string,
): Promise<{ permissions: string[]; console_role_70: string }> {
  const apiBase = defaultApiBase();
  const res = await request.get(`${apiBase}/api/v1/admin/capabilities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), "GET /admin/capabilities").toBeTruthy();
  const body = (await res.json()) as {
    permissions?: string[];
    console_role_70?: string;
  };
  return {
    permissions: body.permissions ?? [],
    console_role_70: body.console_role_70 ?? "",
  };
}

async function resetBrowserSession(page: import("@playwright/test").Page, origin: string): Promise<void> {
  await page.goto("about:blank");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "traveltrust_user_id=; Path=/; Max-Age=0; SameSite=Lax";
    } catch {
      /* ignore */
    }
  });
  await page.context().clearCookies();
}

test.describe("ADM-U01 Shell Browser Audit @adm-u01-shell-browser", () => {
  test.describe.configure({ timeout: 180_000, mode: "serial" });
  test.use({
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: feBase.includes(".loca.lt") ? { "Bypass-Tunnel-Reminder": "true" } : {},
  });

  const apiRows = loadApiMatrix();

  test.beforeAll(() => {
    if (!enabled) return;
    mkdirSync(evidenceDir, { recursive: true });
    for (const role of ADM_U01_ROLES) {
      if (!admU01TokenForRole(role)) {
        test.skip(true, `missing token for ${role}`);
      }
    }
  });

  test.afterAll(() => {
    if (!enabled) return;
    const p0 = issues.filter((i) => i.priority === "P0").length;
    const p1 = issues.filter((i) => i.priority === "P1").length;
    const p2 = issues.filter((i) => i.priority === "P2").length;
    const verdict = p0 ? "NO-GO" : p1 ? "CONDITIONAL" : "PASS";
    const payload = {
      artifact: "adm-u01-shell-browser-audit",
      phase: "②",
      generated_at: new Date().toISOString(),
      fe_base: feBase,
      api_matrix_path: apiMatrixPath,
      verdict,
      summary: { p0, p1, p2, issues: issues.length },
      shell_matrix: shellMatrix,
      menu_matrix: menuMatrix,
      route_matrix: routeMatrix,
      visibility_matrix: visibilityMatrix,
      issues,
    };
    writeFileSync(
      join(evidenceDir, "adm-u01-shell-browser-findings.json"),
      JSON.stringify(payload, null, 2),
      "utf8",
    );
  });

  for (const role of ADM_U01_ROLES) {
    test(`${role} · shell + menu + route + visibility`, async ({ page, request }) => {
      test.skip(!enabled, "ADM_U01_SHELL_BROWSER!=1");
      const token = admU01TokenForRole(role);
      if (!token) test.skip(true, "no token");

      const meRes = await request.get(`${defaultApiBase()}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(meRes.ok(), `${role} GET /me`).toBeTruthy();
      const meJson = (await meRes.json()) as { user?: { id?: string; role?: string } };
      const userId = (meJson.user?.id ?? "").trim();
      expect(userId.length).toBeGreaterThan(0);

      const { permissions } = await fetchCapabilities(request, token);
      const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";
      const creds = { token, userId };

      await resetBrowserSession(page, origin);
      await page.context().addCookies([
        { name: "traveltrust_user_id", value: userId, url: origin },
        { name: "traveltrust_session_ok", value: "1", url: origin },
      ]);
      await gotoWithAdminShellSessionReady(page, `${origin}/admin`, creds);

      // Shell Matrix
      for (const groupId of ADM_U01_SHELL_GROUP_IDS) {
        const expected = ADM_U01_SHELL_GROUP_VISIBILITY[groupId][role];
        const loc = page.locator(`[data-tt-admin-shell-nav-group="${groupId}"]`);
        const actual = (await loc.count()) > 0;
        const status = actual === expected ? "PASS" : "FAIL";
        shellMatrix.push({ role, group_id: groupId, expected_visible: expected, actual_visible: actual, status });
        if (status === "FAIL") {
          addIssue(
            expected ? "P1" : "P0",
            expected ? "菜单可见性" : "横向越权",
            role,
            `shell.${groupId}`,
            `${ROLE_DISPLAY[role]} Shell 组 ${groupId} 可见性不一致`,
            `expected=${expected} actual=${actual}`,
          );
        }
      }

      // Menu Matrix（菜单树 DOM 挂载；折叠 details 内链不计 viewport visible）
      for (const item of MENU_AUDIT) {
        const expected = linkExpectedVisible(role, item.group, item.permission, permissions);
        const groupLoc = page.locator(`[data-tt-admin-shell-nav-group="${item.group}"]`);
        const linkInGroup = groupLoc.locator(`a[href="${item.href}"]`);
        const groupPresent = (await groupLoc.count()) > 0;
        const linkCount = await linkInGroup.count();
        const actual = expected ? groupPresent && linkCount > 0 : linkCount === 0;
        const status = actual === expected ? "PASS" : "FAIL";
        menuMatrix.push({
          role,
          href: item.href,
          permission: item.permission,
          expected_visible: expected,
          actual_visible: actual,
          status,
        });
        if (status === "FAIL") {
          addIssue(
            expected && !actual ? "P1" : !expected && actual ? "P0" : "P2",
            !expected && actual ? "横向越权" : "菜单可见性",
            role,
            item.href,
            `${ROLE_DISPLAY[role]} 菜单链 ${item.href} 不一致`,
            `expected=${expected} actual=${actual} perm=${item.permission ?? "none"}`,
          );
        }
      }

      // Route + Visibility Matrix
      for (const item of ROUTE_AUDIT) {
        try {
          await gotoWithAdminShellSessionReady(page, `${origin}${item.route}`, creds);
        } catch (err) {
          addIssue("P2", "路由守卫", role, item.route, "页面导航超时/失败", String(err));
          routeMatrix.push({
            role,
            route: item.route,
            api_probe: item.apiProbe ?? "capabilities",
            ui_reach: "FAIL",
            login_redirect: page.url().includes("/auth/login"),
            perm_denied: false,
            main_visible: false,
            status: "FAIL",
          });
          continue;
        }
        const loginRedirect = page.url().includes("/auth/login");
        const permDenied = await page
          .locator(`[data-tt-admin-perm-denied="${item.readPerm}"]`)
          .first()
          .isVisible()
          .catch(() => false);
        const mainVisible = await page.getByRole("main").isVisible().catch(() => false);
        const uiHasPerm = !loginRedirect && !permDenied && mainVisible;
        const apiAllows =
          item.apiProbe != null
            ? apiAllowsList(apiRows, item.apiProbe, role)
            : hasPermission(permissions, item.readPerm);

        let status: RouteRow["status"] = "PASS";
        let uiReach: RouteRow["ui_reach"] = "PASS";

        if (loginRedirect) {
          status = "FAIL";
          uiReach = "FAIL";
          addIssue("P0", "路由守卫", role, item.route, "路由重定向登录", page.url());
        } else if (apiAllows === false && uiHasPerm) {
          status = "FAIL";
          uiReach = "FAIL";
          addIssue("P0", "UI/API不一致", role, item.route, "API 拒绝但 UI 可达", `apiProbe=${item.apiProbe}`);
        } else if (apiAllows === true && permDenied) {
          status = "FAIL";
          uiReach = "PARTIAL";
          addIssue("P1", "UI/API不一致", role, item.route, "API 允许但 UI 权限横幅", item.readPerm);
        } else if (!mainVisible && apiAllows === true) {
          status = "FAIL";
          uiReach = "PARTIAL";
          addIssue("P2", "路由守卫", role, item.route, "API 允许但 main 不可见", "");
        }

        routeMatrix.push({
          role,
          route: item.route,
          api_probe: item.apiProbe ?? "capabilities",
          ui_reach: uiReach,
          login_redirect: loginRedirect,
          perm_denied: permDenied,
          main_visible: mainVisible,
          status,
        });

        visibilityMatrix.push({
          role,
          route: item.route,
          permission: item.readPerm,
          ui_has_perm: uiHasPerm,
          api_allows: apiAllows === true,
          status:
            apiAllows === null
              ? "PASS"
              : apiAllows === uiHasPerm || (!apiAllows && !uiHasPerm)
                ? "PASS"
                : "FAIL",
        });
      }
    });
  }
});
