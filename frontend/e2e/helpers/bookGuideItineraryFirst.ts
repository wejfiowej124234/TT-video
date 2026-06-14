import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { seedLandingPreviewOrderViaApi } from "./landingItineraryApiSeed";

/** POST /itineraries + PATCH publish → `created` 无向导本单（与 market bind 同源） */
export async function seedPublishedOpenItineraryOrder(
  request: APIRequestContext,
  apiBase: string,
  token: string,
): Promise<string> {
  const orderId = await seedLandingPreviewOrderViaApi(request, apiBase, token);
  const base = apiBase.replace(/\/$/, "");
  const res = await request.patch(`${base}/api/v1/orders/${orderId}/itinerary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: {},
  });
  expect(res.ok(), `PATCH itinerary publish ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { published_to_market?: boolean; order_state?: string };
  expect(body.published_to_market === true || body.order_state === "created").toBeTruthy();
  return orderId;
}

const modalSubmitRe =
  /Book with selected trip|选行程并预约|更换为此向导|Replace with this guide/i;

const bookGuideDialogRe =
  /Book guide|预约向导|更换本单向导|Change guide for this order/i;

/** GD-L5-P3：`BookGuideModal` itinerary-first → PATCH bind → `/escrow/:id` */
export async function bindGuideFromBookGuideModal(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: bookGuideDialogRe });
  await expect(dialog).toBeVisible({
    timeout: 15_000,
  });
  const select = dialog.locator('[data-tt-book-guide-itinerary-select="1"]');
  if (await select.isVisible().catch(() => false)) {
    await expect(select).toBeVisible({ timeout: 20_000 });
  }
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/escrow/"), { timeout: 60_000 }),
    dialog.getByRole("button", { name: modalSubmitRe }).click(),
  ]);
}
