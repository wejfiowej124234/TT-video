/**
 * 顶栏用户菜单 IA（账户 / 我的 / 工具）· ① 本地
 *
 * `PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/account-nav-header-ia.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { gotoWithHeaderNavSessionReady } from "./helpers/accountNavSession";
import { openHeaderUserMenuDropdown } from "./helpers/headerUserMenu";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { communityMeReportsPageShell } from "./helpers/pageShells";

const API_BASE = defaultApiBase();

test.describe("header user menu · account nav IA", () => {
  test.describe.configure({ timeout: 150_000 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("tools section: reports and settings links", async ({ page, request }) => {
    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithHeaderNavSessionReady(page, "/orders", creds);
    const menu = await openHeaderUserMenuDropdown(page);

    await expect(menu.getByText(/工具与设置|Tools & settings/i)).toBeVisible();
    const reportsItem = menu.getByRole("menuitem", { name: /我的举报|My reports/i });
    await expect(reportsItem).toHaveAttribute("href", "/community/me/reports");
    await reportsItem.click();
    await expect(page).toHaveURL(/\/community\/me\/reports/, { timeout: 30_000 });
    await expect(communityMeReportsPageShell(page)).toBeVisible({ timeout: 25_000 });
  });

  test("mine section: posts link from orders page", async ({ page, request }) => {
    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithHeaderNavSessionReady(page, "/orders", creds);
    const menu = await openHeaderUserMenuDropdown(page);

    await expect(menu.getByText(/^我的$|^Mine$/)).toBeVisible();
    await menu.getByRole("menuitem", { name: /我的发布|My posts/i }).click();
    await expect(page).toHaveURL(/\/community\/me\/posts/, { timeout: 30_000 });
  });

  test("account section: identities hub link", async ({ page, request }) => {
    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithHeaderNavSessionReady(page, "/me/settings/profile", creds);
    const menu = await openHeaderUserMenuDropdown(page);

    await menu.getByRole("menuitem", { name: /多重身份|Multiple roles/i }).click();
    await expect(page).toHaveURL(/\/me\/identities/, { timeout: 30_000 });
  });

  test("tools section: settings opens settings hub", async ({ page, request }) => {
    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithHeaderNavSessionReady(page, "/me/settings/profile", creds);
    const menu = await openHeaderUserMenuDropdown(page);

    await menu.getByRole("menuitem", { name: /^设置$|^Settings$/i }).click();
    await expect(page).toHaveURL(/\/me\/settings/, { timeout: 30_000 });
    await expect(page.locator('[data-tt-me-settings-route="hub"]')).toBeVisible({ timeout: 25_000 });
  });
});
