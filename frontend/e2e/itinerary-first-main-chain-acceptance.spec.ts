/**
 * ① 本地 · itinerary-first 主链浏览器验收
 * ① 创建行程（无向导）→ 发布 → Escrow「请选择向导」→ 市场 bind → Escrow「确认最终行程」步
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

import {
  bindGuideFromBookGuideModal,
  seedPublishedOpenItineraryOrder,
} from "./helpers/bookGuideItineraryFirst";
import { registerFreshTouristForCorridor } from "./helpers/landingItineraryApiSeed";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const selectGuideRe = /请选择向导|Select guide/i;
const confirmFinalRe = /确认最终行程|Confirm final plan/i;
const bindSelectBtnRe = /^(选择此向导|Select this guide)( — | —|$)/;

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

test.describe("itinerary-first main chain acceptance (① local)", () => {
  test("create无向导 → 请选择向导 → market bind → 确认终版步", async ({ page, request }) => {
    test.setTimeout(360_000);

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

    const creds = await registerFreshTouristForCorridor(request, API_BASE);
    const touristToken = creds.token;
    const touristEmail = creds.email ?? "";
    expect(touristEmail).not.toBe("");
    const orderId = await seedPublishedOpenItineraryOrder(request, API_BASE, touristToken);

    const getRes = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(getRes.ok(), await getRes.text()).toBeTruthy();
    const getBody = (await getRes.json()) as { order?: { guide_id?: string | null } };
    expect(orderGuideIdUnassigned(getBody.order?.guide_id)).toBeTruthy();

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
    await expect(marketLink).toBeVisible({ timeout: 30_000 });
    await marketLink.click();

    await expect(page).toHaveURL(new RegExp(`bindGuideToOrder=${orderId}`), { timeout: 60_000 });
    await expect(page).toHaveURL(/view=guides/, { timeout: 15_000 });

    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({
      timeout: 60_000,
    });

    const guidesRes = await request.get(`${API_BASE}/api/v1/guides`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(guidesRes.ok(), await guidesRes.text()).toBeTruthy();
    const guideItems =
      ((await guidesRes.json()) as { items?: { id?: string }[] }).items ?? [];
    expect(guideItems.length).toBeGreaterThan(0);

    let bindClicked = false;
    for (const g of guideItems) {
      const gid = String(g.id ?? "").trim();
      if (!gid) continue;
      const card = page.getByRole("article").filter({
        has: page.locator(`h3#guide-title-${gid}`),
      });
      if (!(await card.isVisible().catch(() => false))) continue;
      const bindBtn = card.getByRole("button", { name: bindSelectBtnRe });
      if (!(await bindBtn.isVisible().catch(() => false))) continue;
      await bindBtn.scrollIntoViewIfNeeded();
      await bindBtn.click({ timeout: 20_000 });
      bindClicked = true;
      break;
    }
    if (!bindClicked) {
      const fallback = page.getByRole("button", { name: bindSelectBtnRe }).first();
      await expect(fallback).toBeVisible({ timeout: 90_000 });
      await fallback.click({ timeout: 20_000 });
    }

    await expect(
      page.getByRole("dialog", { name: /Book guide|预约向导|更换本单向导|Change guide for this order/i }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await bindGuideFromBookGuideModal(page);

    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

    const getAfterBind = await request.get(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${touristToken}` } },
    );
    expect(getAfterBind.ok()).toBeTruthy();
    const afterBody = (await getAfterBind.json()) as { order?: { guide_id?: string } };
    expect(orderGuideIdUnassigned(afterBody.order?.guide_id)).toBeFalsy();

    await expect(
      page.getByText(/等待向导接单|waiting for.*accept|已选择向导.*等待向导接单/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: confirmFinalRe })).toHaveCount(0);
  });
});
