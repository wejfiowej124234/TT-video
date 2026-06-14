/**
 * TN-P1-008 · 六角色 staging hat 切换浏览器矩阵（② · multi-demo + 单角色走廊）
 *
 * Driven by: scripts/dev/record-tn-p1-007-008-hat-staging-evidence.sh
 */
import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccounts,
} from "./helpers/apiSession";
import { ordersPageShell } from "./helpers/pageShells";

const STAGING = process.env.TN_P1_HAT_STAGING === "1";
const API = process.env.PLAYWRIGHT_API_BASE_URL?.trim() || defaultApiBase();
const PASS = process.env.HAT_PASSWORD?.trim() || "Test123!";

async function seedAndLogin(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  promoteAdmin = false,
) {
  await seedTestAccounts(request, API);
  if (promoteAdmin) {
    await request.post(`${API}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: { promote_admin_email: email },
    });
  }
  return apiLoginReturnCredentials(request, API, email, PASS);
}

async function openWithSession(
  page: import("@playwright/test").Page,
  creds: { token: string; userId?: string },
  path: string,
) {
  await gotoWithBearerSession(page, path, creds);
  await ensureCommunityBrowserSessionAccepted(page, creds, 120_000);
}

test.describe("TN-P1-008 hat staging matrix", () => {
  test.skip(!STAGING, "set TN_P1_HAT_STAGING=1 for staging hat browser matrix");

  test.describe.configure({ timeout: 300_000 });

  test("Traveler · /orders corridor shell", async ({ page, request }) => {
    const health = await request.get(`${API}/health`).catch(() => null);
    test.skip(!health?.ok(), `API down ${API}`);
    const creds = await seedAndLogin(request, "tourist@test.com");
    test.skip(!creds, "tourist login failed");
    await openWithSession(page, creds, "/orders");
    await expect(ordersPageShell(page)).toBeVisible({ timeout: 120_000 });
    await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
  });

  test("Guide · /guide workbench shell", async ({ page, request }) => {
    const creds = await seedAndLogin(request, "guide@test.com");
    test.skip(!creds, "guide login failed");
    await openWithSession(page, creds, "/guide");
    await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
  });

  test("Merchant · /provider workbench shell", async ({ page, request }) => {
    const creds = await seedAndLogin(request, "merchant@test.com");
    test.skip(!creds, "merchant login failed");
    await openWithSession(page, creds, "/provider");
    await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
  });

  test("multi-demo · identities hub → merchant + steward hats", async ({ page, request }) => {
    const creds = await seedAndLogin(request, "multi-demo@test.com");
    test.skip(!creds, "multi-demo login failed");
    await openWithSession(page, creds, "/me/identities");
    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 120_000,
    });
    const hub = page.locator('[data-tt-me-identities-l5="1"], [data-tt-me-identities-ui-frozen="1"]').first();
    await expect(hub).toBeVisible({ timeout: 60_000 });

    const providerLink = page.locator('a[href="/provider"], a[href*="/provider"]').first();
    if (await providerLink.isVisible().catch(() => false)) {
      await providerLink.click();
      await page.waitForURL(/\/provider/, { timeout: 60_000 });
      await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
      await openWithSession(page, creds, "/me/identities");
    }

    const stewardLink = page
      .locator('a[href="/governance"], a[href*="/governance"], a[href*="view=region"]')
      .first();
    if (await stewardLink.isVisible().catch(() => false)) {
      await stewardLink.click();
      await page.waitForURL(/\/governance/, { timeout: 60_000 });
      await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
    }
  });

  test("Region Steward · governance region workbench", async ({ page, request }) => {
    const creds = await seedAndLogin(request, "multi-demo@test.com");
    test.skip(!creds, "multi-demo login failed");
    await openWithSession(page, creds, "/governance?view=region");
    await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
  });

  test("Moderator · admin community moderation shell", async ({ page, request }) => {
    const creds = await seedAndLogin(request, "tourist@test.com", true);
    test.skip(!creds, "admin login failed");
    await openWithSession(page, creds, "/admin/community/moderation/cases");
    await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
  });

  test("Admin · /admin home shell", async ({ page, request }) => {
    const creds = await seedAndLogin(request, "tourist@test.com", true);
    test.skip(!creds, "admin login failed");
    await openWithSession(page, creds, "/admin");
    await expect(page.locator("body")).not.toContainText(/Application error|页面加载异常/i);
  });
});
