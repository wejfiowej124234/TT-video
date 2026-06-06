import type { APIRequestContext } from "@playwright/test";

import { requestGetWith429Retry, requestPostWith429Retry } from "./playwright429Backoff";

/** 与 `crates/api/src/chain_off/itineraries/caps_validate.rs` `IN_PROGRESS_CAP_PER_USER` 一致。 */
const IN_PROGRESS_CAP = 5;

/** 长期全矩阵跑完后仍要明显低于 **`itineraries` · `DRAFT_CAP_PER_USER`（20）**，避免「列表混单」漏数与并发创建顶格。 */
const DRAFT_HEADROOM_TARGET = 12;

type OrderListItem = {
  id?: string;
  status?: string;
  /** 与 `order_list_item_json` · `tourist_id` 同源；`traveler_id` 为别名。 */
  tourist_id?: string;
  traveler_id?: string;
};

function itemTouristId(o: OrderListItem): string {
  return (o.tourist_id ?? o.traveler_id ?? "").trim().toLowerCase();
}

/** `GET /api/v1/me` · `user.id`（与 **`order_cancel_impl`** 仅 **`tourist_id == user`** 可 **`cancel`** 对齐）。供 **`ensure*`** 与调用方 **单次解析、多次复用**（省 **`/me`**）。 */
export async function chainOffSessionUserId(
  request: APIRequestContext,
  apiBase: string,
  token: string,
): Promise<string | null> {
  const res = await requestGetWith429Retry(request, `${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return null;
  const j = (await res.json()) as { status?: string; user?: { id?: string } };
  if (j.status !== "ok") return null;
  const id = j.user?.id?.trim().toLowerCase() ?? "";
  return id.length > 0 ? id : null;
}

/** 非空 **`sessionUserId`** 则直接采用，否则 **`GET /api/v1/me`**（与各 `ensure*` 同源）。 */
async function coalesceSessionUserIdForHeadroom(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  sessionUserId?: string | null,
): Promise<string | null> {
  if (typeof sessionUserId === "string" && sessionUserId.trim() !== "") {
    return sessionUserId.trim().toLowerCase();
  }
  return chainOffSessionUserId(request, apiBase, token);
}

function isInProgressStatus(s: string): boolean {
  const x = s.trim().toLowerCase();
  return x === "created" || x === "accepted" || x === "escrowed";
}

/**
 * 持久化 DB / 多次 E2E 后 **`tourist@test.com`** 可能积满 **`created`/`accepted`/`escrowed`** 上限，
 * **`POST /api/v1/itineraries/custom`** 返回 **409 `in_progress_cap_exceeded`**（与测试网/生产同源闸）。
 * 在走 UI 前用 **真实 Bearer** 列单并 **`POST …/orders/:id/cancel`** 释放 **`created`** 位（不 mock、不 `page.route`）。
 * 仅统计 / 取消 **`tourist_id` == `GET /api/v1/me` `user.id`** 的订单：向导会话可见他人草稿，但 **`cancel`** 会 **403 `not_tourist`**（与 **`order_cancel_impl`** 同源）。
 * **`sessionUserId`**：非空时跳过 **`GET /api/v1/me`**（与连续 **`ensure*`** 调用对拍）。
 */
export async function ensureTouristOrderCapHeadroom(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  sessionUserId?: string | null,
): Promise<void> {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const meId = await coalesceSessionUserIdForHeadroom(request, apiBase, token, sessionUserId);
  if (!meId) return;

  /** 不传 **`limit`**：与 **`parse_order_list_page(None, None)`** 同源「全量列表」，避免混单分页把尾部 **`created`** 挤出页（与 **`ensureTouristDraftOrderHeadroom`** 的 **`state=draft`** 对称收口）。 */
  const listUrl = `${apiBase}/api/v1/orders`;
  const listRes = await requestGetWith429Retry(request, listUrl, { headers: authHeaders });
  if (!listRes.ok()) return;

  const body = (await listRes.json()) as { items?: OrderListItem[] };
  const items = (body.items ?? []).filter((o) => itemTouristId(o) === meId);
  let inProgress = items.filter((o) => isInProgressStatus(o.status ?? "")).length;
  if (inProgress < IN_PROGRESS_CAP) return;

  const createdIds = items
    .filter((o) => (o.status ?? "").trim().toLowerCase() === "created" && o.id)
    .map((o) => o.id!.trim());

  for (const oid of createdIds) {
    if (inProgress < IN_PROGRESS_CAP) break;
    const cancel = await requestPostWith429Retry(request, `${apiBase}/api/v1/orders/${encodeURIComponent(oid)}/cancel`, {
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        "Idempotency-Key": `e2e-in-progress-cap-relief-${oid}`,
      },
      data: "{}",
    });
    if (cancel.ok()) {
      inProgress -= 1;
    }
  }
}

/**
 * 多次 E2E 后同一账号可能积满 **Draft**（`POST /api/v1/itineraries/custom` 返回 **409 `draft_cap_exceeded`**）。
 * 用 **当前 Bearer 会话**（`tourist@test.com` / `guide@test.com` 等）列单并对 Draft 订单 **`POST …/orders/:id/cancel`** 释放空位（与 `OrderState::Draft → Cancelled` 同源）。
 * 仅取消 **`tourist_id` == `GET /api/v1/me` `user.id`** 的草稿：向导可见他人 **`draft`**，**`cancel`** 否则 **403**（与 **`order_cancel_impl`** 同源）。
 * **`sessionUserId`**：非空时跳过 **`GET /api/v1/me`**。
 */
export async function ensureTouristDraftOrderHeadroom(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  sessionUserId?: string | null,
): Promise<void> {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const meId = await coalesceSessionUserIdForHeadroom(request, apiBase, token, sessionUserId);
  if (!meId) return;

  /** `state=draft`：与 `GET /api/v1/orders` B-071 一致，避免草稿被非草稿订单挤出 `limit` 页（混单列表下会漏取消）。 */
  const listPath = `${apiBase}/api/v1/orders?state=draft&limit=100`;

  for (let round = 0; round < 60; round++) {
    const listRes = await requestGetWith429Retry(request, listPath, { headers: authHeaders });
    if (!listRes.ok()) return;

    const body = (await listRes.json()) as { items?: OrderListItem[] };
    const items = (body.items ?? []).filter((o) => itemTouristId(o) === meId);
    const draftIds = items
      .filter((o) => (o.status ?? "").trim().toLowerCase() === "draft" && o.id)
      .map((o) => o.id!.trim());

    if (draftIds.length <= DRAFT_HEADROOM_TARGET) return;
    if (draftIds.length === 0) return;

    let progressed = false;
    for (const oid of draftIds) {
      const cancel = await requestPostWith429Retry(
        request,
        `${apiBase}/api/v1/orders/${encodeURIComponent(oid)}/cancel`,
        {
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
            "Idempotency-Key": `e2e-draft-cap-relief-${oid}-${round}`,
          },
          data: "{}",
        },
      );
      if (cancel.ok()) {
        progressed = true;
        break;
      }
    }
    if (!progressed) return;
  }
}

/**
 * **`POST /api/v1/itineraries/custom`** 前双闸：**`in_progress_cap`** + **`draft_cap`** 空位（F-033 / 49 A UI 同源）。
 * 顺序 **`ensureTouristOrderCapHeadroom`** → **`ensureTouristDraftOrderHeadroom`**；**`sessionUserId`** 与各 `ensure*` 一致（非空则不再 **`GET /me`**）。
 */
export async function ensureTouristItineraryHeadroom(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  sessionUserId?: string | null,
): Promise<void> {
  const meId = await coalesceSessionUserIdForHeadroom(request, apiBase, token, sessionUserId);
  if (!meId) return;
  await ensureTouristOrderCapHeadroom(request, apiBase, token, meId);
  await ensureTouristDraftOrderHeadroom(request, apiBase, token, meId);
}
