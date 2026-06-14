/**
 * ① Guide Workbench Inbox L5 · 双角色浏览器走廊（tourist+guide 种子链 B）
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./guideSeedGuideRowId";

export const guideWorkbenchInboxAriaRe =
  /预约与待办收件箱|Bookings and tasks inbox/i;
export const guideWorkbenchEnterAcceptRe =
  /进入订单接单|Open order to accept/i;
export const bilateralRe =
  /待双边确认|Awaiting bilateral|双边确认|Bilateral confirm|向导已接单 · 待双边|请双方完成双边确认/i;

export async function patchBindSeedGuideToOrder(
  request: APIRequestContext,
  apiBase: string,
  touristToken: string,
  orderId: string,
  guideRowId: string,
): Promise<void> {
  const patchRes = await request.patch(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/guide`,
    {
      headers: {
        Authorization: `Bearer ${touristToken}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      data: { guide_id: guideRowId },
    },
  );
  expect(patchRes.ok(), await patchRes.text()).toBeTruthy();
}

export async function resolveSeedGuideRowId(
  request: APIRequestContext,
  apiBase: string,
): Promise<string> {
  const id = await guideRowIdForSeedGuideAccount(request, apiBase);
  expect(id, "guide@test guide.id").toBeTruthy();
  return id!;
}

export function guideWorkbenchInboxLocator(page: Page) {
  return page.locator('[data-tt-guide-workbench-inbox="1"]');
}

/** 首屏收件箱 · 待接单计数（`.text-ref-sun` 为待接单数字） */
export async function expectGuideWorkbenchPendingAcceptCount(
  page: Page,
  count: number,
): Promise<void> {
  const inbox = guideWorkbenchInboxLocator(page);
  await expect(inbox).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(async () => (await inbox.locator(".text-ref-sun").first().textContent())?.trim(), {
      timeout: 90_000,
    })
    .toBe(String(count));
}

export async function clickGuideWorkbenchEnterOrderAccept(page: Page): Promise<void> {
  const inbox = guideWorkbenchInboxLocator(page);
  await inbox.getByRole("link", { name: guideWorkbenchEnterAcceptRe }).click({ timeout: 30_000 });
}
