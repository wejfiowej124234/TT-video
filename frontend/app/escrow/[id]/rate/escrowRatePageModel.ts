import type { OrderResponse, OrderRow } from "@/components/escrow/EscrowDetail/types";

export { escrowRateNavFocusClass as RATE_NAV_FOCUS } from "@/lib/escrowRateL5";

/** 53-S8：行程评分页阶段；与 §4.6.2、30-DID 叙事一致 */
export type RatingPhase =
  | "pending_upload"
  | "under_review"
  | "waiting_other"
  | "both_confirmed"
  | "released"
  /** 资金终态但非 Completed：仅链下文字评价 */
  | "review_only";

/** 04 GET /orders/:id：标准包为 `{ order, itinerary? }`；单测/旧桩可能扁平 */
export function normalizeGetOrderPayload(raw: unknown): {
  orderResponse: OrderResponse;
  orderSlice: {
    state?: string;
    sub_status?: string;
    rating_deadline?: string | null;
    rating_tourist_confirmed?: boolean;
    rating_guide_confirmed?: boolean;
  } | null;
} {
  if (!raw || typeof raw !== "object") {
    return { orderResponse: {}, orderSlice: null };
  }
  const r = raw as Record<string, unknown>;
  const nested = r.order;
  if (nested && typeof nested === "object") {
    const row = nested as OrderRow;
    return {
      orderResponse: raw as OrderResponse,
      orderSlice: {
        state: typeof row.state === "string" ? row.state : undefined,
        sub_status: typeof row.sub_status === "string" ? row.sub_status : undefined,
        rating_deadline:
          row.rating_deadline === null || row.rating_deadline === undefined
            ? null
            : String(row.rating_deadline),
        rating_tourist_confirmed: row.rating_tourist_confirmed === true,
        rating_guide_confirmed: row.rating_guide_confirmed === true,
      },
    };
  }
  const row = raw as OrderRow;
  return {
    orderResponse: { order: row },
    orderSlice: {
      state: typeof row.state === "string" ? row.state : undefined,
      sub_status: typeof row.sub_status === "string" ? row.sub_status : undefined,
      rating_deadline:
        row.rating_deadline === null || row.rating_deadline === undefined
          ? null
          : String(row.rating_deadline),
      rating_tourist_confirmed: row.rating_tourist_confirmed === true,
      rating_guide_confirmed: row.rating_guide_confirmed === true,
    },
  };
}

/** 与 `traveltrust_core::can_submit_review` 终态一致（链下评价 POST 门禁） */
export function orderStateAllowsOffChainTextReviews(state?: string): boolean {
  const s = String(state ?? "").trim().toLowerCase();
  return s === "completed" || s === "refunded" || s === "partially_refunded" || s === "slashed";
}

/** 与 `order_confirm_rating_impl` 一致：仅 Completed 可确认评分 */
export function orderStateAllowsConfirmRating(state?: string): boolean {
  return String(state ?? "").trim().toLowerCase() === "completed";
}
