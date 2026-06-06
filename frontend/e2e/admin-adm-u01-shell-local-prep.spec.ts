/**
 * ADM-U01 · ① 本地预备：Shell 分组预览（sessionStorage）× ADM-U01 矩阵对拍。
 * 非 ② staging GO — 不替代 `admin-rbac-staging-six-roles.spec.ts`（须六 token + STAGING_FE_BASE）。
 *
 * 复跑：cd frontend && ADM_U01_LOCAL_PREP=1 npx playwright test e2e/admin-adm-u01-shell-local-prep.spec.ts --project=chromium
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {
  ADMIN_SHELL_PREVIEW_STORAGE_KEY,
} from "../lib/admin/adminShellPreviewRole";
import {
  ADM_U01_ROLES,
  ADM_U01_SHELL_GROUP_VISIBILITY,
} from "./helpers/admU01ShellMatrix";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccounts,
} from "./helpers/apiSession";
import { expectAdminHomeShellPreviewBanner } from "./helpers/adminHomeShellPreview";

const enabled = process.env.ADM_U01_LOCAL_PREP === "1";
const feBase = (process.env.ADM_U01_PLAYWRIGHT_FE_BASE ?? "http://127.0.0.1:3012").replace(
  /\/$/,
  "",
);
const evidenceDir =
  process.env.ADM_U01_LOCAL_EVIDENCE_DIR?.trim() ||
  join(process.cwd(), "..", "evidence", "GO_local_admin_workspace_closure", "adm-u01-local-prep");

type ShellRow = {
  role: (typeof ADM_U01_ROLES)[number];
  group_id: string;
  expected_visible: boolean;
  actual_visible: boolean;
  status: "PASS" | "FAIL";
};

const shellResults: ShellRow[] = [];

test.describe("ADM-U01 local prep · shell preview matrix @adm-u01-local-prep", () => {
  test.describe.configure({ timeout: 90_000, mode: "serial" });
  test.use({ viewport: { width: 960, height: 900 } });

  test.beforeAll(() => {
    if (!enabled) return;
    mkdirSync(evidenceDir, { recursive: true });
  });

  test.afterAll(() => {
    if (!enabled) return;
    const fails = shellResults.filter((r) => r.status === "FAIL");
    const payload = {
      artifact: "adm-u01-local-shell-preview",
      phase: "①-prep",
      playwright_fe_base: feBase,
      generated_at: new Date().toISOString(),
      summary: { total: shellResults.length, pass: shellResults.length - fails.length, fail: fails.length },
      rows: shellResults,
      note: "Uses sessionStorage shell preview — not DB console-role switch (②).",
    };
    writeFileSync(
      join(evidenceDir, "playwright-shell-preview-matrix.json"),
      JSON.stringify(payload, null, 2),
      "utf-8",
    );
    expect(fails.length, JSON.stringify(fails, null, 2)).toBe(0);
  });

  test("admin session · shell preview matches ADM-U01 matrix", async ({ page, request }) => {
    test.skip(!enabled, "ADM_U01_LOCAL_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const email = process.env.ADM_U01_LOCAL_EMAIL?.trim() || "tourist@test.com";
    const password = process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!";
    const creds = await apiLoginReturnCredentials(request, apiBase, email, password);
    if (!creds?.token) test.skip(true, "login failed — need admin/super_admin");
    const { token, userId } = creds;
    expect(userId.length).toBeGreaterThan(0);

    const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";

    for (const role of ADM_U01_ROLES) {
      await page.goto("about:blank");
      await page.evaluate(() => {
        try {
          sessionStorage.clear();
          localStorage.clear();
        } catch {
          /* ignore */
        }
      });

      await page.context().addCookies([
        { name: "traveltrust_user_id", value: userId, url: origin },
      ]);

      await gotoWithBearerSession(page, `${origin}/admin`, { token, userId });

      await page.evaluate(
        ({ storageKey, previewRole }) => {
          sessionStorage.setItem(storageKey, previewRole);
          window.dispatchEvent(new Event("tt-admin-shell-preview-change"));
        },
        { storageKey: ADMIN_SHELL_PREVIEW_STORAGE_KEY, previewRole: role },
      );

      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-tt-admin-shell-bar="1"]')).toBeVisible({ timeout: 60_000 });
      await expectAdminHomeShellPreviewBanner(page);
      await expect(page.locator('[data-tt-admin-shell-preview-active="1"]')).toHaveCount(0);

      for (const [groupId, expectations] of Object.entries(ADM_U01_SHELL_GROUP_VISIBILITY)) {
        const expected = expectations[role];
        const loc = page.locator(`[data-tt-admin-shell-nav-group="${groupId}"]`);
        const actual = (await loc.count()) > 0;
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
    }
  });

  test("shell bar perspective switcher visible for admin session (① operator prep)", async ({
    page,
    request,
  }) => {
    test.skip(!enabled, "ADM_U01_LOCAL_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const creds = await apiLoginReturnCredentials(
      request,
      apiBase,
      process.env.ADM_U01_LOCAL_EMAIL?.trim() || "tourist@test.com",
      process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!",
    );
    if (!creds?.token) test.skip(true, "login failed");

    const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";
    await gotoWithBearerSession(page, `${origin}/admin/inbox`, creds);

    await expect(page.locator('[data-tt-admin-shell-role-perspective-switcher]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-tt-admin-shell-role-perspective-select]')).toBeVisible();
  });

  test("shell bar perspective select matches matrix for all roles", async ({ page, request }) => {
    test.skip(!enabled, "ADM_U01_LOCAL_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const email = process.env.ADM_U01_LOCAL_EMAIL?.trim() || "tourist@test.com";
    const password = process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!";
    const creds = await apiLoginReturnCredentials(request, apiBase, email, password);
    if (!creds?.token) test.skip(true, "login failed");

    const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";
    await page.goto("about:blank");
    await page.evaluate(() => {
      try {
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await gotoWithBearerSession(page, `${origin}/admin/inbox`, creds);

    const select = page.locator('[data-tt-admin-shell-role-perspective-select]');
    await expect(select).toBeVisible({ timeout: 15_000 });

    for (const role of ADM_U01_ROLES) {
      await select.selectOption(role);
      await gotoWithBearerSession(page, `${origin}/admin`, creds);
      await expectAdminHomeShellPreviewBanner(page);
      await expect(page.locator('[data-tt-admin-shell-preview-active="1"]')).toHaveCount(0);

      for (const [groupId, expectations] of Object.entries(ADM_U01_SHELL_GROUP_VISIBILITY)) {
        const expected = expectations[role];
        const loc = page.locator(`[data-tt-admin-shell-nav-group="${groupId}"]`);
        if (expected) await expect(loc.first()).toBeVisible();
        else await expect(loc).toHaveCount(0);
      }
    }
  });

  test("permissions page mounts ADM-U01 local prep panel (①)", async ({ page, request }) => {
    test.skip(!enabled, "ADM_U01_LOCAL_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const creds = await apiLoginReturnCredentials(
      request,
      apiBase,
      process.env.ADM_U01_LOCAL_EMAIL?.trim() || "tourist@test.com",
      process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!",
    );
    if (!creds?.token) test.skip(true, "login failed");

    const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";
    await gotoWithBearerSession(page, `${origin}/admin/permissions#admin-adm-u01-local-prep`, creds);

    await expect(page.locator('[data-tt-admin-adm-u01-local-prep-panel="1"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-tt-admin-adm-u01-prep-flow="session-preview"]')).toBeVisible();
    await expect(page.locator('[data-tt-admin-adm-u01-prep-flow="db-console-role"]')).toBeVisible();
  });

  test("ops and community section back links visible (①)", async ({ page, request }) => {
    test.skip(!enabled, "ADM_U01_LOCAL_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const creds = await apiLoginReturnCredentials(
      request,
      apiBase,
      process.env.ADM_U01_LOCAL_EMAIL?.trim() || "tourist@test.com",
      process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!",
    );
    if (!creds?.token) test.skip(true, "login failed");

    const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";
    await gotoWithBearerSession(page, `${origin}/admin/users`, creds);
    await expect(page.locator('[data-tt-admin-queue-back-inbox="1"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-tt-admin-ops-cross-approvals="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-admin-back-observability-hub="1"]')).toBeVisible();

    await gotoWithBearerSession(page, `${origin}/admin/community/penalties`, creds);
    await expect(page.locator('[data-tt-admin-queue-back-inbox="1"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-tt-admin-back-observability-hub="1"]')).toBeVisible();
  });

  test("admin home inbox focus banner or all-clear (①)", async ({ page, request }) => {
    test.skip(!enabled, "ADM_U01_LOCAL_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const creds = await apiLoginReturnCredentials(
      request,
      apiBase,
      process.env.ADM_U01_LOCAL_EMAIL?.trim() || "tourist@test.com",
      process.env.ADM_U01_LOCAL_PASSWORD?.trim() || "Test123!",
    );
    if (!creds?.token) test.skip(true, "login failed");

    const origin = feBase.startsWith("http") ? feBase : "http://127.0.0.1:3012";
    await gotoWithBearerSession(page, `${origin}/admin`, creds);

    await expect(page.locator('[data-tt-admin-home-inbox="1"]')).toBeVisible({ timeout: 30_000 });
    const focusSurface = page.locator('[data-tt-admin-home-inbox-focus-surface="1"]');
    const allClear = page.locator('[data-tt-admin-inbox-all-clear="1"]');
    await expect(focusSurface.or(allClear)).toBeVisible({ timeout: 30_000 });
  });
});
