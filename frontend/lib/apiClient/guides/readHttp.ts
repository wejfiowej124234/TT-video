import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import type { GuidesListResult } from "./types";

/**
 * **`GET /api/v1/guides`**（可选登录头；公开列表）。**query**：**`city`**、**`language`**、**`service_type`**、**`country_code`**、**`limit`/`cursor`**（多值 facet 可逗号分隔，与 **04**、自由市场多选一致）。
 * **有 chain_off**：**`chain_off/guides_list_impl`**（仅 **`status=active`** 等规则见实现）。**无 chain_off**：**200** **`items:[]`**。成功体经 **`throwUnlessApiOk`**。
 */
export async function getGuides(params?: {
  city?: string;
  language?: string;
  service_type?: string;
  country_code?: string;
  limit?: number;
  cursor?: string;
}): Promise<GuidesListResult> {
  const q = new URLSearchParams();
  if (params?.city) q.set("city", params.city);
  if (params?.language) q.set("language", params.language);
  if (params?.service_type) q.set("service_type", params.service_type);
  if (params?.country_code) q.set("country_code", params.country_code);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const url = apiUrl(routes.guides) + (q.toString() ? `?${q}` : "");
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = (await parseResponse(res)) as {
    items?: unknown[];
    status?: string;
    page?: { limit: number; next_cursor: string | null; has_more: boolean };
  };
  logApiJsonStatusNotOk("getGuides", data);
  throwUnlessApiOk(data);
  const items = Array.isArray(data?.items) ? data.items : [];
  return data?.page ? { items, page: data.page } : { items };
}

/**
 * **`GET /api/v1/guides/:id`**（可选登录头）。**无 chain_off** → **503** **`chain_off_unavailable`**。**`:id`** 非 UUID → **400** **`invalid_uuid`**。
 * 成功且 JSON 缺 **`guide`** 时本客户端抛 **`guide_not_found`**（与 **`parseResponse` + `throwUnlessApiOk`** 后的防御一致）。**04** §3.4 **`GET …/guides/:id`**。
 */
export async function getGuide(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.guideById(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; guide?: unknown };
  logApiJsonStatusNotOk("getGuide", data);
  throwUnlessApiOk(data);
  if (data?.guide != null) return data.guide;
  throw new Error("guide_not_found");
}

/**
 * **`GET /api/v1/guides/:id/availability`**（**B-079**）：只读档期占用，与接单 **`schedule_conflict` / `lock_slot`** 同源（**`crates/api/src/chain_off/guides/availability.rs`** **`guide_availability_impl`**）。
 * **400** **`invalid_uuid`**；**404** **`guide_not_found`**（有 chain_off 时）。**无 chain_off**：**200** **`occupied_ranges:[]`**、**`note`** 提示不可用（**非** 503）。**04** §3.4 **`GET …/availability`** 行。
 */
export async function getGuideAvailability(id: string): Promise<{
  status?: string;
  guide_id?: string;
  occupied_ranges?: unknown[];
}> {
  const res = await fetch(apiUrl(routes.guideAvailability(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    guide_id?: string;
    occupied_ranges?: unknown[];
  };
  logApiJsonStatusNotOk("getGuideAvailability", data);
  throwUnlessApiOk(data);
  return data;
}
