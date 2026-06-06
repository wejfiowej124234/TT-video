/**
 * **方案 A（2026-06）**：`/community/me` Hub 已取消 → `/me/settings/profile`；`?tab=` 仍归一化至独立页。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe.serial("/community/me legacy hub redirects", () => {
  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("bare /community/me redirects logged-in user to settings profile", async ({ page, request }) => {
    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds?.token, "tourist session required");
    await gotoWithBearerSession(page, "/community/me", creds);
    await expect(page).toHaveURL(/\/me\/settings\/profile/, { timeout: 90_000 });
    await expect(page.locator('[data-tt-me-settings-profile="1"]')).toBeVisible({ timeout: 45_000 });
  });

  test("logged-in hub ?tab=posts redirects to dedicated posts page", async ({ page, request }) => {
    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds?.token, "tourist session required");
    await gotoWithBearerSession(page, "/community/me?tab=posts", creds);
    await expect(page).toHaveURL(/\/community\/me\/posts/, { timeout: 90_000 });
  });
});

test.describe("/community/me guest legacy tab redirects", () => {
  test("guest ?tab=posts redirects to posts page", async ({ page }) => {
    await page.goto("/community/me?tab=posts");
    await expect(page).toHaveURL(/\/community\/me\/posts/, { timeout: 90_000 });
  });
});
