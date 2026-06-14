/**
 * `/me/identities` 核心身份 Hub · provider/steward 细粒度阶段回归（① 本地 · route mock）。
 *
 * 覆盖：待支付 · 待确认 · 已开通（provider）；主理人待付费 → 工作台 A 轨 · 已开通 → governance。
 *
 * 本地：`PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/me-identities-core-hub.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  injectBearerSessionInPage,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  installMeIdentitiesHubApiMocks,
  providerCoreCard,
  stewardCoreCard,
  waitForCoreCardPhase,
} from "./helpers/meIdentitiesHubMocks";

test.describe("/me/identities · core identity hub phases", () => {
  test.describe.configure({ timeout: 120_000 });

  async function gotoIdentitiesHubLoggedIn(
    page: import("@playwright/test").Page,
    creds: { token: string; userId?: string },
    scenario: import("./helpers/meIdentitiesHubMocks").MeIdentitiesHubMockScenario,
  ) {
    await installMeIdentitiesHubApiMocks(page, scenario);
    await gotoWithBearerSession(page, "/me/identities", creds);
    await injectBearerSessionInPage(page, creds);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("traveltrust:profile-updated"));
    });
  }

  test.beforeEach(async ({ request }) => {
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), `API unreachable (${apiBase})`);
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  });

  test("provider card: payment_pending → onboarding admission fee CTA", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoIdentitiesHubLoggedIn(page, creds, "provider_payment_pending");
    await waitForCoreCardPhase(page, "provider", "payment_pending");

    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 90_000,
    });

    const card = providerCoreCard(page);
    await expect(card).toHaveAttribute("data-tt-me-identities-core-phase", "payment_pending", {
      timeout: 30_000,
    });
    await expect(card).toHaveAttribute("href", /\/me\/onboarding\?role=provider/);
    await expect(card.getByText(/完成准入费|Complete admission fee/i)).toBeVisible();
    await expect(card.getByText(/待支付|Awaiting payment/i)).toBeVisible();
  });

  test("provider card: confirm_pending → role confirm CTA", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoIdentitiesHubLoggedIn(page, creds, "provider_confirm_pending");
    await waitForCoreCardPhase(page, "provider", "confirm_pending");

    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 90_000,
    });

    const card = providerCoreCard(page);
    await expect(card).toHaveAttribute("data-tt-me-identities-core-phase", "confirm_pending", {
      timeout: 30_000,
    });
    await expect(card).toHaveAttribute("href", /\/me\/onboarding\?role=provider/);
    await expect(card.getByText(/确认身份|Confirm identity/i)).toBeVisible();
    await expect(card.getByText(/待确认|Awaiting confirmation/i)).toBeVisible();
  });

  test("provider card: active → market provider workspace", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoIdentitiesHubLoggedIn(page, creds, "provider_active");
    await waitForCoreCardPhase(page, "provider", "active");

    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 90_000,
    });

    const card = providerCoreCard(page);
    await expect(card).toHaveAttribute("data-tt-me-identities-core-phase", "active", { timeout: 30_000 });
    await expect(card).toHaveAttribute("href", "/provider");
    await expect(card.getByText(/进入工作台|Open workspace/i)).toBeVisible();
    await expect(card.getByText(/已开通|Active/i)).toBeVisible();
  });

  test("steward card: payment_pending → workbench Track A admission", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoIdentitiesHubLoggedIn(page, creds, "steward_payment_pending");
    await waitForCoreCardPhase(page, "steward", "payment_pending");

    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 90_000,
    });

    const card = stewardCoreCard(page);
    await expect(card).toHaveAttribute("data-tt-me-identities-core-phase", "payment_pending", {
      timeout: 30_000,
    });
    await expect(card).toHaveAttribute("href", /\/governance\?view=region.*steward-b-track-admission/);
    await expect(card.getByText(/完成准入费|Complete admission fee/i)).toBeVisible();
    await expect(card.getByText(/待支付|Awaiting payment/i)).toBeVisible();
  });

  test("steward card: active → governance region view (not /steward/register)", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable");

    await gotoIdentitiesHubLoggedIn(page, creds, "steward_active");
    await waitForCoreCardPhase(page, "steward", "active");

    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 90_000,
    });

    const card = stewardCoreCard(page);
    await expect(card).toHaveAttribute("data-tt-me-identities-core-phase", "active", { timeout: 30_000 });
    await expect(card).toHaveAttribute("href", "/governance?view=region");
    await expect(card).not.toHaveAttribute("href", /\/steward\/register/);
    await expect(card.getByText(/进入工作台|Open workspace/i)).toBeVisible();
  });
});
