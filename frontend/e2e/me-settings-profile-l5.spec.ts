/**
 * `/me/settings/profile` L5 · ① 本地
 *
 * `PLAYWRIGHT_ME_SETTINGS=1 npx playwright test e2e/me-settings-profile-l5.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";
import { apiLoginReturnCredentials, defaultApiBase, seedTestAccountsAndReleaseGuideSlot } from "./helpers/apiSession";
import { gotoWithMeSettingsSessionReady } from "./helpers/accountNavSession";

test.describe("/me/settings/profile · L5", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ request }) => {
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), `API unreachable (${apiBase})`);
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  });

  test("profile subpage shows identity card, single edit CTA, account details", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/profile", creds);

    const shell = page.locator('[data-tt-me-settings-route="settings-profile"]');
    await expect(shell).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Profile|个人资料/i })).toBeVisible();
    await expect(page.locator('[data-tt-me-settings-profile-panel="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-me-settings-profile-identity="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-me-settings-profile-account-details="1"]')).toBeVisible();

    const editButtons = page.getByRole("button", { name: /Edit profile|编辑资料/i });
    await expect(editButtons).toHaveCount(1);

    await editButtons.first().click();
    await expect(page.locator('[data-tt-me-settings-profile-edit-form="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-me-settings-profile-account-details="1"]')).toHaveCount(0);

    await page.getByRole("button", { name: /Cancel|取消/i }).click();
    await expect(page.locator('[data-tt-me-settings-profile-edit-form="1"]')).toHaveCount(0);
    await expect(page.locator('[data-tt-me-settings-profile-account-details="1"]')).toBeVisible();
  });

  test("no duplicate community content nav; privacy row present", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/profile", creds);

    await expect(page.locator('[data-tt-me-settings-profile-content-links="1"]')).toHaveCount(0);
    await expect(page.locator('[data-tt-me-settings-profile-privacy-link="1"] a[href="/me/settings/privacy"]')).toBeVisible({
      timeout: 25_000,
    });
  });
});
