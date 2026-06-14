/**
 * ① Real User Acceptance Sprint
 * 禁止 seed / fixture / trust-gate 账号 — 全新注册游客与向导 UI 全链：
 * 注册 → 入驻 → 市场发现 → 预约 → 接单 → 双边确认 → 终版 → 托管 → 完成 → 评价
 */
import { test, expect } from "@playwright/test";

import {
  apiLogin,
  assertNotSeedEmail,
  bindFreshGuideFromMarketUi,
  clickConfirmFinalPlanInExperience,
  completeGuideOnboardingViaUi,
  createItineraryViaLandingUi,
  guideConfirmCompletionViaUi,
  loginViaUi,
  makeRealUserPair,
  mockPayViaUi,
  registerFreshAccountViaUi,
  resolveGuideRowIdForBearer,
  runBilateralUiBothSides,
  saveEscrowItineraryPublish,
  snapshotHashRe,
  stakeGuideViaUi,
  submitReviewViaUi,
} from "./helpers/realUserAcceptanceCorridor";
import { uiLogout } from "./helpers/headerUserMenu";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe.configure({ mode: "serial" });

test.describe("Real user acceptance sprint (① local · no seed accounts)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("register → onboard → market → book → bilateral → final → escrow → complete → review", async ({
    page,
    request,
  }) => {
    test.setTimeout(1_800_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }
    await skipUnlessOrderMockPayAvailable(request, API_BASE);

    const pair = makeRealUserPair();
    assertNotSeedEmail(pair.touristEmail);
    assertNotSeedEmail(pair.guideEmail);

    // —— 1. 注册（UI）——
    await test.step("tourist register via UI", async () => {
      await registerFreshAccountViaUi(page, pair.touristEmail, pair.touristPassword);
      await uiLogout(page);
    });

    await test.step("guide account register via UI (traveler form; onboarding at /guide/register)", async () => {
      await registerFreshAccountViaUi(page, pair.guideEmail, pair.guidePassword);
      await uiLogout(page);
    });

    // —— 2. 向导入驻 + 质押（UI）——
    let guideRowId = "";
    await test.step("guide onboarding via /guide/register", async () => {
      await loginViaUi(page, pair.guideEmail, pair.guidePassword, "/guide/register?step=1");
      await completeGuideOnboardingViaUi(page);
      const guideToken = await apiLogin(request, API_BASE, pair.guideEmail, pair.guidePassword);
      guideRowId = await resolveGuideRowIdForBearer(request, API_BASE, guideToken);
      await uiLogout(page);
    });

    await test.step("guide stake via UI", async () => {
      await loginViaUi(page, pair.guideEmail, pair.guidePassword, `/guides/${guideRowId}`);
      await stakeGuideViaUi(page, guideRowId);
      await uiLogout(page);
    });

    // —— 3. 游客创建行程 + 发布（UI）——
    let orderId = "";
    const escrowPath = () => `/escrow/${encodeURIComponent(orderId)}`;

    await test.step("tourist landing itinerary + publish", async () => {
      await loginViaUi(page, pair.touristEmail, pair.touristPassword, "/");
      orderId = await createItineraryViaLandingUi(page);
      await page.goto(escrowPath(), { timeout: 60_000 });
      await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
        timeout: 90_000,
      });
      await saveEscrowItineraryPublish(page);
      await expect(page.getByText(/已发布到自由市场|Published to the free market/i).first()).toBeVisible({
        timeout: 60_000,
      });
      await uiLogout(page);
    });

    // —— 4. 市场发现 + 预约绑定向导（UI）——
    await test.step("market discovery + book fresh guide", async () => {
      await loginViaUi(page, pair.touristEmail, pair.touristPassword, escrowPath());
      await bindFreshGuideFromMarketUi(page, orderId, guideRowId);
      await expect(page.getByText(/等待向导接单|waiting for.*accept/i).first()).toBeVisible({
        timeout: 60_000,
      });
      await uiLogout(page);
    });

    // —— 5. 向导接单（UI）——
    await test.step("guide accept order", async () => {
      await loginViaUi(page, pair.guideEmail, pair.guidePassword, escrowPath());
      await page
        .getByRole("main")
        .getByRole("button", { name: /接单|^Accept$/i })
        .first()
        .click({ timeout: 60_000 });
      await expect(page.getByText(/待双边确认|Awaiting bilateral|双边确认/i).first()).toBeVisible({
        timeout: 60_000,
      });
      await uiLogout(page);
    });

    // —— 6. 双边确认（UI · 双角色）——
    await test.step("bilateral confirm both sides via UI", async () => {
      await runBilateralUiBothSides(page, pair.touristEmail, pair.guideEmail, escrowPath());
    });

    // —— 7. 确认最终行程（UI）——
    await test.step("confirm final plan via UI", async () => {
      await loginViaUi(page, pair.touristEmail, pair.touristPassword, escrowPath());
      await clickConfirmFinalPlanInExperience(page);
      await expect(page.locator("main").getByText(snapshotHashRe).first()).toBeVisible({
        timeout: 60_000,
      });
      await uiLogout(page);
    });

    // —— 8. 模拟托管入金（UI）——
    await test.step("mock-pay escrow", async () => {
      const payUrl = `/pay?orderId=${encodeURIComponent(orderId)}`;
      await loginViaUi(page, pair.touristEmail, pair.touristPassword, payUrl);
      await expect(page).toHaveURL(new RegExp(`/pay`), { timeout: 60_000 });
      const touristToken = await apiLogin(request, API_BASE, pair.touristEmail, pair.touristPassword);
      await mockPayViaUi(page, orderId, {
        request,
        apiBase: API_BASE,
        touristToken,
        skipGoto: true,
      });
      await uiLogout(page);
    });

    // —— 9. 向导确认完成（UI）——
    await test.step("guide confirm completion", async () => {
      await loginViaUi(page, pair.guideEmail, pair.guidePassword, escrowPath());
      await guideConfirmCompletionViaUi(
        page,
        request,
        API_BASE,
        orderId,
        pair.guideEmail,
        pair.guidePassword,
        escrowPath(),
      );
      await uiLogout(page);
    });

    // —— 10. 评价（UI）+ 向导可见 ——
    let reviewComment = "";
    await test.step("tourist submit review", async () => {
      await loginViaUi(page, pair.touristEmail, pair.touristPassword, escrowPath());
      reviewComment = await submitReviewViaUi(page, orderId);
      await uiLogout(page);
    });

    await test.step("guide sees review on escrow", async () => {
      await loginViaUi(page, pair.guideEmail, pair.guidePassword, escrowPath());
      await expect(page.getByRole("heading", { name: /Reviews \(P23\)|评价（P23）/i })).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByText(reviewComment, { exact: false })).toBeVisible({
        timeout: 60_000,
      });
    });
  });
});
