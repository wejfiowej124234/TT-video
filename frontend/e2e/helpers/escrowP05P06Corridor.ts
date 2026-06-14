/**
 * P05/P06 ① 本地走廊：P04 双边确认后 → 终版 snapshot → mock-pay → 档期占用 → 完成/取消释放
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  postConfirmBilateralExpectOk,
  postAcceptOrderExpectOk,
  playwrightApiBase,
} from "./bilateralEscrowE2e";
import { seedPublishedOpenItineraryOrder } from "./bookGuideItineraryFirst";
import { uiLogout } from "./headerUserMenu";
import { registerFreshTouristForCorridor } from "./landingItineraryApiSeed";
import {
  PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL,
  PUBLIC_CATALOG_HANGZHOU_GUIDE_ID,
  TRUST_GATE_E2E_PASSWORD,
} from "./publicCatalogHangzhouGuide";

export type OccupiedRange = {
  order_id?: string;
  start_date?: string;
  end_date?: string;
  source?: string;
};

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 未来可订区间（尽量落在当月，便于向导详情日历默认视图断言） */
export function pickFutureTripDatesYmd(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  const startDay = Math.min(dim - 2, Math.max(now.getDate() + 5, 10));
  if (startDay + 1 <= dim) {
    return { start: toYmd(new Date(y, m, startDay)), end: toYmd(new Date(y, m, startDay + 1)) };
  }
  const ny = m === 11 ? y + 1 : y;
  const nm = (m + 1) % 12;
  return { start: toYmd(new Date(ny, nm, 10)), end: toYmd(new Date(ny, nm, 12)) };
}

