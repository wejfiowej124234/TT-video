/**
 * GUIDE-ONBOARDING-STEP3-P0-DEBUG
 * ① local · 真实用户账号 · 仅锁定向导入驻 Step3（非全链回归）
 */
import { test, expect } from "@playwright/test";

import {
  attachGuideStep3NetworkTap,
  fillGuideRegisterSteps1And2ViaUi,
  logGuideStep3DebugState,
  prepareFreshGuideAccountForStep3,
} from "./helpers/guideOnboardingStep3Debug";
import { apiLogin, resolveGuideRowIdForBearer } from "./helpers/realUserAcceptanceCorridor";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("GUIDE-ONBOARDING-STEP3-P0-DEBUG @guide-onboarding-step3", () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(300_000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const target = `${baseURL ?? "http://127.0.0.1:3012"}/guide/register?step=1`;
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 240_000 });
    await ctx.close();
  });

  test("fresh account · step3 pre-submit debug · UI submit → POST /api/v1/guides", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const t0 = Date.now();
    const mark = (label: string) => {
      // eslint-disable-next-line no-console
      console.log(`[step3-debug] ${label} +${Date.now() - t0}ms`);
    };

    const { guideEmail, guidePassword } = await prepareFreshGuideAccountForStep3(
      page,
      request,
      API_BASE,
    );
    mark("after-prepare");

    await fillGuideRegisterSteps1And2ViaUi(page);
    mark("after-fill-steps-1-2");

    const tap = attachGuideStep3NetworkTap(page);

    const form = page.locator('[data-tt-guide-register-form="1"]');
    const preSnap = await logGuideStep3DebugState(page, "pre-agree", tap.events);
    mark("after-pre-agree-snapshot");
    expect(preSnap, "step3 debug attr missing").not.toBeNull();
    expect(preSnap?.submitDisabledReasons.agreePrivacyMissing).toBe(true);

    const agreeBox = page.locator(
      '[data-tt-guide-register-agree-wrap="1"] [role="checkbox"]',
    );
    await agreeBox.click({ force: true, timeout: 30_000 });
    mark("after-agree-click");
    await expect(agreeBox).toHaveAttribute("aria-checked", "true", { timeout: 15_000 });

    const postAgreeSnap = await logGuideStep3DebugState(page, "post-agree", tap.events);
    mark("after-post-agree-snapshot");
    expect(postAgreeSnap?.submitDisabled, JSON.stringify(postAgreeSnap?.submitDisabledReasons)).toBe(
      false,
    );
    expect(postAgreeSnap?.postGuideWillFire).toBe(true);
    expect(postAgreeSnap?.validation.step1Field).toBeNull();
    expect(postAgreeSnap?.validation.step2Field).toBeNull();
    expect(postAgreeSnap?.upload.idPhotoFileName).toBeTruthy();

    const submitBtn = form.locator('[data-tt-guide-register-submit="1"]');
    await expect(submitBtn).toBeEnabled();

    const uploadWait = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/guides/upload-doc") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 120_000 },
    );
    const postGuideWait = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/guides") &&
        !res.url().includes("upload-doc") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 120_000 },
    );

    await submitBtn.click();
    mark("after-submit-click");

    try {
      await Promise.all([uploadWait, postGuideWait]);
    } catch (err) {
      await logGuideStep3DebugState(page, "post-submit-fail", tap.events);
      mark("after-submit-fail-snapshot");
      throw err;
    }
    mark("after-submit-responses");

    await expect(
      page.getByText(/向导注册已提交|Guide registration submitted|guideRegister_doneMessage/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    mark("after-done-panel");

    const uploadHit = tap.events.some((e) => e.phase === "upload-doc" && e.ok);
    const postHit = tap.events.some((e) => e.phase === "post-guides" && e.ok);
    expect(uploadHit, `expected upload-doc POST; got ${JSON.stringify(tap.events)}`).toBe(true);
    expect(postHit, `expected POST /api/v1/guides; got ${JSON.stringify(tap.events)}`).toBe(true);

    tap.dispose();

    const token = await apiLogin(request, API_BASE, guideEmail, guidePassword);
    const guideRowId = await resolveGuideRowIdForBearer(request, API_BASE, token);
    expect(guideRowId.length).toBeGreaterThan(10);
  });
});
