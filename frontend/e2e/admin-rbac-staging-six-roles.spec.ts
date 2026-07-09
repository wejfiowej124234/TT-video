/**
 * ADM-U01 · Phase ② · 六角色 Admin Shell 可见性（独立 Staging FE + API）
 *
 * 须：ADM_U01_STAGING=1 · STAGING_FE_BASE · PLAYWRIGHT_API_BASE_URL（= STAGING_API_BASE）
 *      · TRAVELTRUST_ADMIN_TOKEN_SUPER … AUDITOR（六 token）
 *
 * 机读：$ADM_U01_EVIDENCE_DIR/playwright-shell-matrix.json
 * 复跑：cd frontend && ADM_U01_STAGING=1 STAGING_FE_BASE=… npx playwright test e2e/admin-rbac-staging-six-roles.spec.ts --project=chromium
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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
const evidenceDir = (() => {
  const raw =
    process.env.ADM_U01_EVIDENCE_DIR?.trim() ||
    join(process.cwd(), "..", "evidence", "GO_staging_admin_rbac_matrix", "latest");
  if (/^evidence[/\\]/.test(raw)) {
    return resolve(process.cwd(), "..", raw);
  }
  return resolve(raw);
})();

type ShellRow = {
  role: AdmU01Role;
  group_id: string;
  expected_visible: boolean;
  actual_visible: boolean;
  status: "PASS" | "FAIL";
};

function playwrightShellEvidencePath() {
  return join(evidenceDir, "playwright-shell-matrix.json");
}

function mergeRoleShellRows(role: AdmU01Role, roleRows: ShellRow[]) {
  const path = playwrightShellEvidencePath();
  let rows: ShellRow[] = [];
  try {
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, "utf-8")) as { rows?: ShellRow[] };
      rows = (parsed.rows ?? []).filter((row) => row.role !== role);
    }
  } catch {
    rows = [];
  }
  rows.push(...roleRows);
  const fails = rows.filter((row) => row.status === "FAIL");
  const payload = {
    artifact: "adm-u01-playwright-shell",
    phase: "②",
    staging_fe_probe: stagingFeProbe || feBase,
    playwright_fe_base: feBase,
    generated_at: new Date().toISOString(),
    summary: { total: rows.length, pass: rows.length - fails.length, fail: fails.length },
    rows,
  };
  writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8");
}

function readShellEvidenceRows(): ShellRow[] {
  const path = playwrightShellEvidencePath();
  if (!existsSync(path)) return [];
  try {
    return (JSON.parse(readFileSync(path, "utf-8")) as { rows?: ShellRow[] }).rows ?? [];
  } catch {
    return [];
  }
}

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
    const fails = readShellEvidenceRows().filter((row) => row.status === "FAIL");
    if (fails.length > 0) {
      throw new Error(`ADM-U01 shell matrix failures: ${fails.length}`);
    }
    const rows = readShellEvidenceRows();
    const expected = ADM_U01_ROLES.length * Object.keys(ADM_U01_SHELL_GROUP_VISIBILITY).length;
    if (rows.length < expected) {
      throw new Error(`ADM-U01 shell matrix incomplete: ${rows.length}/${expected} rows`);
    }
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

      const roleRows: ShellRow[] = [];
      for (const [groupId, expectations] of Object.entries(ADM_U01_SHELL_GROUP_VISIBILITY)) {
        const expected = expectations[role];
        const loc = page.locator(`[data-tt-admin-shell-nav-group="${groupId}"]`);
        const count = await loc.count();
        const actual = count > 0;
        const status = actual === expected ? "PASS" : "FAIL";
        roleRows.push({
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
      mergeRoleShellRows(role, roleRows);
    });
  }
});
