/**
 * ① 本地 · P03/P04 主链接入（itinerary-first Escrow）
 * 发布无向导 → 市场 bind → 待向导接单（确认终版不可用）→ 向导接单 → 双边确认 → 确认终版可用
 */
import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

import {
  bindGuideFromBookGuideModal,
  seedPublishedOpenItineraryOrder,
} from "./helpers/bookGuideItineraryFirst";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { uiLogout } from "./helpers/headerUserMenu";
import { registerFreshTouristForCorridor } from "./helpers/landingItineraryApiSeed";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const selectGuideRe = /请选择向导|Select guide/i;
const waitGuideAcceptRe =
  /等待向导接单|waiting for.*accept|已选择向导.*等待向导接单|Guide linked · waiting/i;
const confirmFinalRe = /确认最终行程|Confirm final plan/i;
const bindSelectBtnRe = /^(选择此向导|Select this guide)( — | —|$)/;
const bilateralRe =
  /待双边确认|Awaiting bilateral|双边确认|Bilateral confirm|向导已接单 · 待双边|请双方完成双边确认/i;
const bilateralBtnRe = /确认行程与金额|Confirm itinerary and amount/i;

async function gotoLoginWhenReady(page: Page, loginHref: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(loginHref, { timeout: 60_000 });
    const emailBox = page.getByRole("textbox", { name: /email|邮箱/i });
    try {
      await emailBox.waitFor({ state: "visible", timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2) throw new Error("login page did not become ready");
    }
  }
}

function orderGuideIdUnassigned(guideId: unknown): boolean {
  const s = String(guideId ?? "").trim();
  return !s || s === "00000000-0000-0000-0000-000000000000";
}

