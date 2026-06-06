/**
 * ADM-U02 · ① 权限页 Phase ②/③ 预备 UI（须 FE :3012 + API :8080）
 *
 * 复跑：cd frontend && ADM_U02_UI_PREP=1 npx playwright test e2e/admin-adm-u02-permissions-ui-local.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccounts,
} from "./helpers/apiSession";

const enabled = process.env.ADM_U02_UI_PREP === "1";
const feBase = (process.env.ADM_U02_PLAYWRIGHT_FE_BASE ?? "http://127.0.0.1:3012").replace(/\/$/, "");

test.describe("ADM-U02 local · permissions phase2 prep UI @adm-u02-ui", () => {
  test("permissions page mounts phase2 prep panels", async ({ page, request }) => {
    test.skip(!enabled, "ADM_U02_UI_PREP!=1");

    const apiBase = defaultApiBase();
    await seedTestAccounts(request, apiBase);
    const email = process.env.ADM_U02_UI_EMAIL?.trim() || "tourist@test.com";
    const password = process.env.ADM_U02_LOCAL_PASSWORD?.trim() || "Test123!";
    const creds = await apiLoginReturnCredentials(request, apiBase, email, password);
    if (!creds?.token) test.skip(true, "login failed — need admin/super_admin");

    await gotoWithBearerSession(page, `${feBase}/admin/permissions`, creds);

    await expect(page.locator('[data-tt-admin-permissions-phase2-prep="1"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-tt-admin-phase2-closure-prep-panel="1"]')).toBeVisible();
    await expect(page.locator("#admin-phase2-remaining-backlog")).toBeVisible();
    await expect(page.locator('[data-tt-admin-phase2-runbook-strip="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-admin-production-safety-panel="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-admin-2fa-policy-panel="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-admin-console-role-shell-preview="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-admin-phase2-remaining-local-cmd="ADM-UX-CI-02"]')).toBeVisible();
  });
});
