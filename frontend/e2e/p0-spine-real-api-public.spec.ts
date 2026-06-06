/**
 * P0 主脊（访客 / 公开读 + onboarding）：**真实**浏览器 → API，**无** `page.route` 假 JSON。
 * **会话读路径**（订单列表、`/community/me?tab=`、`/me/security`、`/escrow/:id`）见 **`p0-spine-real-api-session.spec.ts`**。
 * 须 **`traveltrust-api` 可达**（`skipIfApiDown`）。
 * 清单对拍：`frontend/e2e/p0-routes.v1.json`、`docs/runbook/TT-96-20-P0-E2E-LADDER-001.md`。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { requestGetWith429Retry } from "./helpers/playwright429Backoff";
import {
  waitCommunityFeedGet200,
  waitDiscoverOrdersGet200,
  waitGuidesGet200,
  waitOnboardingEntitlementsMeGet200,
  waitOnboardingQuoteGet200,
} from "./helpers/p0RealApiWaits";
import {
  authRouteLoginShell,
  authRouteRegisterShell,
  registerPagePrimaryHeading,
  communityExplorePageShell,
  communityFeedPageShell,
  guidesPageShell,
  marketPageShell,
  meOnboardingPageShell,
} from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke, waitForUrlSmoke } from "./helpers/smoke-nav";

test.describe("P0 spine · auth shells (guest, API up)", () => {
  test("/auth/login · shell", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    await gotoSmoke(page, "/auth/login");
    const loginShell = authRouteLoginShell(page);
    await expect(loginShell).toBeVisible({ timeout: 90_000 });
    await expect(loginShell.getByRole("heading", { name: /Login|登录/i })).toBeVisible();
  });

  test("/auth/register · shell", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    await gotoSmoke(page, "/auth/register");
    const registerShell = authRouteRegisterShell(page);
    await expect(registerShell).toBeVisible({ timeout: 90_000 });
    await expect(registerPagePrimaryHeading(registerShell)).toBeVisible();
  });
});

test.describe("P0 spine · /me/onboarding (quote + entitlements, real GET 200)", () => {
  test("anonymous · GET /onboarding/quote 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const probe = await requestGetWith429Retry(
      request,
      `${apiBase}/api/v1/onboarding/quote?role=provider`,
    ).catch(() => null);
    test.skip(!probe?.ok(), `onboarding quote unreachable (${apiBase})`);
    const pj = (await probe.json()) as { meta?: { implementation_status?: string } };
    const qst = pj?.meta?.implementation_status;
    test.skip(
      qst !== "onboarding_quote_stub" && qst !== "onboarding_quote_with_charge_amount",
      "API quote not stub/stripe-amount mode (skip; not a failure)",
    );

    const wQuote = waitOnboardingQuoteGet200(page);
    await gotoSmoke(page, "/me/onboarding?role=provider&from=identities_hub");
    await wQuote;
    const shell = meOnboardingPageShell(page);
    await expect(shell).toBeVisible({ timeout: 90_000 });
    await expect(shell.getByRole("heading", { level: 1, name: /onboarding|准入/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("session · GET /onboarding/entitlements/me 200", async ({ page, request }) => {
    test.setTimeout(180_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const meProbe = await requestGetWith429Retry(request, `${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" && entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub/db mode (skip; not a failure)",
    );

    const wEnt = waitOnboardingEntitlementsMeGet200(page);
    await gotoWithBearerSession(page, "/me/onboarding", creds);
    await wEnt;
    const shell = meOnboardingPageShell(page);
    await expect(shell).toBeVisible({ timeout: 90_000 });
    await expect(shell.getByRole("heading", { level: 1, name: /onboarding|准入/i })).toBeVisible({
      timeout: 90_000,
    });
    await expect(shell.getByTestId("me-onboarding-create-intent")).toBeVisible();
    await expect(shell.getByTestId("me-onboarding-role-confirm")).toBeVisible();
  });
});

test.describe("P0 spine · public read (real GET 200)", () => {
  test("/market · discover/orders + guides", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    const w1 = waitDiscoverOrdersGet200(page);
    const w2 = waitGuidesGet200(page);
    await gotoSmoke(page, "/market");
    await Promise.all([w1, w2]);
    const shell = marketPageShell(page);
    await expect(shell).toBeVisible({ timeout: 90_000 });
    await expect(shell.getByRole("heading", { name: /Market|自由市场/i })).toBeVisible({ timeout: 90_000 });
  });

  test("/discover · redirects to /market + discover/orders + guides GET 200", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    const w1 = waitDiscoverOrdersGet200(page);
    const w2 = waitGuidesGet200(page);
    await gotoSmoke(page, "/discover");
    await waitForUrlSmoke(page, "**/market", { timeout: 90_000 });
    await Promise.all([w1, w2]);
    const shell = marketPageShell(page);
    await expect(shell).toBeVisible({ timeout: 90_000 });
    await expect(shell.getByRole("heading", { name: /Market|自由市场/i })).toBeVisible({ timeout: 90_000 });
  });

  test("/guides · GET /api/v1/guides 200", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    const w = waitGuidesGet200(page);
    await gotoSmoke(page, "/guides");
    await w;
    const shell = guidesPageShell(page);
    await expect(shell).toBeVisible({ timeout: 90_000 });
    await expect(shell.getByRole("heading", { name: /Guides|向导列表/i })).toBeVisible({ timeout: 90_000 });
  });

  test("/community · feed", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    const w = waitCommunityFeedGet200(page);
    await gotoSmoke(page, "/community");
    await w;
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expect(feedShell.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("/community/explore · feed (recommend)", async ({ page, request }) => {
    test.setTimeout(120_000);
    await skipIfApiDown(request);
    const w = waitCommunityFeedGet200(page);
    await gotoSmoke(page, "/community/explore");
    await w;
    const exploreShell = communityExplorePageShell(page);
    await expect(exploreShell).toBeVisible({ timeout: 90_000 });
    await expect(exploreShell.getByRole("heading", { name: /Explore|发现/i })).toBeVisible({ timeout: 90_000 });
  });
});
