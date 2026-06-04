/**
 * ADM-U01 · ① DB 控制台角色驱动 Shell（非 session 预览）
 * 须 API :8080 · DATABASE_URL · TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1
 *
 * 复跑：cd frontend && ADM_U01_DB_ROLE_PREP=1 npx playwright test e2e/admin-adm-u01-db-role-shell-local.spec.ts --project=chromium
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {
  ADM_U01_ROLES,
  ADM_U01_SHELL_GROUP_IDS,
  ADM_U01_SHELL_GROUP_VISIBILITY,
} from "./helpers/admU01ShellMatrix";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccounts,
} from "./helpers/apiSession";

const enabled = process.env.ADM_U01_DB_ROLE_PREP === "1";
const feBase = (process.env.ADM_U01_PLAYWRIGHT_FE_BASE ?? "http://127.0.0.1:3012").replace(/\/$/, "");
const evidenceDir =
  process.env.ADM_U01_DB_ROLE_EVIDENCE_DIR?.trim() ||
  join(process.cwd(), "..", "evidence", "GO_local_admin_workspace_closure", "adm-u01-db-role-local-prep");

type DbShellRow = {
  role: (typeof ADM_U01_ROLES)[number];
  group_id: string;
  expected_visible: boolean;
  actual_visible: boolean;
  status: "PASS" | "FAIL";
};

const dbShellResults: DbShellRow[] = [];

test.describe("ADM-U01 local · DB console role shell @adm-u01-db-role", () => {
  test.describe.configure({ timeout: 120_000, mode: "serial" });
  test.use({ viewport: { width: 960, height: 900 } });

  test.beforeAll(() => {
    if (!enabled) return;
    mkdirSync(evidenceDir, { recursive: true });
  });

  test.afterAll(() => {
    if (!enabled) return;
    const fails = dbShellResults.filter((r) => r.status === "FAIL");
    const payload = {
      artifact: "adm-u01-local-db-console-role-shell",
      phase: "①-prep",
      playwright_fe_base: feBase,
      generated_at: new Date().toISOString(),
      summary: { total: dbShellResults.length, pass: dbShellResults.length - fails.length, fail: fails.length },
      rows: dbShellResults,
      note: "Uses PUT /admin/users/:id/console-role — not staging six-token matrix (②).",
    };
    writeFileSync(
      join(evidenceDir, "playwright-db-role-shell-matrix.json"),
      JSON.stringify(payload, null, 2),
      "utf-8",
    );
    expect(fails.length, JSON.stringify(fails, null, 2)).toBe(0);
  });

  test("all six console roles match ADM-U01 shell matrix without session preview", async ({
    page,
    request,
  }) => {
    test.skip(!enabled, "ADM_U01_DB_ROLE_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const email = process.env.ADM_U01_DB_ROLE_EMAIL?.trim() || "tourist@test.com";
    const password = process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!";
    const creds = await apiLoginReturnCredentials(request, apiBase, email, password);

    const me = await request.get(`${apiBase}/api/v1/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    expect(me.ok()).toBeTruthy();
    const meJson = (await me.json()) as { user?: { id?: string } };
    const userId = meJson.user?.id ?? "";
    expect(userId.length).toBeGreaterThan(0);

    for (const role of ADM_U01_ROLES) {
      const putRole = await request.put(`${apiBase}/api/v1/admin/users/${userId}/console-role`, {
        headers: {
          Authorization: `Bearer ${creds.token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `adm-u01-db-${role}-${Date.now()}`,
        },
        data: { console_role_70: role, reason: "e2e-db-shell-matrix-prep" },
      });
      if (!putRole.ok()) {
        test.skip(true, `PUT console-role failed ${putRole.status()} for ${role} — need ROLE_DIRECT=1`);
      }

      await page.addInitScript(() => {
        sessionStorage.removeItem("tt-admin-shell-preview-role");
      });
      await gotoWithBearerSession(page, `${feBase}/admin`, { token: creds.token, userId });

      await expect(page.locator('[data-tt-admin-shell-db-role-active="1"]')).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('[data-tt-admin-shell-preview-active="1"]')).toHaveCount(0);

      for (const groupId of ADM_U01_SHELL_GROUP_IDS) {
        const expected = ADM_U01_SHELL_GROUP_VISIBILITY[groupId][role];
        const loc = page.locator(`[data-tt-admin-shell-nav-group="${groupId}"]`);
        const actual = (await loc.count()) > 0;
        const status = actual === expected ? "PASS" : "FAIL";
        dbShellResults.push({
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
    }
  });
});