export function datesInRangeYmd(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cur <= last) {
    out.push(toYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function apiLogin(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${apiBase}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { token?: string };
  const token = body.token?.trim();
  expect(token).toBeTruthy();
  return token as string;
}

export async function patchTripDatesExpectOk(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
  start: string,
  end: string,
): Promise<void> {
  const res = await request.patch(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/trip-dates`,
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      data: { start_date: start, end_date: end },
    },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
}

export async function getOccupiedRanges(
  request: APIRequestContext,
  apiBase: string,
  guideId: string,
  bearer: string,
): Promise<OccupiedRange[]> {
  const res = await request.get(
    `${apiBase}/api/v1/guides/${encodeURIComponent(guideId)}/availability`,
    { headers: { Authorization: `Bearer ${bearer}` } },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { occupied_ranges?: OccupiedRange[] };
  return body.occupied_ranges ?? [];
}

export function rangeCoversOrder(
  ranges: OccupiedRange[],
  orderId: string,
  start: string,
  end: string,
): boolean {
  return ranges.some(
    (r) =>
      String(r.order_id ?? "").trim() === orderId &&
      String(r.start_date ?? "").trim() === start &&
      String(r.end_date ?? "").trim() === end,
  );
}

const busyLabelRe = /已占用|occupied/i;
const freeLabelRe = /可订|available/i;

/** `/guides/[id]` 日历：escrowed 后红格、completed/cancelled 后恢复可订（须公众 catalog 向导 + 已登录） */
export async function assertGuideScheduleBusyForRange(
  page: Page,
  guideId: string,
  start: string,
  end: string,
  expectBusy: boolean,
): Promise<void> {
  await page.goto(`/guides/${encodeURIComponent(guideId)}`, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: /可预订档期|档期|Availability/i })).toBeVisible({
    timeout: 45_000,
  });
  const expandBtn = page.getByRole("button", { name: /查看完整档期|View full schedule/i });
  if (await expandBtn.isVisible().catch(() => false)) {
    await expandBtn.click();
  }
  for (const ymd of datesInRangeYmd(start, end)) {
    const cell = page.locator(`[aria-label*="${ymd}"]`).first();
    await expect(cell).toBeVisible({ timeout: 25_000 });
    const label = (await cell.getAttribute("aria-label")) ?? "";
    if (expectBusy) {
      expect(label, `expected busy (red) for ${ymd}`).toMatch(busyLabelRe);
    } else {
      expect(label, `expected free (white) for ${ymd}`).not.toMatch(busyLabelRe);
      expect(label, `expected bookable for ${ymd}`).toMatch(freeLabelRe);
    }
  }
}

export type P03P04CorridorSeed = {
  orderId: string;
  touristToken: string;
  touristEmail: string;
  guideId: string;
  guideEmail: string;
  guideToken: string;
  escrowPath: string;
  tripDates: { start: string; end: string };
};

/** itinerary-first + 公众 catalog：发布 → API 绑杭州向导 → 设档期 → 接单 → 双边确认 */
export async function seedP03P04CorridorWithTripDates(
  page: Page,
  request: APIRequestContext,
  apiBase: string = playwrightApiBase(),
): Promise<P03P04CorridorSeed> {
  const tripDates = pickFutureTripDatesYmd();
  const creds = await registerFreshTouristForCorridor(request, apiBase);
  const touristToken = creds.token;
  const touristEmail = creds.email ?? "";
  expect(touristEmail).not.toBe("");

  const guideId = PUBLIC_CATALOG_HANGZHOU_GUIDE_ID;
  const guideEmail = PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL;

  const orderId = await seedPublishedOpenItineraryOrder(request, apiBase, touristToken);
  const escrowPath = `/escrow/${encodeURIComponent(orderId)}`;

  let patchGuideOk = false;
  for (let attempt = 0; attempt < 3 && !patchGuideOk; attempt++) {
    const patchRes = await request.patch(
      `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/guide`,
      {
        headers: {
          Authorization: `Bearer ${touristToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        data: { guide_id: guideId },
      },
    );
    if (patchRes.ok()) {
      patchGuideOk = true;
      break;
    }
    const errText = await patchRes.text();
    if (errText.includes("rate_limit") && attempt < 2) {
      await page.waitForTimeout(61_000);
      continue;
    }
    expect(patchRes.ok(), errText).toBeTruthy();
  }

  await patchTripDatesExpectOk(request, apiBase, orderId, touristToken, tripDates.start, tripDates.end);

  await page.goto(
    `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    { timeout: 60_000 },
  );
  await page.getByRole("textbox", { name: /email|邮箱/i }).fill(touristEmail);
  await page.getByLabel(/password|密码/i).fill("Test123!");
  await page.getByRole("button", { name: /Log in|登录/i }).click();
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

  const guideToken = await apiLogin(request, apiBase, guideEmail, TRUST_GATE_E2E_PASSWORD);
  await postAcceptOrderExpectOk(request, orderId, guideToken, apiBase);
  await postConfirmBilateralExpectOk(request, orderId, touristToken, apiBase);
  await postConfirmBilateralExpectOk(request, orderId, guideToken, apiBase);

  await expect
    .poll(async () => {
      const fin = await request.get(
        `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}`,
        { headers: { Authorization: `Bearer ${touristToken}` } },
      );
      if (!fin.ok()) return false;
      const body = (await fin.json()) as {
        order?: { state?: string; sub_status?: string };
      };
      return (
        String(body.order?.state ?? "").toLowerCase() === "accepted" &&
        body.order?.sub_status === "confirmed"
      );
    }, { timeout: 30_000 })
    .toBe(true);

  return {
    orderId,
    touristToken,
    touristEmail,
    guideId,
    guideEmail,
    guideToken,
    escrowPath,
    tripDates,
  };
}

async function postConfirmFinalPlanWithVersionRetry(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const pre = await request.get(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(pre.ok()).toBeTruthy();
    const preJson = (await pre.json()) as { itinerary?: { version?: number } };
    let expectedVersion = preJson.itinerary?.version ?? 1;
    const url = `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-final-plan`;
    let res = await request.post(url, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      data: { expected_version: expectedVersion },
    });
    if (res.ok()) return;
    const bodyText = await res.text();
    if (res.status() === 409 && bodyText.includes("version_conflict")) {
      try {
        const j = JSON.parse(bodyText) as { current_version?: number };
        if (typeof j.current_version === "number") {
          expectedVersion = j.current_version;
          res = await request.post(url, {
            headers: {
              Authorization: `Bearer ${bearer}`,
              "Content-Type": "application/json",
              "Idempotency-Key": randomUUID(),
            },
            data: { expected_version: expectedVersion },
          });
          if (res.ok()) return;
        }
      } catch {
        // fall through
      }
    }
    if (/rate_limit|429/i.test(`${res.status()} ${bodyText}`) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 65_000));
      continue;
    }
    expect(res.ok(), bodyText).toBeTruthy();
  }
}

export async function confirmFinalPlanAndExpectSnapshot(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
): Promise<string> {
  await postConfirmFinalPlanWithVersionRetry(request, apiBase, orderId, bearer);
  const after = await request.get(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  expect(after.ok()).toBeTruthy();
  const snap = ((await after.json()) as { itinerary?: { snapshot_hash?: string } }).itinerary
    ?.snapshot_hash;
  expect(String(snap ?? "").startsWith("0x")).toBeTruthy();
  return String(snap).trim();
}

export async function mockPayExpectEscrowed(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  touristToken: string,
): Promise<void> {
  const payRes = await request.post(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/mock-pay`,
    {
      headers: {
        Authorization: `Bearer ${touristToken}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      data: {},
    },
  );
  expect(payRes.ok(), await payRes.text()).toBeTruthy();
  const after = await request.get(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${touristToken}` },
  });
  expect(after.ok()).toBeTruthy();
  const st = ((await after.json()) as { order?: { state?: string; status?: string } }).order;
  expect(String(st?.state ?? st?.status ?? "").toLowerCase()).toBe("escrowed");
}

export { uiLogout };
