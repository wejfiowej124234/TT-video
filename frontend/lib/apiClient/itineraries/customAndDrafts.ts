import { apiUrl, routes } from "../../api";
import {
  parseResponse,
  writeRequestHeaders,
  getAuthHeaders,
  requestId,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import type { CustomItineraryBody, ItineraryCreateResponse, ItineraryCustomDraftPostResult, ItineraryCustomDraftGetResult } from "./types";

/**
 * **`POST /api/v1/itineraries/custom`**（49 A）：创建自定义行程 **Draft** 订单+行程，返回 **`order_id`**；响应为 **52** 统一表形状。
 * **401** **`login_required`**；**无 chain_off** → **503** **`chain_off_unavailable`**。地理 **`country` / `city` / `guide_id`** 等校验见 **`itinerary_custom_create_impl`**（**`crates/api/src/chain_off/itineraries/custom_create.rs`**）与 **04** §3.4 **`POST …/itineraries/custom`**。
 */
export async function postItineraryCustom(
  body: CustomItineraryBody,
  idempotencyKey?: string
): Promise<ItineraryCreateResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...writeRequestHeaders(idempotencyKey),
  };
  const res = await fetch(apiUrl(routes.itinerariesCustom), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as ItineraryCreateResponse;
  logApiJsonStatusNotOk("postItineraryCustom", data);
  throwUnlessApiOk(data);
  if (data?.order_id)
    return {
      order_id: data.order_id,
      version: data.version,
      order_status: data.order_status,
      daily_itinerary: data.daily_itinerary,
      amount_breakdown: data.amount_breakdown,
    };
  throw new Error("unknown");
}

/**
 * **`POST /api/v1/itineraries/custom/drafts`**：body **`{ "payload": <object> }`**（**`payload`** 必填且为 JSON object，否则 **400** **`invalid_itinerary_custom_draft_payload`** + **`reason`**）。
 * **401** **`login_required`**；**无 chain_off** → **503** **`chain_off_unavailable`**；**无 PG / 不可 durable write** → **503** **`database_required`**（与 **`ensure_durable_writes_available`**、**`persistence_gate.rs`** 同源）；落盘失败 → **503** **`itinerary_custom_draft_db_persist_failed`**。
 * **04** §3.4 **`POST …/itineraries/custom/drafts`**；**`GET …/drafts/:id`** 见 **`getItineraryCustomDraft`**。
 */
export async function postItineraryCustomDraft(
  payload: Record<string, unknown>,
  idempotencyKey?: string
): Promise<ItineraryCustomDraftPostResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId(),
    ...getAuthHeaders(),
    ...writeRequestHeaders(idempotencyKey),
  };
  const res = await fetch(apiUrl(routes.itinerariesCustomDrafts), {
    method: "POST",
    headers,
    body: JSON.stringify({ payload }),
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    draft_id?: string;
    saved_at?: string;
  };
  logApiJsonStatusNotOk("postItineraryCustomDraft", data);
  throwUnlessApiOk(data);
  const draft_id = data.draft_id;
  if (!draft_id || String(draft_id).trim() === "") {
    throw new Error("postItineraryCustomDraft: missing draft_id");
  }
  const saved =
    typeof data.saved_at === "string" && data.saved_at.trim() !== ""
      ? data.saved_at.trim()
      : new Date().toISOString();
  return { draft_id: String(draft_id).trim(), saved_at: saved };
}

/**
 * **`GET /api/v1/itineraries/custom/drafts/:id`**（F-033）：须登录；仅 **`owner_user_id`** 与当前会话一致时 **200**（**`crates/api/src/routes/itineraries.rs`** **`itinerary_custom_draft_get`**）。
 * **400** **`invalid_uuid`**；**401** **`login_required`**；**404** **`itinerary_custom_draft_not_found`**（根级常回显 **`draft_id`**）；**503** **`chain_off_unavailable`** / **`database_required`** / **`itinerary_custom_draft_db_read_failed`**。**04** §3.4 **`GET …/itineraries/custom/drafts/:id`**；产品深链 **`/market?itinerary_draft_id=`**、**`/itinerary/new?itinerary_draft_id=`**（**`MARKET_ITINERARY_DRAFT_QUERY`**，**`hydrateCustomItineraryStudioDraftFromServer`**）。
 */
export async function getItineraryCustomDraft(draftId: string): Promise<ItineraryCustomDraftGetResult> {
  const id = String(draftId ?? "").trim();
  if (!id) throw new Error("getItineraryCustomDraft: draftId required");
  const res = await fetch(apiUrl(routes.itinerariesCustomDraftById(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    draft_id?: string;
    saved_at?: string;
    payload?: unknown;
    meta?: { implementation_status?: string };
  };
  logApiJsonStatusNotOk("getItineraryCustomDraft", data);
  throwUnlessApiOk(data);
  const payload = data.payload;
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("getItineraryCustomDraft: missing or invalid payload");
  }
  const did = data.draft_id;
  const sat = data.saved_at;
  if (!did || String(did).trim() === "" || !sat || String(sat).trim() === "") {
    throw new Error("getItineraryCustomDraft: missing draft_id or saved_at");
  }
  return {
    draft_id: String(did).trim(),
    saved_at: String(sat).trim(),
    payload: payload as Record<string, unknown>,
    meta: data.meta,
  };
}
