import type { UnifiedDayRow } from "@/lib/itineraryUnified";

/** 订单状态（API 可能用 state 或 status） */
export type OrderState = string;

export interface OrderRow {
  id: string;
  state?: OrderState;
  status?: string;
  /** 53 阶段：DB 子状态，与 01 主状态配合；见 53 附录 B */
  sub_status?: string;
  /** 53-S12：截止时间 ISO8601 UTC；前端按用户时区展示 */
  payment_deadline?: string | null;
  chat_confirm_deadline?: string | null;
  rating_deadline?: string | null;
  /** 53-S8 / GET order：评分材料双方确认，与 confirm-rating 对齐 */
  rating_tourist_confirmed?: boolean;
  rating_guide_confirmed?: boolean;
  amount?: string;
  currency?: string;
  escrow_address?: string | null;
  tourist_id?: string;
  /** 87：与 `tourist_id` 同 UUID；链下订单 JSON 镜像 */
  traveler_id?: string;
  guide_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

/** P16 未确认阶段：GET /orders/:id 当 status=Draft 时返回 */
export interface ItineraryBlock {
  version?: number;
  snapshot_hash?: string | null;
  /** 与 PATCH / 52 统一表一致；兼容仅含 day_index + content_text 的旧行 */
  daily_itinerary?: UnifiedDayRow[];
  amount_breakdown?: {
    total_budget?: number;
    hotel?: number;
    catering?: number;
    tickets?: number;
    guide_fee?: number;
    vehicle?: number;
    platform_fee?: number;
  };
}

export interface OrderResponse {
  status?: string;
  order?: OrderRow;
  itinerary?: ItineraryBlock | null;
}

export type ConfirmAction = "deposit" | "release" | "refund" | "dispute" | null;
