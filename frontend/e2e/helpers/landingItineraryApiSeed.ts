import { expect, type APIRequestContext, type Page } from "@playwright/test";
import type { BearerSessionCredentials } from "./apiSession";

/** 与 `smoke-landing-itinerary-flow-local.sh` 同形 POST /itineraries */
export async function registerFreshTouristForCorridor(
  request: APIRequestContext,
  apiBase: string,
): Promise<BearerSessionCredentials> {
  const email = `web3-corridor-${Date.now()}@traveltrust.test`;
  const res = await request.post(`${apiBase.replace(/\/$/, "")}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "Test123!", nickname: "Web3 Corridor E2E" },
  });
  expect(res.ok(), `register ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { token?: string; user_id?: string };
  const token = body.token?.trim() ?? "";
  expect(token).not.toBe("");
  return { token, userId: body.user_id?.trim() ?? "" };
}

export async function seedLandingPreviewOrderViaApi(
  request: APIRequestContext,
  apiBase: string,
  token: string,
): Promise<string> {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const travel_date = start.toISOString().slice(0, 10);
  const res = await request.post(`${apiBase.replace(/\/$/, "")}/api/v1/itineraries`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: {
      destination: "中国",
      city: "北京",
      travel_date,
      days: 5,
      cities: ["北京"],
      hotel_type: "标准",
      food_preference: "当地特色",
      notes: "景点：世界遗产",
      budget_min: 2960,
      budget_max: 3700,
    },
  });
  expect(res.ok(), `POST /itineraries ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { order_id?: string };
  const orderId = body.order_id?.trim() ?? "";
  expect(orderId).not.toBe("");
  return orderId;
}

export async function mountLandingPreviewOrderOnPage(page: Page, orderId: string): Promise<void> {
  await page.evaluate((oid) => {
    localStorage.setItem("tt_landing_result_order_ids_v1", JSON.stringify([oid]));
    localStorage.removeItem("tt_landing_unlocked_order_ids_v1");
    sessionStorage.removeItem("tt_landing_result_order_ids_v1");
    sessionStorage.removeItem("tt_landing_unlocked_order_ids_v1");
  }, orderId);
}