test.describe("P03/P04 itinerary-first escrow main chain (① local)", () => {
  test("bind 后须接单+双边确认才可确认终版", async ({ page, request }) => {
    test.setTimeout(420_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);

    await releaseSeedGuideSlotIfBlocked(request, API_BASE);

    const seedGuideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    if (!seedGuideId) {
      test.skip(true, "无向导 seed：guide@test GET /me 无 guide.id");
    }

    const creds = await registerFreshTouristForCorridor(request, API_BASE);
    const touristToken = creds.token;
    const touristEmail = creds.email ?? "";
    expect(touristEmail).not.toBe("");
    const orderId = await seedPublishedOpenItineraryOrder(request, API_BASE, touristToken);
    const escrowPath = `/escrow/${encodeURIComponent(orderId)}`;

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(touristEmail);
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
    await expect(page.getByText(selectGuideRe).first()).toBeVisible({ timeout: 60_000 });

    const marketLink = page
      .getByRole("link", { name: /前往自由市场选向导|请选择向导|Go to.*market.*guide/i })
      .first();
    await marketLink.click();
    await expect(page).toHaveURL(new RegExp(`bindGuideToOrder=${orderId}`), { timeout: 60_000 });

    let bindClicked = false;
    for (const gid of [seedGuideId]) {
      if (!gid) continue;
      const card = page.getByRole("article").filter({
        has: page.locator(`h3#guide-title-${gid}`),
      });
      if (!(await card.isVisible().catch(() => false))) continue;
      const bindBtn = card.getByRole("button", { name: bindSelectBtnRe });
      if (!(await bindBtn.isVisible().catch(() => false))) continue;
      await bindBtn.click({ timeout: 20_000 });
      bindClicked = true;
      break;
    }
    if (!bindClicked) {
      await page.getByRole("button", { name: bindSelectBtnRe }).first().click({ timeout: 20_000 });
    }

    await expect(
      page.getByRole("dialog", { name: /Book guide|预约向导|更换本单向导|Change guide for this order/i }),
    ).toBeVisible({ timeout: 60_000 });
    await bindGuideFromBookGuideModal(page);
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

    let getAfterBind = await request.get(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${touristToken}` } },
    );
    let afterBody = (await getAfterBind.json()) as {
      order?: { guide_id?: string; state?: string };
    };
    expect(orderGuideIdUnassigned(afterBody.order?.guide_id)).toBeFalsy();
    if (String(afterBody.order?.guide_id ?? "").trim() !== seedGuideId) {
      let patched = false;
      for (let attempt = 0; attempt < 3 && !patched; attempt++) {
        const patchRes = await request.patch(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/guide`,
          {
            headers: {
              Authorization: `Bearer ${touristToken}`,
              "Content-Type": "application/json",
              "Idempotency-Key": randomUUID(),
            },
            data: { guide_id: seedGuideId },
          },
        );
        if (patchRes.ok()) {
          patched = true;
          break;
        }
        const errText = await patchRes.text();
        if (errText.includes("rate_limit") && attempt < 2) {
          await page.waitForTimeout(61_000);
          continue;
        }
        expect(patchRes.ok(), errText).toBeTruthy();
      }
      await page.goto(escrowPath, { timeout: 60_000 });
      getAfterBind = await request.get(
        `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
        { headers: { Authorization: `Bearer ${touristToken}` } },
      );
      afterBody = (await getAfterBind.json()) as {
        order?: { guide_id?: string; state?: string };
      };
    }
    expect(String(afterBody.order?.guide_id ?? "").trim()).toBe(seedGuideId);
    expect(String(afterBody.order?.state ?? "").toLowerCase()).toBe("created");

    await expect
      .poll(async () => {
        const res = await request.get(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
          { headers: { Authorization: `Bearer ${touristToken}` } },
        );
        if (!res.ok()) return false;
        const body = (await res.json()) as { order?: { guide_id?: string; state?: string } };
        return (
          String(body.order?.guide_id ?? "").trim() === seedGuideId &&
          String(body.order?.state ?? "").toLowerCase() === "created"
        );
      }, { timeout: 60_000 })
      .toBe(true);

    await page.reload();
    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 90_000,
    });
    await expect(
      page.getByRole("region", { name: /已选向导|Selected guide/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(selectGuideRe)).toHaveCount(0);
    await expect(page.getByText(waitGuideAcceptRe).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: confirmFinalRe })).toHaveCount(0);

    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    const guideLoginApi = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "guide@test.com", password: "Test123!" },
    });
    expect(guideLoginApi.ok()).toBeTruthy();
    const guideApiToken = ((await guideLoginApi.json()) as { token?: string }).token?.trim() ?? "";

    await page.goto(escrowPath, { timeout: 60_000 });
    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 90_000,
    });
    await page
      .getByRole("main")
      .getByRole("button", { name: /接单|^Accept$/i })
      .first()
      .click({ timeout: 60_000 });
    await expect
      .poll(async () => {
        const r = await request.get(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
          { headers: { Authorization: `Bearer ${guideApiToken}` } },
        );
        if (!r.ok()) return false;
        const body = (await r.json()) as { order?: { state?: string; sub_status?: string } };
        return (
          String(body.order?.state ?? "").toLowerCase() === "accepted" &&
          String(body.order?.sub_status ?? "").includes("bilateral")
        );
      }, { timeout: 60_000 })
      .toBe(true);
    await page.reload();
    await expect(page.locator("main").getByText(bilateralRe).first()).toBeVisible({
      timeout: 45_000,
    });

    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(touristEmail);
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(escrowPath, { timeout: 60_000 });
    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 90_000,
    });
    const bilateralSection = page
      .getByRole("main")
      .getByRole("heading", { name: /双边确认|Bilateral confirmation/i })
      .first();
    await expect(bilateralSection).toBeVisible({ timeout: 60_000 });
    const touristBilateralBtn = bilateralSection
      .locator("xpath=ancestor::section[1]")
      .getByRole("button", { name: bilateralBtnRe });
    await expect(touristBilateralBtn).toBeVisible({ timeout: 15_000 });
    const touristBiRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-bilateral`,
      {
        headers: {
          Authorization: `Bearer ${touristToken}`,
          "Idempotency-Key": randomUUID(),
        },
      },
    );
    expect(touristBiRes.ok(), await touristBiRes.text()).toBeTruthy();
    await expect(page.locator("main").getByText(bilateralRe).first()).toBeVisible({
      timeout: 20_000,
    });

    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(escrowPath, { timeout: 60_000 });
    const bilateralSectionGuide = page
      .getByRole("main")
      .getByRole("heading", { name: /双边确认|Bilateral confirmation/i })
      .first();
    await expect(bilateralSectionGuide).toBeVisible({ timeout: 60_000 });
    const guideBilateralBtn = bilateralSectionGuide
      .locator("xpath=ancestor::section[1]")
      .getByRole("button", { name: bilateralBtnRe });
    await expect(guideBilateralBtn).toBeVisible({ timeout: 15_000 });
    const guideBiRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-bilateral`,
      {
        headers: {
          Authorization: `Bearer ${guideApiToken}`,
          "Idempotency-Key": randomUUID(),
        },
      },
    );
    expect(guideBiRes.ok(), await guideBiRes.text()).toBeTruthy();
    await expect
      .poll(async () => {
        const fin = await request.get(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
          { headers: { Authorization: `Bearer ${touristToken}` } },
        );
        if (!fin.ok()) return false;
        const body = (await fin.json()) as {
          order?: {
            state?: string;
            sub_status?: string;
            guide_confirmed?: boolean;
            tourist_confirmed?: boolean;
          };
        };
        return (
          String(body.order?.state ?? "").toLowerCase() === "accepted" &&
          body.order?.sub_status === "confirmed" &&
          body.order?.guide_confirmed === true &&
          body.order?.tourist_confirmed === true
        );
      }, { timeout: 30_000 })
      .toBe(true);
  });
});
