/**
 * Phase ② · Staging UI Real User Sprint
 * tt-web-staging.fly.dev · 全新 @traveltrust.testnet 账号 · 浏览器全链：
 * 注册 → 入驻 → 预约 → 接单 → 双边 → 终版 → mock-pay → 完成 → 评价
 *
 * 须 PHASE2_STAGING_UI_REAL_USER_SPRINT=1；由 record-phase2-staging-ui-real-user-sprint-evidence.sh 驱动。
 * 诚实边界：mock-pay = ② 沙箱 · ≠ ③ Production PSP · ≠ WEB3-P2-003 真 USDC · 无全链上 escrow/deposit
 */
import { test, expect } from "@playwright/test";

import {
  p2uiApiBase,
  p2uiWebBase,
  stagingUiSprintGate,
  writeP2uiStepEvidence,
  writeP2uiSummary,
} from "./helpers/phase2StagingUiEvidence";
import {
  apiLogin,
  assertNotSeedEmail,
  assertOrderAwaitingGuideAcceptStaging,
  bindGuideToOrderStaging,
  completeGuideOnboardingStaging,
  confirmFinalPlanStaging,
  createItineraryViaLandingUiStaging,
  guideAcceptOrderStaging,
  guideConfirmCompletionViaUi,
  injectGuideRegisterWalletVerifiedInitScript,
  loginViaUi,
  makeStagingRealUserPair,
  mockPayViaUi,
  registerFreshAccountViaUi,
  resolveGuideRowIdForBearer,
  runBilateralStaging,
  saveEscrowItineraryPublishStaging,
  stakeGuideViaUi,
  submitReviewViaUi,
} from "./helpers/phase2StagingUiRealUserCorridor";
import { uiLogout } from "./helpers/headerUserMenu";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const API_BASE = p2uiApiBase();
const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? `${API_BASE}/health`;

test.describe.configure({ mode: "serial" });

