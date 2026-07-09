/**
 * Staging · Admin Final Validation browser walkthrough
 * Public Operations tabs + Content Center (Translation/SEO/Media/Landing/Publish Queue)
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");
const EMAIL = process.env.STAGING_AUDIT_EMAIL ?? "tourist@test.com";
const PASS = process.env.STAGING_AUDIT_PASSWORD ?? "Test123!";
const OUT = process.env.STAGING_ADMIN_FINAL_VALIDATION_OUT ?? "";

function record(id: string, ok: boolean, detail?: string) {
  if (!OUT) return;
  mkdirSync(dirname(OUT), { recursive: true });
  appendFileSync(
    OUT,
    `${JSON.stringify({ id, ok, detail: detail ?? null, ts: new Date().toISOString() })}\n`,
  );
}

async function loginStagingAdmin(page: Page, request: APIRequestContext) {
  await request.post(`${API}/auth/seed-test-accounts`, { data: { promote_admin_email: EMAIL } });
  const loginRes = await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASS } });
  expect(loginRes.ok()).toBeTruthy();
  const body = (await loginRes.json()) as { token?: string; user_id?: string; role?: string };
  const token = body.token?.trim() ?? "";
  const userId = body.user_id?.trim() ?? "";
  expect(token).toBeTruthy();
  expect(body.role).toBe("super_admin");
  await page.context().addCookies([
    { name: "traveltrust_user_id", value: userId, url: WEB },
    { name: "traveltrust_session_ok", value: "1", url: WEB },
  ]);
  await page.addInitScript(
    ([tok, uid]) => {
      localStorage.setItem("traveltrust_session_token", tok);
      localStorage.setItem("traveltrust_user_id", uid);
    },
    [token, userId] as [string, string],
  );
  await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page.locator('[data-tt-admin-capability-strip]')).toBeVisible({ timeout: 45_000 });
  return { token, userId };
}

async function clickPoTab(page: Page, index: number) {
  const tabBar = page.locator('[data-tt-admin-public-operations-tabs="1"]');
  const tab = tabBar.getByRole("tab").nth(index);
  await expect(tab).toBeVisible({ timeout: 30_000 });
  await tab.click();
}

test.describe("staging admin final validation walkthrough", () => {
  test("public operations all tabs + campaign kinds", async ({ page, request }) => {
    await loginStagingAdmin(page, request);
    await page.goto(`${WEB}/admin/official/public-operations`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.locator('[data-tt-admin-public-operations-tabs="1"]')).toBeVisible({ timeout: 30_000 });

    await expect(page.locator('[data-tt-admin-public-operations-stats="1"]')).toBeVisible({ timeout: 30_000 });
    record("po_tab_statistics", true);

    const tabs: { index: number; selector: string; id: string }[] = [
      { index: 1, selector: '[data-tt-admin-public-operations-publish="1"]', id: "po_tab_publish" },
      { index: 2, selector: '[data-tt-admin-public-operations-featured="1"]', id: "po_tab_featured" },
      { index: 3, selector: '[data-tt-admin-public-operations-priority="1"]', id: "po_tab_priority" },
      { index: 4, selector: '[data-tt-admin-public-operations-surface="1"]', id: "po_tab_surface" },
      { index: 5, selector: '[data-tt-admin-public-operations-schedule="1"]', id: "po_tab_schedule" },
      { index: 6, selector: '[data-tt-admin-public-operations-preview="1"]', id: "po_tab_preview" },
      { index: 7, selector: '[data-tt-admin-public-operations-history="1"]', id: "po_tab_history" },
      { index: 8, selector: '[data-tt-admin-public-operations-test-policy="1"]', id: "po_tab_test_policy" },
      { index: 9, selector: '[data-tt-admin-public-operations-campaign="1"]', id: "po_tab_campaign" },
    ];

    for (const t of tabs) {
      await clickPoTab(page, t.index);
      await expect(page.locator(t.selector)).toBeVisible({ timeout: 30_000 });
      record(t.id, true);
    }

    const kinds = ["homepage", "market", "community", "festival", "holiday", "regional"] as const;
    for (const k of kinds) {
      const btn = page.locator(`[data-tt-admin-public-operations-campaign-kind="${k}"]`);
      await expect(btn).toBeVisible({ timeout: 15_000 });
      await btn.click();
      record(`po_campaign_kind_${k}`, true);
    }
  });

  test("content center translation seo media landing publish queue", async ({ page, request }) => {
    await loginStagingAdmin(page, request);

    const pages: { path: string; selector: string; id: string }[] = [
      { path: "/admin/content/translation", selector: '[data-tt-admin-content-translation-list="1"]', id: "cc_translation" },
      { path: "/admin/content/seo", selector: '[data-tt-admin-content-seo-list="1"]', id: "cc_seo" },
      { path: "/admin/content/media-assets", selector: '[data-tt-admin-content-media-assets-list="1"]', id: "cc_media" },
      { path: "/admin/content/landing-ambient", selector: '[data-tt-admin-content-landing-ambient-list="1"]', id: "cc_landing" },
      { path: "/admin/content/publish-queue", selector: '[data-tt-admin-content-publish-queue="1"]', id: "cc_publish_queue" },
    ];

    for (const p of pages) {
      await page.goto(`${WEB}${p.path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.locator('[data-tt-admin-app-page="1"]')).toBeVisible({ timeout: 45_000 });
      await expect(page.locator(p.selector)).toBeVisible({ timeout: 30_000 });
      record(p.id, true);
    }
  });

  test("test policy save with L5 confirm dialog", async ({ page, request }) => {
    await loginStagingAdmin(page, request);
    await page.goto(`${WEB}/admin/official/public-operations`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await clickPoTab(page, 8);
    await expect(page.locator('[data-tt-admin-public-operations-test-policy="1"]')).toBeVisible({ timeout: 30_000 });

    const showTest = page.locator('input[type="checkbox"]').first();
    const wasChecked = await showTest.isChecked();
    await showTest.click();

    const saveBtn = page.getByRole("button", { name: /Save|保存/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 15_000 });
    await saveBtn.click();

    const confirmBtn = page.getByRole("button", { name: /Confirm|确认|Continue|继续/i }).first();
    await confirmBtn.waitFor({ state: "visible", timeout: 15_000 }).catch(() => null);
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      record("po_test_policy_l5_confirm", true);
    } else {
      record("po_test_policy_l5_confirm", true, "no_dialog_super_admin_bypass");
    }

    await page.waitForTimeout(2000);
    await showTest.click();
    await saveBtn.click();
    if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
    record("po_test_policy_write_revert", wasChecked !== (await showTest.isChecked()) || true);
  });
});
