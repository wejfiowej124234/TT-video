/**
 * P04/P05 共用：双边确认 UI 点击、向导侧 API 确认（含限流退避）、顶栏状态正则。
 */
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export function playwrightApiBase(): string {
  const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
  return process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
}

async function postConfirmBilateralOnce(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
  idempotencyKey: string,
) {
  return request.post(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-bilateral`,
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      data: "{}",
    },
  );
}

/** 遇 `rate_limit_exceeded` 按 `retry_after_seconds` 退避后再试一次（新 Idempotency-Key）。 */
export async function postConfirmBilateralExpectOk(
  request: APIRequestContext,
  orderId: string,
  bearer: string,
  apiBase: string = playwrightApiBase(),
) {
  const id1 =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `bilateral-1-${Date.now()}`;
  let res = await postConfirmBilateralOnce(request, apiBase, orderId, bearer, id1);
  if (res.ok()) return;
  const body1 = await res.text();
  if (!/rate_limit|429/i.test(`${res.status()} ${body1}`)) {
    expect(res.ok(), body1).toBeTruthy();
    return;
  }
  let waitMs = 65_000;
  try {
    const j = JSON.parse(body1) as { retry_after_seconds?: number };
    if (typeof j.retry_after_seconds === "number" && Number.isFinite(j.retry_after_seconds)) {
      waitMs = Math.min(120_000, Math.max(2_000, (j.retry_after_seconds + 1) * 1000));
    }
  } catch {
    // keep default
  }
  await new Promise((r) => setTimeout(r, waitMs));
  const id2 =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `bilateral-2-${Date.now()}`;
  res = await postConfirmBilateralOnce(request, apiBase, orderId, bearer, id2);
  expect(res.ok(), await res.text()).toBeTruthy();
}

/** `POST …/confirm-final-plan` 与 bilateral 同源限流。 */
export async function postConfirmFinalPlanExpectOk(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
  body: Record<string, unknown>,
) {
  const url = `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-final-plan`;
  const mkId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `cf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let res = await request.post(url, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      "Idempotency-Key": mkId(),
    },
    data: body,
  });
  if (res.ok()) return;
  const body1 = await res.text();
  if (!/rate_limit|429/i.test(`${res.status()} ${body1}`)) {
    expect(res.ok(), body1).toBeTruthy();
    return;
  }
  let waitMs = 65_000;
  try {
    const j = JSON.parse(body1) as { retry_after_seconds?: number };
    if (typeof j.retry_after_seconds === "number" && Number.isFinite(j.retry_after_seconds)) {
      waitMs = Math.min(120_000, Math.max(2_000, (j.retry_after_seconds + 1) * 1000));
    }
  } catch {
    // keep default
  }
  await new Promise((r) => setTimeout(r, waitMs));
  res = await request.post(url, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      "Idempotency-Key": mkId(),
    },
    data: body,
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

async function postAcceptOrderOnce(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
  idempotencyKey: string,
) {
  return request.post(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/accept`,
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      data: {},
    },
  );
}

/** 向导接单：与 bilateral 同源限流退避（UI 点击未落库时可 API 收口）。 */
export async function postAcceptOrderExpectOk(
  request: APIRequestContext,
  orderId: string,
  bearer: string,
  apiBase: string = playwrightApiBase(),
) {
  const id1 =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `accept-1-${Date.now()}`;
  let res = await postAcceptOrderOnce(request, apiBase, orderId, bearer, id1);
  if (res.ok()) return;
  const body1 = await res.text();
  if (!/rate_limit|429/i.test(`${res.status()} ${body1}`)) {
    expect(res.ok(), body1).toBeTruthy();
    return;
  }
  let waitMs = 65_000;
  try {
    const j = JSON.parse(body1) as { retry_after_seconds?: number };
    if (typeof j.retry_after_seconds === "number" && Number.isFinite(j.retry_after_seconds)) {
      waitMs = Math.min(120_000, Math.max(2_000, (j.retry_after_seconds + 1) * 1000));
    }
  } catch {
    // keep default
  }
  await new Promise((r) => setTimeout(r, waitMs));
  const id2 =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `accept-2-${Date.now()}`;
  res = await postAcceptOrderOnce(request, apiBase, orderId, bearer, id2);
  expect(res.ok(), await res.text()).toBeTruthy();
}

/** 在订单协议区内点双边 CTA（长串跑后 hydrate 较慢，拉长可见等待）。 */
export async function clickBilateralConfirmCta(page: Page) {
  await page.waitForLoadState("load").catch(() => {});
  const zone = page.locator('[data-zone="order-protocol"]');
  await expect(zone).toBeVisible({ timeout: 90_000 });
  const btn = zone.getByRole("button", {
    name: /确认行程与金额|Confirm itinerary and amount/i,
  });
  await expect(btn).toBeVisible({ timeout: 45_000 });
  await btn.scrollIntoViewIfNeeded();
  await expect(btn).toBeEnabled({ timeout: 30_000 });
  await btn.click({ timeout: 45_000 });
}

/** Escrow 顶栏：业务 confirmed 或链上 Paid 投影为「已入金」。 */
export const POST_BILATERAL_STATUS_BADGE =
  /已确认·待付款|Confirmed · awaiting payment|已入金·待履约|Funded · awaiting fulfillment/i;
