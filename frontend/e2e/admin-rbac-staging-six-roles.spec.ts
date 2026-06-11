/**
 * ADM-U01 · Phase ② · 六角色 Admin Shell 可见性（独立 Staging FE + API）
 *
 * 须：ADM_U01_STAGING=1 · STAGING_FE_BASE · PLAYWRIGHT_API_BASE_URL（= STAGING_API_BASE）
 *      · TRAVELTRUST_ADMIN_TOKEN_SUPER … AUDITOR（六 token）
 *
 * 机读：$ADM_U01_EVIDENCE_DIR/playwright-shell-matrix.json
 * 复跑：cd frontend && ADM_U01_STAGING=1 STAGING_FE_BASE=… npx playwright test e2e/admin-rbac-staging-six-roles.spec.ts --project=chromium
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { gotoWithAdminShellSessionReady } from "./helpers/adminCapabilitiesSession";
import { defaultApiBase } from "./helpers/apiSession";
import {
  ADM_U01_ROLES,
  ADM_U01_SHELL_GROUP_VISIBILITY,
  admU01TokenForRole,
  type AdmU01Role,
} from "./helpers/admU01ShellMatrix";

const enabled = process.env.ADM_U01_STAGING === "1";
/** Staging HTTPS 探针通过后，Playwright 默认走本机 FE（同构建）避免隧道 page.goto 超时。 */
const feBase = (
  process.env.ADM_U01_PLAYWRIGHT_FE_BASE ??
  process.env.STAGING_FE_BASE ??
  ""
).replace(/\/$/, "");
const stagingFeProbe = (process.env.STAGING_FE_BASE ?? "").replace(/\/$/, "");
const evidenceDir =
  process.env.ADM_U01_EVIDENCE_DIR?.trim() ||
  join(process.cwd(), "..", "evidence", "GO_staging_admin_rbac_matrix", "latest");

type ShellRow = {
  role: AdmU01Role;
  group_id: string;
  expected_visible: boolean;
  actual_visible: boolean;
  status: "PASS" | "FAIL";
};

const shellResults: ShellRow[] = [];

test.describe("ADM-U01 staging · six-role shell visibility @adm-u01-staging", () => {
  test.describe.configure({ timeout: 120_000, mode: "serial" });

  test.use({
    extraHTTPHeaders:
      feBase.includes(".loca.lt") || stagingFeProbe.includes(".loca.lt")
        ? { "Bypass-Tunnel-Reminder": "true" }
        : {},
  });

  test.beforeAll(() => {
    if (!enabled) return;
    if (!feBase) test.skip(true, "STAGING_FE_BASE required");
    for (const role of ADM_U01_ROLES) {
      if (!admU01TokenForRole(role)) {
        test.skip(true, `missing TRAVELTRUST_ADMIN_TOKEN_* for ${role}`);
      }
    }
    mkdirSync(evidenceDir, { recursive: true });
  });

  test.afterAll(() => {
    if (!enabled) return;
    const fails = shellResults.filter((r) => r.status === "FAIL");
    const payload = {
      artifact: "adm-u01-playwright-shell",
      phase: "②",
      staging_fe_probe: stagingFeProbe || feBase,
      playwright_fe_base: feBase,
      generated_at: new Date().toISOString(),
      summary: { total: shellResults.length, pass: shellResults.length - fails.length, fail: fails.length },
      rows: shellResults,
    };
    writeFileSync(
      join(evidenceDir, "playwright-shell-matrix.json"),
      JSON.stringify(payload, null, 2),
      "utf-8",
    );
  });

  for (const role of ADM_U01_ROLES) {
    test(`${role} · shell groups vs matrix`, async ({ page, request }) => {
      test.skip(!enabled, "ADM_U01_STAGING!=1");
      const token = admU01TokenForRole(role);
      if (!token) test.skip(true, "no token");

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

      const apiBase = defaultApiBase();
      const meRes = await request.get(`${apiBase}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(meRes.ok(), `${role} GET /api/v1/me`).toBeTruthy();
      const meJson = (await meRes.json()) as { user?: { id?: string; role?: string } };
      const userId = (meJson.user?.id ?? "").trim();
      expect(userId.length).toBeGreaterThan(0);
      const usersRole = (meJson.user?.role ?? "").trim();
      expect(["admin", "super_admin"]).toContain(usersRole);

      const origin = feBase.startsWith("http") ? feBase : `http://127.0.0.1:3012`;
      await page.context().addCookies([
        { name: "traveltrust_user_id", value: userId, url: origin },
      ]);
      await gotoWithAdminShellSessionReady(page, `${origin}/admin`, { token, userId });

      for (const [groupId, expectations] of Object.entries(ADM_U01_SHELL_GROUP_VISIBILITY)) {
        const expected = expectations[role];
        const loc = page.locator(`[data-tt-admin-shell-nav-group="${groupId}"]`);
        const count = await loc.count();
        const actual = count > 0;
        const status = actual === expected ? "PASS" : "FAIL";
        shellResults.push({
          role,
          group_id: groupId,
          expected_visible: expected,
          actual_visible: actual,
          status,
        });
        if (status === "FAIL") {
          expect(actual, `${role} shell group ${groupId}`).toBe(expected);
        }
      }
    });
  }
});