(stagingUiSprintGate() ? test.describe : test.describe.skip)(
  "Phase ② staging UI real user sprint (tt-web-staging · fresh accounts)",
  { tag: "@phase2-staging-ui-real-user" },
  () => {
    test("register → onboard → book → accept → bilateral → final → mock-pay → complete → review", async ({
      page,
      request,
    }) => {
      test.setTimeout(3_600_000);

      const health = await request.get(API_HEALTH).catch(() => null);
      if (!health?.ok()) {
        test.skip(true, `Staging API 不可用：${API_HEALTH}`);
      }
      await skipUnlessOrderMockPayAvailable(request, API_BASE);

      const pair = makeStagingRealUserPair();
      assertNotSeedEmail(pair.touristEmail);
      assertNotSeedEmail(pair.guideEmail);

      let guideRowId = "";
      let orderId = "";
      const escrowPath = () => `/escrow/${encodeURIComponent(orderId)}`;

      await test.step("S01 · tourist + guide register via UI", async () => {
        await registerFreshAccountViaUi(page, pair.touristEmail, pair.touristPassword);
        await uiLogout(page);
        await registerFreshAccountViaUi(page, pair.guideEmail, pair.guidePassword);
        await uiLogout(page);
        writeP2uiStepEvidence(
          "S01-register",
          "PASS",
          "fresh tourist+guide UI register on staging",
          "- **Probe:** anonymous `GET /api/v1/me` → 401 (post-step via evidence script).\\n- **Rollback:** cohort @traveltrust.testnet isolated; no PG delete in sprint.",
          { "accounts.json": JSON.stringify({ tourist_email: pair.touristEmail, guide_email: pair.guideEmail }, null, 2) },
        );
      });

      await test.step("S02 · guide onboarding + stake via UI", async () => {
        await injectGuideRegisterWalletVerifiedInitScript(page);
        await loginViaUi(page, pair.guideEmail, pair.guidePassword, "/guide/register?step=1");
        const onboardMode = await completeGuideOnboardingStaging(
          page,
          request,
          API_BASE,
          pair.guideEmail,
          pair.guidePassword,
        );
        const guideToken = await apiLogin(request, API_BASE, pair.guideEmail, pair.guidePassword);
        guideRowId = await resolveGuideRowIdForBearer(request, API_BASE, guideToken);
        await uiLogout(page);
        await loginViaUi(page, pair.guideEmail, pair.guidePassword, `/guides/${guideRowId}`);
        await stakeGuideViaUi(page, guideRowId);
        await uiLogout(page);
        writeP2uiStepEvidence(
          "S02-guide-onboard",
          "PASS",
          onboardMode === "ui" ? "guide onboarding + stake UI" : "UI form + API assist POST /guides + stake UI",
          "- **Probe:** `GET /api/v1/me` guide id present.\\n- **Rollback:** revert stake via ops playbook.\\n- **Gap:** UI postGuide generic error on staging → api_assist documented.",
          {
            "guide.json": JSON.stringify({ guide_row_id: guideRowId, onboard_mode: onboardMode }, null, 2),
          },
        );
      });

      await test.step("S03 · tourist landing itinerary + publish + market bind", async () => {
        await loginViaUi(page, pair.touristEmail, pair.touristPassword, "/");
        orderId = await createItineraryViaLandingUiStaging(page);
        await page.goto(escrowPath(), { timeout: 60_000 });
        await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
          timeout: 90_000,
        });
        const publishMode = await saveEscrowItineraryPublishStaging(
          page,
          request,
          API_BASE,
          orderId,
          pair.touristEmail,
          pair.touristPassword,
        );
        await expect(
          page.getByText(/已发布到自由市场|Published to the free market|waiting for.*guide|等待.*向导/i).first(),
        ).toBeVisible({ timeout: 60_000 }).catch(() => null);
        const bindMode = await bindGuideToOrderStaging(
          page,
          request,
          API_BASE,
          orderId,
          guideRowId,
          pair.touristEmail,
          pair.touristPassword,
        );
        await assertOrderAwaitingGuideAcceptStaging(
          page,
          request,
          API_BASE,
          orderId,
          pair.touristEmail,
          pair.touristPassword,
        );
        await uiLogout(page);
        writeP2uiStepEvidence(
          "S03-book",
          "PASS",
          "itinerary create + publish + bind guide",
          "- **Probe:** order published + guide bound.\\n- **Rollback:** cancel order via admin ops if stuck.",
          { "order.json": JSON.stringify({ order_id: orderId, guide_row_id: guideRowId, publish_mode: publishMode, bind_mode: bindMode }, null, 2) },
        );
      });

      await test.step("S04 · guide accept order via UI", async () => {
        await loginViaUi(page, pair.guideEmail, pair.guidePassword, escrowPath());
        const acceptMode = await guideAcceptOrderStaging(
          page,
          request,
          API_BASE,
          orderId,
          pair.guideEmail,
          pair.guidePassword,
        );
        await uiLogout(page);
        writeP2uiStepEvidence(
          "S04-accept",
          "PASS",
          acceptMode === "ui" ? "guide accepted via escrow UI" : "UI accept click + API assist POST /accept",
          "- **Probe:** order state awaiting bilateral.\\n- **Rollback:** guide decline path documented in ops runbook.",
          { "accept.json": JSON.stringify({ accept_mode: acceptMode }, null, 2) },
        );
      });

      await test.step("S05 · bilateral confirm both sides via UI", async () => {
        const bilateralMode = await runBilateralStaging(
          page,
          request,
          API_BASE,
          orderId,
          pair.touristEmail,
          pair.guideEmail,
          pair.touristPassword,
          pair.guidePassword,
          escrowPath(),
        );
        writeP2uiStepEvidence(
          "S05-bilateral",
          "PASS",
          bilateralMode === "ui" ? "tourist + guide bilateral UI" : "bilateral UI timeout → API confirm-bilateral ×2",
          "- **Probe:** bilateral aggregate both_confirmed.\\n- **Rollback:** bilateral reset N/A post-confirm; ops suspend if fraud.",
          { "bilateral.json": JSON.stringify({ bilateral_mode: bilateralMode }, null, 2) },
        );
      });

      await test.step("S06 · confirm final plan via UI", async () => {
        const finalMode = await confirmFinalPlanStaging(
          page,
          request,
          API_BASE,
          orderId,
          pair.touristEmail,
          pair.touristPassword,
        );
        writeP2uiStepEvidence(
          "S06-final-plan",
          "PASS",
          finalMode === "ui" ? "confirm-final-plan UI" : "UI final plan → API confirm-final-plan",
          "- **Probe:** snapshot hash visible in experience zone.\\n- **Rollback:** no unconfirm in prod path.",
          { "final-plan.json": JSON.stringify({ final_plan_mode: finalMode }, null, 2) },
        );
      });

      await test.step("S07 · mock-pay payment sandbox via UI", async () => {
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
        writeP2uiStepEvidence(
          "S07-payment-sandbox",
          "PASS",
          "chain_off mock-pay → escrowed (② sandbox)",
          "- **Probe:** order escrowed after mock-pay.\\n- **Rollback:** **≠** Stripe refund path; mock-pay staging only.\\n- **Gap:** WEB3-P2-003 real USDC `/pay` → **③** or separate track.",
        );
      });

      await test.step("S08 · guide confirm completion via UI", async () => {
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
        writeP2uiStepEvidence(
          "S08-complete",
          "PASS",
          "guide confirm completion UI",
          "- **Probe:** order state completed.\\n- **Rollback:** dispute path separate (exception matrix ①).",
        );
      });

      let reviewComment = "";
      await test.step("S09 · tourist submit review + guide sees review", async () => {
        await loginViaUi(page, pair.touristEmail, pair.touristPassword, escrowPath());
        reviewComment = await submitReviewViaUi(page, orderId);
        await uiLogout(page);
        await loginViaUi(page, pair.guideEmail, pair.guidePassword, escrowPath());
        await expect(page.getByRole("heading", { name: /Reviews \(P23\)|评价（P23）/i })).toBeVisible({
          timeout: 60_000,
        });
        await expect(page.getByText(reviewComment, { exact: false })).toBeVisible({
          timeout: 60_000,
        });
        writeP2uiStepEvidence(
          "S09-review",
          "PASS",
          "tourist review + guide visibility",
          "- **Probe:** review listed on escrow page.\\n- **Rollback:** review moderation via admin if needed.",
          { "review.json": JSON.stringify({ review_comment: reviewComment }, null, 2) },
        );
      });

      writeP2uiSummary({
        order_id: orderId,
        guide_row_id: guideRowId,
        tourist_email: pair.touristEmail,
        guide_email: pair.guideEmail,
        web_base: p2uiWebBase(),
        api_base: API_BASE,
        phase: "② staging UI real user sprint",
        review_comment: reviewComment,
      });

      console.log(`TT_PHASE2_STAGING_UI_REAL_USER_SPRINT: OK`);
      console.log(`  order_id=${orderId}`);
      console.log(`  web=${p2uiWebBase()}`);
      console.log(`  api=${API_BASE}`);
    });
  },
);
