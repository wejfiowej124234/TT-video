import type { APIRequestContext } from "@playwright/test";

import { seedTestAccountsAndReleaseGuideSlot } from "./apiSession";
import { ensureTouristOrderCapHeadroom } from "./ensureTouristOrderCapHeadroom";
import { guideRowIdForSeedGuideAccount } from "./guideSeedGuideRowId";
import { newIdempotencyKey } from "./idempotencyKey";
import { fetchFirstDisputeIdForBearer } from "./meSettingsE2e";

/** PG 路径 GET /api/v1/disputes/:id 须 200（避免列表有行但详情 500）。 */
export async function disputePublicDetailOk(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  disputeId: string,
): Promise<boolean> {
  const base = apiBase.replace(/\/$/, "");
  const res = await request.get(`${base}/api/v1/disputes/${disputeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok();
}

function mockPayUnavailable(request: APIRequestContext, apiBase: string): Promise<boolean> {
  return request
    .post(`${apiBase}/api/v1/orders/00000000-0000-0000-0000-000000000001/mock-pay`, {
      headers: { "Content-Type": "application/json" },
      data: "{}",
    })
    .then((res) => res.status() === 501);
}

/**
 * F-025 窄链：为种子游客确保至少一条争议 id（① · PG + mock-pay）。
 * mock-pay 不可用时返回 null（调用方 `test.skip`）。
 */
export async function ensureDisputeIdForBearer(
  request: APIRequestContext,
  apiBase: string,
  touristToken: string,
): Promise<string | null> {
  const base = apiBase.replace(/\/$/, "");
  const existing = await fetchFirstDisputeIdForBearer(request, base, touristToken);
  if (existing && (await disputePublicDetailOk(request, base, touristToken, existing))) {
    return existing;
  }

  if (await mockPayUnavailable(request, base)) return null;

  await seedTestAccountsAndReleaseGuideSlot(request, base);
  await ensureTouristOrderCapHeadroom(request, base, touristToken);

  const guideId = await guideRowIdForSeedGuideAccount(request, base);
  if (!guideId) return null;

  const guideLogin = await request.post(`${base}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: "guide@test.com", password: "Test123!" },
  });
  if (!guideLogin.ok()) return null;
  const guideToken = ((await guideLogin.json()) as { token?: string }).token?.trim() ?? "";
  if (!guideToken) return null;

  const suffix = `me-set-b15-${Date.now()}`;
  const writeHeaders = (token: string, step: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "Idempotency-Key": newIdempotencyKey(`b15-${suffix}-${step}`),
  });

  await request
    .post(`${base}/api/v1/guides/${guideId}/stake`, {
      headers: writeHeaders(guideToken, "stake"),
      data: { amount: "1" },
    })
    .catch(() => null);

  const create = await request.post(`${base}/api/v1/orders`, {
    headers: writeHeaders(touristToken, "create"),
    data: { guide_id: guideId, amount: "100", currency: "USD" },
  });
  if (!create.ok()) return null;
  const orderId = ((await create.json()) as { order?: { id?: string } }).order?.id?.trim() ?? "";
  if (!orderId) return null;

  const accept = await request.post(`${base}/api/v1/orders/${orderId}/accept`, {
    headers: writeHeaders(guideToken, "accept"),
    data: {},
  });
  if (!accept.ok()) return null;

  const pay = await request.post(`${base}/api/v1/orders/${orderId}/mock-pay`, {
    headers: writeHeaders(touristToken, "pay"),
    data: {},
  });
  if (!pay.ok()) return null;

  const open = await request.post(`${base}/api/v1/orders/${orderId}/dispute`, {
    headers: writeHeaders(touristToken, "dispute"),
    data: {},
  });
  if (!open.ok()) return null;
  const disputeId = ((await open.json()) as { dispute?: { id?: string } }).dispute?.id?.trim() ?? "";
  if (!disputeId) return null;
  if (!(await disputePublicDetailOk(request, base, touristToken, disputeId))) return null;
  return disputeId;
}
