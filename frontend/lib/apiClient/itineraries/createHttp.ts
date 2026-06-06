import { apiUrl, routes } from "../../api";
import { parseResponse, writeRequestHeaders, logApiJsonStatusNotOk, throwUnlessApiOk } from "../core";
import type { ItineraryCreateResponse } from "./types";

/**
 * **`POST /api/v1/itineraries`**（P15/17 ①）：生成行程草稿（**Draft** 订单+行程）；响应 **52** 统一表形状。**56-S3**：可选 **`cities[]`** 多城市（本客户端仅在非空时序列化）。
 * **401** **`login_required`**；**无 chain_off** → **503** **`chain_off_unavailable`**。**`destination` / `city` / `cities[]` / `guide_id`** 等与 **`CreateItineraryBody`**、**`itinerary_create_impl`**（**`chain_off/itineraries/create.rs`**）及 **04** §3.4 **`POST …/itineraries`** 同源。
 */
export async function postItineraryCreate(
  body: {
    destination: string;
    city: string;
    travel_date?: string;
    days: number;
    /** 56-S3：城市序列，有则后端 mock/AI 仅产出所选城市 */
    cities?: string[];
    hotel_type?: string;
    food_preference?: string;
    transport?: string;
    budget_min?: number;
    budget_max?: number;
    notes?: string;
    /** 与 `POST /api/v1/orders` `guide_id` 同一语义：预选向导（guides 表 UUID） */
    guide_id?: string;
    party_size?: number;
    num_rooms?: number;
  },
  idempotencyKey?: string
): Promise<ItineraryCreateResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...writeRequestHeaders(idempotencyKey),
  };
  const payload: Record<string, unknown> = {
    destination: body.destination,
    city: body.city,
    travel_date: body.travel_date ?? new Date().toISOString().slice(0, 10),
    days: Math.max(1, Math.min(30, body.days)),
    hotel_type: body.hotel_type ?? undefined,
    food_preference: body.food_preference ?? undefined,
    transport: body.transport ?? undefined,
    budget_min: body.budget_min,
    budget_max: body.budget_max,
    notes: body.notes ?? undefined,
    party_size: body.party_size,
    num_rooms: body.num_rooms,
  };
  if (body.cities != null && body.cities.length > 0) payload.cities = body.cities;
  const gid = body.guide_id?.trim();
  if (gid) payload.guide_id = gid;
  const res = await fetch(apiUrl(routes.itineraries), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = (await parseResponse(res)) as ItineraryCreateResponse;
  logApiJsonStatusNotOk("postItineraryCreate", data);
  throwUnlessApiOk(data);
  return data;
}
