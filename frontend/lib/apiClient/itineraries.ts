/**
 * 行程生成 API（POST /api/v1/itineraries）；P15/17 ①
 * 49 A：POST /api/v1/itineraries/custom 自由市场自定义行程
 * 52：响应 daily_itinerary / amount_breakdown 与统一表 §3.1/§3.2 一致
 */

import { apiUrl, routes } from "../api";
import { parseResponse, writeRequestHeaders, logApiJsonStatusNotOk, throwUnlessApiOk } from "./core";
import type { UnifiedDayRow, AmountBreakdownUnified } from "@/lib/itineraryUnified";

/** 49 A.7 自定义行程请求体（与后端 CustomItineraryBody 对齐） */
export interface CustomItineraryBody {
  creator_type: "tourist" | "guide";
  country: string;
  total_days: number;
  amount: number | string;
  currency?: string;
  title?: string;
  description?: string;
  image?: string;
  /** Platform media SSOT id (preferred over inline data-URL `image`). */
  cover_media_asset_id?: string;
  headcount?: number;
  travel_date?: string;
  day_plans?: Array<{
    city: string;
    /** 与创建时配图一致：支持 { name, image? }[]，后端与行程单展示对齐 */
    attractions: Array<string | { name: string; image?: string }>;
    food: Array<string | { name: string; image?: string }>;
    hotel?: string | { name: string; image?: string };
    city_transport?: string;
    transport?: string;
  }>;
  guide_day_plans?: Array<{
    city: string;
    attractions: string;
    food: string;
    hotel: string;
    /** 当日景区配图，与创建时上传一致 */
    attraction_image?: string;
    food_image?: string;
  }>;
  need_guide?: string;
  breakdown?: {
    guide_fee?: number;
    car_fee?: number;
    attractions_fee?: number;
    food_fee?: number;
    hotel_fee?: number;
  };
  transport_legs?: Array<{ from: string; to: string; type?: string }>;
  /** 与 `POST /api/v1/itineraries`、`POST /api/v1/orders` 同一语义：预选向导（guides 表 UUID） */
  guide_id?: string;
}

/** 52 §3.1/§3.2：创建行程 API 响应（按日行 + 金额分项） */
export interface ItineraryCreateResponse {
  order_id: string;
  version?: number;
  order_status?: string;
  status?: string;
  daily_itinerary?: UnifiedDayRow[];
  amount_breakdown?: AmountBreakdownUnified;
}

/** 49 A：POST /api/v1/itineraries/custom — 创建自定义行程 Draft，返回 order_id；响应为 52 统一表形状 */
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
  if (data?.order_id) return { order_id: data.order_id, version: data.version, order_status: data.order_status, daily_itinerary: data.daily_itinerary, amount_breakdown: data.amount_breakdown };
  throw new Error("unknown");
}

/** POST /api/v1/itineraries — 17 ① 生成行程草稿；响应为 52 统一表形状；56-S3 可选 cities 多城市契约 */
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

export {
  postItineraryCustomDraft,
  getItineraryCustomDraft,
} from "./itineraries/customAndDrafts";
export type {
  ItineraryCustomDraftPostResult,
  ItineraryCustomDraftGetResult,
} from "./itineraries/types";
