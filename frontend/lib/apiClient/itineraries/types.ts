import type { UnifiedDayRow, AmountBreakdownUnified } from "@/lib/itineraryUnified";

/** 49 A.7 自定义行程请求体（与 **`chain_off/itineraries/types.rs`** **`CustomItineraryBody`**、**04** **`POST …/itineraries/custom`** 对齐）。**`creator_type`**：**`traveler`** 与 **`tourist`** 游客侧同轨（**698/699**）。 */
export interface CustomItineraryBody {
  creator_type: "tourist" | "traveler" | "guide";
  country: string;
  total_days: number;
  amount: number | string;
  currency?: string;
  title?: string;
  description?: string;
  image?: string;
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
  breakdown?: { guide_fee?: number; car_fee?: number };
  transport_legs?: Array<{ from: string; to: string; type?: string }>;
  /** 与 `POST /api/v1/itineraries`、`POST /api/v1/orders` 同一语义：预选向导（guides 表 UUID） */
  guide_id?: string;
}

/** 52 §3.1/§3.2：**`POST …/itineraries`** / **`POST …/itineraries/custom`** 成功体核心字段（按日行 + 金额分项）。 */
export interface ItineraryCreateResponse {
  order_id: string;
  version?: number;
  order_status?: string;
  status?: string;
  daily_itinerary?: UnifiedDayRow[];
  amount_breakdown?: AmountBreakdownUnified;
}

/**
 * **`POST /api/v1/itineraries/custom/drafts`** 成功体（**`throwUnlessApiOk`** 后）；**`saved_at`** 若缺则由客户端补 ISO（与 **`itinerary_custom_draft_post`** 通常总返回 **`saved_at`** 略不同，属防御）。
 */
export type ItineraryCustomDraftPostResult = { draft_id: string; saved_at: string };

/** **`GET /api/v1/itineraries/custom/drafts/:id`** 成功体（**`itinerary_custom_draft_get`**）。 */
export type ItineraryCustomDraftGetResult = {
  draft_id: string;
  saved_at: string;
  payload: Record<string, unknown>;
  meta?: { implementation_status?: string };
};
