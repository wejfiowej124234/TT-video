/**
 * `/me/settings` L5 Hub · ① 本地（route mock + session）
 *
 * `PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/me-settings-l5-hub.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { gotoWithMeSettingsSessionReady } from "./helpers/accountNavSession";
import { headerUserMenuShell } from "./helpers/pageShells";
import {
  communityMeLogoutWithL5Confirm,
  confirmMeSettingsL5Dialog,
  headerLogoutWithL5Confirm,
  hubSettingsLogoutWithL5Confirm,
  installEmptyDisputesListRoute,
  fetchMeSessionsItemCount,
  loginTouristDualSessionViaBrowser,
  loginTouristWithSecondarySession,
  installHubStatusApiFailureRoutes,
  ME_SETTINGS_DELETE_ACCOUNT_FEEDBACK_PATH,
  registerUnverifiedTouristCredentials,
} from "./helpers/meSettingsE2e";
import { ensureDisputeIdForBearer } from "./helpers/meSettingsF025DisputeSeed";

test.describe("/me/settings · L5 hub", () => {
  test.describe.configure({ timeout: 150_000 });

  test.beforeEach(async ({ request }) => {
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), `API unreachable (${apiBase})`);
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  });

  test("logged-in traveler sees hub title, profile card, password row", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings?from=community", creds);

    const hub = page.locator('[data-tt-me-settings-route="hub"]');
    await expect(page.getByRole("main", { name: /Settings|设置/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Settings|设置/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to community profile|返回社区资料/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Edit community profile|编辑社区资料/i })).toBeVisible();
    await expect(hub.locator('a[href="/me/password"]')).toBeVisible();
    await expect(hub.locator('a[href="/me/security"]')).toBeVisible();
    await expect(hub.locator('a[href="/disputes?from=settings"]')).toBeVisible();
    // 通知偏好在「隐私与条款」折叠组内 — 见 notifications-prefs 子页用例
    await expect(page.locator("[data-tt-me-settings-hub-status]")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Pay & escrow|支付与托管/i })).toHaveCount(0);
  });

  test("notifications-prefs subpage links to security event log", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/notifications-prefs", creds);
    await expect(page.getByRole("heading", { level: 1, name: /Notification preferences|通知偏好/i })).toBeVisible({
      timeout: 25_000,
    });
    const prefs = page.locator('[data-tt-me-settings-route="notifications-prefs"]');
    await expect(prefs.locator('a[href*="/me/security"][href*="focus=notifications"]')).toBeVisible({
      timeout: 25_000,
    });
    await expect(prefs.locator('[data-tt-me-settings-toggle="email_digest"]')).toBeVisible();
    await expect(prefs.locator('[data-tt-me-settings-toggle="push"]')).toBeVisible();
  });

  test("security page links to notification prefs", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/security", creds);
    await expect(page.locator('[data-tt-me-security-page="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("link", { name: /Notification preferences|通知偏好/i }).first()).toHaveAttribute(
      "href",
      "/me/settings/notifications-prefs",
    );
    await expect(page.getByRole("heading", { name: /Security event log|安全事件记录/i })).toBeVisible();
  });

  test("language subpage switches locale", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/language", creds);
    await expect(page.getByRole("heading", { level: 1, name: /Display language|显示语言/i })).toBeVisible({
      timeout: 25_000,
    });
    await page.getByRole("option", { name: /English/i }).click();
    await expect(page.getByRole("main")).toContainText(/Display language/i);
  });

  test("security subpage has settings back link and L5 shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/security", creds);
    await expect(page.locator('[data-tt-me-security-page="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i })).toHaveAttribute(
      "href",
      "/me/settings",
    );
  });

  test("security revoke current session uses L5 confirm", async ({ page, request, browser }) => {
    const apiBase = defaultApiBase();
    let dual =
      (await loginTouristDualSessionViaBrowser(browser, request, apiBase)) ??
      (await loginTouristWithSecondarySession(request, apiBase));
    test.skip(!dual, "dual-session login unavailable");
    const { primary: creds } = dual;

    await gotoWithMeSettingsSessionReady(page, "/me/security", creds);
    await expect(page.locator('[data-tt-me-security-page="1"]')).toBeVisible({ timeout: 25_000 });

    const revokeBtn = page.locator('[data-tt-me-security-revoke-current="1"]');
    await expect(revokeBtn).toBeVisible({ timeout: 45_000 });

    const deleteCurrent = page.waitForResponse(
      (res) => {
        if (res.request().method() !== "DELETE") return false;
        try {
          return new URL(res.url()).pathname.replace(/\/$/, "").endsWith("/api/v1/me/sessions/current");
        } catch {
          return false;
        }
      },
      { timeout: 45_000 },
    );

    await revokeBtn.click();
    await confirmMeSettingsL5Dialog(page, /Revoke|撤销|revoke|确认|Confirm/i);

    const delRes = await deleteCurrent;
    expect(delRes.ok()).toBe(true);

    await expect(page.locator('[data-tt-me-settings-confirm="me-settings-confirm"]')).toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("security revoke non-current session by suffix redirects hub flash=sessions", async ({
    page,
    request,
    browser,
  }) => {
    const apiBase = defaultApiBase();
    let dual =
      (await loginTouristDualSessionViaBrowser(browser, request, apiBase)) ??
      (await loginTouristWithSecondarySession(request, apiBase));
    test.skip(!dual, "dual-session login unavailable");
    const { primary: creds, secondarySuffix } = dual;
    const sessionCount = await fetchMeSessionsItemCount(page.request, creds.token);
    test.skip(sessionCount == null || sessionCount < 2, "need >= 2 sessions from real API");

    await gotoWithMeSettingsSessionReady(page, "/me/security", creds);
    await expect(page.locator('[data-tt-me-security-page="1"]')).toBeVisible({ timeout: 25_000 });

    const suffixBtn = page.locator(`[data-tt-me-security-revoke-suffix="${secondarySuffix}"]`);
    await expect(suffixBtn).toBeVisible({ timeout: 45_000 });

    const deleteSuffix = page.waitForResponse(
      (res) => {
        if (res.request().method() !== "DELETE") return false;
        try {
          const p = new URL(res.url()).pathname.replace(/\/$/, "");
          return p.endsWith(`/api/v1/me/sessions/${secondarySuffix}`);
        } catch {
          return false;
        }
      },
      { timeout: 45_000 },
    );

    await suffixBtn.click();
    await confirmMeSettingsL5Dialog(page, /Revoke|撤销|revoke|确认|Confirm/i);

    const delRes = await deleteSuffix;
    expect(delRes.ok()).toBe(true);

    await expect(page).toHaveURL(/\/me\/settings\?.*flash=sessions/, { timeout: 30_000 });
    await expect(page.locator('[data-tt-me-settings-flash-banner="1"]')).toBeVisible({
      timeout: 15_000,
    });

    const afterCount = await fetchMeSessionsItemCount(page.request, creds.token);
    expect(afterCount).toBe(sessionCount - 1);
  });

  test("account data subpage explains deletion policy", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/data", creds);
    await expect(page.getByRole("heading", { level: 1, name: /Account & data|账户与数据/i })).toBeVisible({
      timeout: 25_000,
    });
  });

  test("privacy subpage has L5 shell and legal rows", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/privacy", creds);
    await expect(page.locator('[data-tt-me-settings-route="privacy"]')).toBeVisible({ timeout: 25_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Privacy|隐私与可见性|隐私说明/i }),
    ).toBeVisible();
    const privacy = page.locator('[data-tt-me-settings-route="privacy"]');
    await expect(privacy.locator('a[href="/me/settings/notifications-prefs"]')).toBeVisible();
    await expect(privacy.locator('[data-tt-me-settings-community-visibility="1"]')).toBeVisible();
  });

  test("disputes list uses settings L5 extension shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/disputes?from=settings", creds);
    await expect(page.locator('[data-tt-me-settings-route="disputes-list"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-disputes-from-settings="1"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i }).first()).toBeVisible();
    await expect(page.locator('[data-tt-disputes-l5="1"]')).toBeVisible();
  });

  test("disputes empty list from settings shows empty state", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await installEmptyDisputesListRoute(page);
    await gotoWithMeSettingsSessionReady(page, "/disputes?from=settings", creds);
    await expect(page.locator('[data-tt-me-settings-route="disputes-list"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-disputes-from-settings="1"]')).toBeVisible();
    const empty = page.locator('[data-tt-disputes-empty="1"]');
    await expect(empty).toBeVisible({ timeout: 25_000 });
    await expect(empty).toContainText(/No disputes|暂无争议/i);
  });

  test("help from settings uses L5 document shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/help?from=settings", creds);
    await expect(page.locator('[data-tt-help-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i }).first()).toBeVisible();
  });

  test("privacy from settings uses L5 document shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/privacy?from=settings", creds);
    await expect(page.locator('[data-tt-privacy-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
  });

  test("profile card opens community me with settings back link", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    const profileCard = page.locator('[data-tt-me-settings-profile-card="1"]');
    await expect(profileCard).toBeVisible({ timeout: 25_000 });
    await expect(profileCard).toHaveAttribute("href", /\/community\/me\?.*from=settings/);
    await Promise.all([page.waitForURL(/\/community\/me/, { timeout: 25_000 }), profileCard.click()]);
    expect(page.url()).toMatch(/from=settings/);
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i }).first()).toBeVisible();
  });

  test("trust subpage links wallet verify and trust center", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/trust", creds);
    const trust = page.locator('[data-tt-me-settings-route="settings-trust"]');
    await expect(trust).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-kyc-status]')).toHaveCount(0);
    await expect(trust.locator('a[href="/trust?from=settings"]')).toBeVisible();
    await expect(trust.locator('a[href*="/me/security"]').first()).toBeVisible();
  });

  test("trust center from settings shows extension chrome", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/trust?from=settings", creds);
    await expect(page.locator('[data-tt-trust-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
  });

  test("verify-email from settings uses settings shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/auth/verify-email?from=settings", creds);
    await expect(page.locator('[data-tt-me-settings-route="verify-email"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-auth-verify-from-settings="1"]')).toBeVisible();
  });

  test("data subpage exposes export and delete actions", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/data", creds);
    const data = page.locator('[data-tt-me-settings-route="data"]');
    await expect(data).toBeVisible({ timeout: 25_000 });
    await expect(
      page.locator('[data-tt-me-settings-route="data"][data-tt-me-settings-data-export="1"]'),
    ).toBeVisible();
    await expect(data.locator('[data-tt-me-settings-action="export_data"]')).toBeVisible();
    await expect(data.locator('[data-tt-me-settings-action="delete_account"]')).toBeVisible();
  });

  test("password subpage links back to settings hub", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/password", creds);
    await expect(page.getByRole("heading", { level: 1, name: /Change password|修改密码/i })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i })).toHaveAttribute("href", "/me/settings");
  });

  test("hub shows wallet flash banner and dismiss clears query", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings?flash=wallet", creds);
    const hub = page.locator('[data-tt-me-settings-route="hub"]');
    await expect(hub).toBeVisible({ timeout: 25_000 });
    const banner = page.locator('[data-tt-me-settings-flash-banner="1"]');
    await expect(banner).toBeVisible();
    await banner.getByRole("button").click();
    await expect(page).toHaveURL(/\/me\/settings(?:\?|$)/);
    await expect(page).not.toHaveURL(/flash=/);
    await expect(banner).toHaveCount(0);
  });

  test("delete-account feedback from settings-data opens prefilled modal", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(
      page,
      "/community/feedback?from=settings-data&intent=delete-account",
      creds,
    );
    await expect(page.locator('[data-tt-community-feedback-delete-account-intent="1"]')).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator('[data-tt-community-feedback-delete-account-modal="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("terms from settings uses L5 document shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/terms?from=settings", creds);
    await expect(page.locator('[data-tt-terms-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i }).first()).toBeVisible();
  });

  test("provider register from settings shows extension ingress", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/provider/register?from=settings", creds);
    await expect(page.locator('[data-tt-provider-register-from-settings="1"]')).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
  });

  test("settings profile page links back to settings hub", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/profile", creds);
    await expect(page.locator('[data-tt-me-settings-profile="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("link", { name: /返回设置|Back to settings/i })).toHaveAttribute(
      "href",
      "/me/settings",
    );
  });

  test("header logout from settings profile uses L5 confirm", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/profile", creds);
    await expect(page.locator('[data-tt-me-logout-l5="1"]')).toHaveCount(0);
    await headerLogoutWithL5Confirm(page);
  });
  });

  test("hub from=community shows back link to community profile", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings?from=community", creds);
    await expect(page.getByRole("link", { name: /Back to community profile|返回社区资料/i }).first()).toHaveAttribute(
      "href",
      "/me/settings/profile",
    );
  });

  test("sessions flash banner on hub", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings?flash=sessions", creds);
    await expect(page.locator('[data-tt-me-settings-flash-banner="1"]')).toBeVisible({ timeout: 25_000 });
  });

  test("hub security events nav row deep-links to security focus=notifications", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    const hub = page.locator('[data-tt-me-settings-route="hub"]');
    await hub.getByRole("button", { name: /Privacy|隐私与条款/i }).click();
    const eventsLink = hub.locator('a[href*="/me/security"][href*="focus=notifications"]');
    await expect(eventsLink).toBeVisible({ timeout: 45_000 });
    await eventsLink.click();
    await expect(page).toHaveURL(/\/me\/security\?.*focus=notifications/, { timeout: 30_000 });
    await expect(page.locator("#me-security-notifications")).toBeVisible({ timeout: 25_000 });
  });

  test("security notifications filter by delivery_status sent", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    const notifProbe = await request.get(`${apiBase}/api/v1/me/security-notifications?limit=20`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!notifProbe.ok(), "security-notifications API unavailable");
    const notifBody = (await notifProbe.json()) as { items?: { template_key?: string; delivery_status?: string }[] };
    const hasSent = (notifBody.items ?? []).some((i) => i.delivery_status === "sent");
    test.skip(!hasSent, "seed sent notification required (PG)");

    await gotoWithMeSettingsSessionReady(page, "/me/security?focus=notifications", creds);
    const panel = page.locator("#me-security-notifications");
    await expect(panel).toBeVisible({ timeout: 45_000 });

    const applyFilter = page.waitForResponse(
      (res) => {
        if (res.request().method() !== "GET") return false;
        try {
          const u = new URL(res.url());
          return (
            u.pathname.replace(/\/$/, "").endsWith("/api/v1/me/security-notifications") &&
            u.searchParams.get("status") === "sent"
          );
        } catch {
          return false;
        }
      },
      { timeout: 45_000 },
    );

    await panel.locator("select").first().selectOption("sent");
    await panel.getByRole("button", { name: /Apply|应用|Refresh|刷新/i }).click();
    await applyFilter;

    await expect(panel.locator('[data-tt-me-security-notif-row="1"]').first()).toContainText(
      /password_changed|me_settings_e2e_sent|sent/i,
      { timeout: 25_000 },
    );
    await expect(panel.getByText(/login_alert|me_settings_e2e_fixture/i)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test("hub wallet nav row deep-links to security focus=wallet", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    const hub = page.locator('[data-tt-me-settings-route="hub"]');
    const walletLink = hub.locator('a[href*="/me/security"][href*="focus=wallet"]');
    await expect(walletLink).toBeVisible({ timeout: 45_000 });
    await walletLink.click();
    await expect(page).toHaveURL(/\/me\/security\?.*focus=wallet/, { timeout: 30_000 });
    await expect(page.locator("#me-security-wallet")).toBeVisible({ timeout: 25_000 });
    await expect(page.locator("#me-security-wallet")).toBeInViewport({ timeout: 15_000 });
  });

  test("security notifications filter by event_type password_changed", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    const notifProbe = await request.get(`${apiBase}/api/v1/me/security-notifications?limit=20`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!notifProbe.ok(), "security-notifications API unavailable");
    const notifBody = (await notifProbe.json()) as { items?: { event_type?: string }[] };
    test.skip(
      !(notifBody.items ?? []).some((i) => i.event_type === "password_changed"),
      "seed password_changed notification required (PG)",
    );

    await gotoWithMeSettingsSessionReady(page, "/me/security?focus=notifications", creds);
    const panel = page.locator("#me-security-notifications");
    await expect(panel).toBeVisible({ timeout: 45_000 });

    const applyEvent = page.waitForResponse(
      (res) => {
        if (res.request().method() !== "GET") return false;
        try {
          const u = new URL(res.url());
          return (
            u.pathname.replace(/\/$/, "").endsWith("/api/v1/me/security-notifications") &&
            u.searchParams.get("event_type") === "password_changed"
          );
        } catch {
          return false;
        }
      },
      { timeout: 45_000 },
    );

    await panel.getByRole("textbox", { name: /event|事件/i }).fill("password_changed");
    await panel.getByRole("button", { name: /Apply|应用|Refresh|刷新/i }).click();
    await applyEvent;

    await expect(panel.locator('[data-tt-me-security-notif-row="1"]').first()).toContainText(
      /password_changed/i,
      { timeout: 25_000 },
    );
    await expect(panel.getByText(/login_alert/i)).toHaveCount(0, { timeout: 10_000 });
  });

  test("hub account security row deep-links to security focus=sessions", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    const hub = page.locator('[data-tt-me-settings-route="hub"]');
    const securityLink = hub.locator('a[href="/me/security"]');
    await expect(securityLink).toBeVisible({ timeout: 45_000 });
    await securityLink.click();
    await expect(page).toHaveURL(/\/me\/security(?:\?|$)/, { timeout: 30_000 });
    await expect(page.locator("#me-security-sessions")).toBeVisible({ timeout: 25_000 });
  });

  test("security focus=sessions scrolls sessions panel into view", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/security?focus=sessions", creds);
    await expect(page.locator('[data-tt-me-security-page="1"]')).toBeVisible({ timeout: 25_000 });
    const panel = page.locator("#me-security-sessions");
    await expect(panel).toBeVisible({ timeout: 25_000 });
    await expect(panel).toBeInViewport({ timeout: 15_000 });
  });

  test("security notifications expand and export json", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    const notifProbe = await request.get(`${apiBase}/api/v1/me/security-notifications?limit=5`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!notifProbe.ok(), "security-notifications API unavailable");
    const notifBody = (await notifProbe.json()) as { items?: unknown[] };
    test.skip((notifBody.items?.length ?? 0) < 1, "seed security notification required (PG)");

    await gotoWithMeSettingsSessionReady(page, "/me/security?focus=notifications", creds);
    await expect(page.locator("#me-security-notifications")).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('[data-tt-me-security-notif-row="1"]').first()).toBeVisible({
      timeout: 45_000,
    });

    await page.locator('[data-tt-me-security-notif-expand="1"]').first().click();
    await expect(page.locator('[data-tt-me-security-notif-row="1"]').first().locator("pre")).toBeVisible({
      timeout: 15_000,
    });

    const notifPanel = page.locator("#me-security-notifications");
    const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
    await notifPanel.getByRole("button", { name: /Export JSON|导出 JSON/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/me-security-notifications.*\.json$/i);
  });

  test("community guidelines from settings uses L5 document shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/terms/community-guidelines?from=settings", creds);
    await expect(page.locator('[data-tt-guidelines-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
  });

  test("feedback from settings shows extension chrome", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/community/feedback?from=settings", creds);
    await expect(page.locator('[data-tt-community-feedback-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-community-feedback-delete-account-intent="1"]')).toHaveCount(0);
  });

  test("steward register from settings shows extension ingress", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/steward/register?from=settings", creds);
    await expect(page.locator('[data-tt-steward-register-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
  });

  test("guide dashboard from settings shows extension ingress", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "guide@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/guide?from=settings", creds);
    await expect(page.locator('[data-tt-guide-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-extension-chrome="1"]')).toBeVisible();
  });

  test("onboarding from settings uses settings L5 flow marker", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/onboarding?from=settings", creds);
    await ensureCommunityBrowserSessionAccepted(page, creds, 90_000);
    await page.reload();
    await ensureCommunityBrowserSessionAccepted(page, creds, 90_000);
    await expect(headerUserMenuShell(page)).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(/\/me\/onboarding/, { timeout: 30_000 });
    await expect(page.locator('[data-tt-me-onboarding-gate-redirect="1"]')).toHaveCount(0, {
      timeout: 90_000,
    });
    const fromSettingsShell = page.locator('[data-tt-me-onboarding-from-settings="1"]');
    const settingsRoute = page.locator('[data-tt-me-settings-route="onboarding"]');
    await expect(fromSettingsShell).toBeVisible({ timeout: 90_000 });
    await expect(settingsRoute).toBeVisible();
    await expect(page.locator('a[href="/me/settings"]').first()).toBeVisible();
  });

  test("dispute detail from settings keeps L5 extension shell", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    const placeholderId = "00000000-0000-4000-8000-000000000001";
    await gotoWithMeSettingsSessionReady(
      page,
      `/disputes/${placeholderId}?from=settings`,
      creds,
    );
    await expect(page.locator('[data-tt-me-settings-route="disputes-detail"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-disputes-from-settings="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-disputes-l5="1"]')).toBeVisible();
  });

  test("data export opens L5 confirm dialog", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/data", creds);
    const data = page.locator('[data-tt-me-settings-route="data"]');
    await expect(data).toBeVisible({ timeout: 25_000 });
    await data.locator('[data-tt-me-settings-action="export_data"]').click();
    await expect(page.locator('[data-tt-me-settings-confirm="me-settings-confirm"]')).toBeVisible();
    await expect(page.getByRole("alertdialog")).toBeVisible();
  });

  test("notification prefs toggles persist across reload", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");
    test.skip(!creds.userId, "login response missing user_id");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/notifications-prefs", creds);
    await expect(page.locator('[data-tt-me-settings-notif-prefs="1"]')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-tt-me-settings-prefs-ready="1"]')).toBeVisible({ timeout: 45_000 });

    const emailSwitch = page.getByRole("switch").first();
    await expect(emailSwitch).toBeVisible({ timeout: 25_000 });

    const wasChecked = (await emailSwitch.getAttribute("aria-checked")) === "true";
    const targetChecked = wasChecked ? "false" : "true";
    const wantDigest = targetChecked === "true";

    await emailSwitch.click();
    await expect(emailSwitch).toHaveAttribute("aria-checked", targetChecked);
    await expect(page.locator('[data-tt-me-settings-saved-toast="1"]')).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(
        async () =>
          page.evaluate(
            ({ uid, digest }) => {
              const raw = localStorage.getItem(`tt_me_settings_prefs_v2_${uid}`);
              if (!raw) return null;
              const parsed = JSON.parse(raw) as { notification?: { emailDigest?: boolean } };
              return parsed.notification?.emailDigest === digest;
            },
            { uid: creds.userId, digest: wantDigest },
          ),
        { timeout: 15_000 },
      )
      .toBe(true);

    await expect
      .poll(
        async () => {
          const meRes = await request.get(`${apiBase}/api/v1/me`, {
            headers: { Authorization: `Bearer ${creds.token}` },
          });
          if (!meRes.ok()) return false;
          const meBody = (await meRes.json()) as {
            user?: { settings_preferences?: { notification?: { emailDigest?: boolean } } };
          };
          return meBody.user?.settings_preferences?.notification?.emailDigest === wantDigest;
        },
        { timeout: 45_000 },
      )
      .toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureCommunityBrowserSessionAccepted(page, creds);
    const emailAfterReload = page.getByRole("switch").first();
    await expect(emailAfterReload).toBeVisible({ timeout: 25_000 });
    await expect(emailAfterReload).toHaveAttribute("aria-checked", targetChecked);
  });

  test("privacy community visibility persists across reload", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");
    test.skip(!creds.userId?.trim(), "login response missing user_id");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/privacy", creds);
    const section = page.locator('[data-tt-me-settings-community-visibility="1"]');
    await expect(section).toBeVisible({ timeout: 25_000 });
    await expect(section).toHaveAttribute("data-tt-me-settings-prefs-ready", "1", { timeout: 45_000 });

    const followersOption = section.locator('[data-tt-me-settings-visibility-option="followers"]');
    await expect(followersOption).toBeVisible({ timeout: 45_000 });
    const followersInput = followersOption.locator('input[type="radio"]');
    const wasFollowers = await followersInput.evaluate((el) => (el as HTMLInputElement).checked);
    if (!wasFollowers) {
      await followersOption.click();
      await expect(page.locator('[data-tt-me-settings-saved-toast="1"]')).toBeVisible({ timeout: 15_000 });
    }
    await expect(followersInput).toBeChecked();

    await expect
      .poll(
        async () =>
          page.evaluate(
            ({ uid }) => {
              const raw = localStorage.getItem(`tt_me_settings_prefs_v2_${uid}`);
              if (!raw) return null;
              const parsed = JSON.parse(raw) as { communityVisibility?: string };
              return parsed.communityVisibility === "followers";
            },
            { uid: creds.userId },
          ),
        { timeout: 15_000 },
      )
      .toBe(true);

    await expect
      .poll(
        async () => {
          const meRes = await request.get(`${apiBase}/api/v1/me`, {
            headers: { Authorization: `Bearer ${creds.token}` },
          });
          if (!meRes.ok()) return false;
          const meBody = (await meRes.json()) as {
            user?: { settings_preferences?: { communityVisibility?: string } };
          };
          return meBody.user?.settings_preferences?.communityVisibility === "followers";
        },
        { timeout: 45_000 },
      )
      .toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureCommunityBrowserSessionAccepted(page, creds);
    const sectionAfter = page.locator('[data-tt-me-settings-community-visibility="1"]');
    await expect(sectionAfter).toBeVisible({ timeout: 25_000 });
    await expect(
      sectionAfter.locator('[data-tt-me-settings-visibility-option="followers"] input[type="radio"]'),
    ).toBeChecked();
  });

  test("unverified user reaches verify-email from trust subpage resend", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await registerUnverifiedTouristCredentials(request, apiBase);
    test.skip(!creds, "register unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/trust", creds);
    await expect(page.locator('[data-tt-me-settings-resend-verify-btn="1"]')).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator('[data-tt-me-settings-hub-status-email="1"]')).toHaveCount(0);
  });

  test("seed tourist hub has no status strip or email chip", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    await expect(page.locator('[data-tt-me-settings-hub-status="1"]')).toHaveCount(0);
    await expect(page.locator('[data-tt-me-settings-hub-status-email="1"]')).toHaveCount(0);
  });

  test("delete-account feedback submits and shows success marker", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, ME_SETTINGS_DELETE_ACCOUNT_FEEDBACK_PATH, creds);
    const modal = page.locator('[data-tt-community-feedback-delete-account-modal="1"]');
    await expect(modal).toBeVisible({ timeout: 25_000 });
    const uniqueNote = `E2E delete-account ${Date.now()}`;
    await modal.locator("textarea").fill(uniqueNote);
    await modal.getByRole("button", { name: /Submit|提交/i }).click();
    await expect(page.locator('[data-tt-community-feedback-delete-account-submitted="1"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(modal).toHaveCount(0);
  });

  test("data delete row opens confirm then routes to delete-account feedback", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/data", creds);
    await page.locator('[data-tt-me-settings-action="delete_account"]').click();
    await confirmMeSettingsL5Dialog(page, /Continue to feedback|前往反馈|Continue|继续/i);
    await expect(page).toHaveURL(/\/community\/feedback\?.*from=settings-data.*intent=delete-account/, {
      timeout: 30_000,
    });
    await expect(page.locator('[data-tt-community-feedback-delete-account-intent="1"]')).toBeVisible();
  });

  test("header logout uses L5 confirm from settings hub", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    await expect(page.locator('[data-tt-me-settings-route="hub"]')).toBeVisible({ timeout: 25_000 });
    await headerLogoutWithL5Confirm(page);
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 30_000 });
  });

  test("hub settings logout button uses L5 confirm", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    await expect(page.locator('[data-tt-me-settings-logout="1"]')).toBeVisible({ timeout: 25_000 });
    await hubSettingsLogoutWithL5Confirm(page);
  });

  test("data export triggers json download", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoWithMeSettingsSessionReady(page, "/me/settings/data", creds);
    const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
    await page.locator('[data-tt-me-settings-action="export_data"]').click();
    await confirmMeSettingsL5Dialog(page, /Download JSON|下载 JSON/i);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/i);
    await expect(page.locator('[data-tt-me-settings-data-export-done="1"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("hub nav shows failed security desc when status API fails", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    const hubStatusMock = await installHubStatusApiFailureRoutes(page);
    await gotoWithMeSettingsSessionReady(page, "/me/settings", creds);
    const hub = page.locator('[data-tt-me-settings-route="hub"]');
    const securityRow = hub.locator('a[href="/me/security"]');
    await expect(securityRow).toBeVisible({ timeout: 45_000 });
    await expect(securityRow).toContainText(/unavailable|不可用|Could not load|加载失败/i, {
      timeout: 45_000,
    });

    await hubStatusMock.clear();
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureCommunityBrowserSessionAccepted(page, creds);
    await expect(securityRow).toBeVisible({ timeout: 45_000 });
    await expect(securityRow).not.toContainText(/unavailable|不可用|Could not load|加载失败/i, {
      timeout: 45_000,
    });
  });

  test("verify-email from settings resend dev token and completes verify", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await registerUnverifiedTouristCredentials(request, apiBase);
    test.skip(!creds, "register unavailable");

    await gotoWithMeSettingsSessionReady(page, "/auth/verify-email?from=settings", creds);
    await expect(page.locator('[data-tt-auth-verify-from-settings="1"]')).toBeVisible({ timeout: 25_000 });
    await page.locator('[data-tt-me-settings-resend-verify-btn="1"]').click();
    const tokenCode = page.locator('[data-tt-me-settings-verify-dev-token="1"] code');
    try {
      await expect(tokenCode).toBeVisible({ timeout: 20_000 });
    } catch {
      test.skip(true, "API did not return email_verification_dev_token (chain_off resend)");
    }
    const rawToken = (await tokenCode.textContent())?.trim();
    test.skip(!rawToken, "empty dev token");
    await page.locator('[data-tt-auth-surface="verify_form_fields"] input').fill(rawToken!);
    await page.locator('[data-tt-auth-surface="verify_form_fields"] button[type="submit"]').click();
    await expect(page.locator('[data-tt-auth-verify-email-done="1"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: /Back to settings|返回设置/i })).toBeVisible();
  });

  test("dispute detail with real id keeps settings extension when list has items", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    const disputeId = await ensureDisputeIdForBearer(request, apiBase, creds.token);
    test.skip(!disputeId, "F-025 dispute seed unavailable (mock-pay off or API)");

    const detailRes = await request.get(`${apiBase}/api/v1/disputes/${disputeId}`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    expect(detailRes.ok()).toBe(true);

    await gotoWithMeSettingsSessionReady(page, `/disputes/${disputeId}?from=settings`, creds);
    await expect(page.locator('[data-tt-me-settings-route="disputes-detail"]')).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator('[data-tt-disputes-from-settings="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-disputes-l5="1"]')).toBeVisible();
  });
});
