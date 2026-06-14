/**
 * ① 本地 · GD/P06 + P03–P06 主链（itinerary-first · 公众 catalog 杭州向导）
 * 双边确认 → 终版 snapshot → mock-pay/托管 → `/guides/[id]` 日历变红 → 完成/取消释放变白
 */
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

import {
  assertGuideScheduleBusyForRange,
  confirmFinalPlanAndExpectSnapshot,
  getOccupiedRanges,
  mockPayExpectEscrowed,
  rangeCoversOrder,
  seedP03P04CorridorWithTripDates,
  uiLogout,
} from "./helpers/escrowP05P06Corridor";
import { releasePublicCatalogHangzhouGuideSlotIfBlocked } from "./helpers/publicCatalogHangzhouGuide";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";
import { seedTrustGateE2eFixtures } from "./helpers/trustGateE2eFixtures";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const confirmOffChainRe = /Confirm completion \(off-chain\)|确认完成（链下）/;
const fundedRe = /Funded · awaiting fulfillment|已入金·待履约/;
const snapshotHashRe = /快照哈希：|SnapshotHash:/i;

async function gotoLoginWhenReady(page: import("@playwright/test").Page, loginHref: string) {
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

test.describe.configure({ mode: "serial" });

test.describe("GD/P06 + P03–P06 public catalog escrow main chain (① local)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("escrowed 后 /guides 日历变红 → 确认完成释放变白", async ({ page, request }) => {
    test.setTimeout(600_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) test.skip(true, `API 不可用：${API_HEALTH}`);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);

    await seedTrustGateE2eFixtures(request, API_BASE);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await releasePublicCatalogHangzhouGuideSlotIfBlocked(request, API_BASE);

    const corridor = await seedP03P04CorridorWithTripDates(page, request, API_BASE);
    const { orderId, touristToken, touristEmail, guideId, guideEmail, escrowPath, tripDates } =
      corridor;

    const snap = await confirmFinalPlanAndExpectSnapshot(
      request,
      API_BASE,
      orderId,
      touristToken,
    );
    expect(snap.length).toBeGreaterThan(10);

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
    await expect(page.locator("#escrow-after-final-plan")).toBeAttached({ timeout: 30_000 });
    await expect(page.locator("main").getByText(snapshotHashRe).first()).toBeVisible({
      timeout: 30_000,
    });

    const payUrl = `/pay?orderId=${encodeURIComponent(orderId)}`;
    await page.goto(payUrl, { timeout: 60_000 });
    const payRoot = page.locator('[data-tt-pay-root="1"]');
    const mockPayBtn = page.locator('[data-tt-pay-mock-pay-submit="1"]');
    let uiMockVisible = false;
    try {
      await expect(payRoot).toHaveAttribute("data-tt-pay-order-fetch-phase", "ready", {
        timeout: 90_000,
      });
      uiMockVisible = await mockPayBtn.isVisible({ timeout: 15_000 }).catch(() => false);
    } catch {
      uiMockVisible = false;
    }
    if (uiMockVisible) {
      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes(`/api/v1/orders/${orderId}/mock-pay`) &&
            res.request().method() === "POST" &&
            res.ok(),
          { timeout: 45_000 },
        ),
        mockPayBtn.click(),
      ]);
      await expect(
        page.getByText(/Simulated deposit recorded|模拟入金已登记/i).first(),
      ).toBeVisible({ timeout: 20_000 });
    } else {
      await mockPayExpectEscrowed(request, API_BASE, orderId, touristToken);
    }
    await page.goto(escrowPath, { timeout: 60_000 });
    await expect(page.locator("main").getByText(fundedRe).first()).toBeVisible({
      timeout: 40_000,
    });

    await expect
      .poll(async () => {
        const ranges = await getOccupiedRanges(request, API_BASE, guideId, touristToken);
        return rangeCoversOrder(ranges, orderId, tripDates.start, tripDates.end);
      }, { timeout: 30_000 })
      .toBe(true);
    await assertGuideScheduleBusyForRange(page, guideId, tripDates.start, tripDates.end, true);

    await uiLogout(page);
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(guideEmail);
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(escrowPath, { timeout: 60_000 });
    await expect(page.locator("main").getByText(fundedRe).first()).toBeVisible({
      timeout: 40_000,
    });
    const confirmBtn = page.getByRole("button", { name: confirmOffChainRe });
    await expect(confirmBtn).toBeVisible({ timeout: 25_000 });
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/orders/${orderId}/confirm-completion`) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 45_000 },
      ),
      confirmBtn.click(),
    ]);

    await expect
      .poll(async () => {
        const ranges = await getOccupiedRanges(request, API_BASE, guideId, touristToken);
        return !rangeCoversOrder(ranges, orderId, tripDates.start, tripDates.end);
      }, { timeout: 30_000 })
      .toBe(true);
    await assertGuideScheduleBusyForRange(page, guideId, tripDates.start, tripDates.end, false);
  });

  test("Accepted 占用日历变红 → 取消释放变白", async ({ page, request }) => {
    test.setTimeout(420_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) test.skip(true, `API 不可用：${API_HEALTH}`);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    await seedTrustGateE2eFixtures(request, API_BASE);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await releasePublicCatalogHangzhouGuideSlotIfBlocked(request, API_BASE);

    const corridor = await seedP03P04CorridorWithTripDates(page, request, API_BASE);
    const { orderId, touristToken, touristEmail, guideId, escrowPath, tripDates } = corridor;

    await confirmFinalPlanAndExpectSnapshot(request, API_BASE, orderId, touristToken);

    await expect
      .poll(async () => {
        const ranges = await getOccupiedRanges(request, API_BASE, guideId, touristToken);
        return rangeCoversOrder(ranges, orderId, tripDates.start, tripDates.end);
      }, { timeout: 30_000 })
      .toBe(true);
    await assertGuideScheduleBusyForRange(page, guideId, tripDates.start, tripDates.end, true);

    const cancelRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        headers: {
          Authorization: `Bearer ${touristToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        data: {},
      },
    );
    expect(cancelRes.ok(), await cancelRes.text()).toBeTruthy();

    await expect
      .poll(async () => {
        const ranges = await getOccupiedRanges(request, API_BASE, guideId, touristToken);
        return !rangeCoversOrder(ranges, orderId, tripDates.start, tripDates.end);
      }, { timeout: 30_000 })
      .toBe(true);
    await assertGuideScheduleBusyForRange(page, guideId, tripDates.start, tripDates.end, false);

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
    await expect(page.locator("main").getByText(/Cancelled|已取消/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
