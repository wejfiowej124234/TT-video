/**
 * 53 §4.6.1：order.state / status + sub_status → locales 键（与 OrderFlowSteps 映射一致）
 */

export type OrderStatusInput = {
  state?: string;
  status?: string;
  sub_status?: string;
};

/**
 * 返回 `locales` 中的扁平 key（如 `order_status_draft`），供 `t(key)` 使用。
 */
export function orderStateToStatusLabelKey(input: OrderStatusInput | string): string {
  const state = typeof input === "string"
    ? (input || "").toLowerCase()
    : (input?.state ?? input?.status ?? "").toLowerCase();
  const sub =
    typeof input === "string"
      ? ""
      : (input?.sub_status ?? "").toLowerCase().replace(/-/g, "_");

  if (state === "cancelled" || state === "canceled") return "order_status_cancelled";
  if (state === "disputed") return "order_status_disputed";
  if (state === "refunded") return "order_status_refunded";
  if (state === "partiallyrefunded" || state === "partially_refunded") {
    return "order_status_partially_refunded";
  }
  if (state === "slashed") return "order_status_slashed";

  if (state === "draft") {
    if (sub === "guide_claimed") return "order_status_pending_guide_confirm";
    return "order_status_draft";
  }
  if (state === "created" || state === "open") {
    if (sub === "guide_claimed") return "order_status_pending_guide_confirm";
    return "order_status_created_listing";
  }

  if (state === "accepted") {
    if (sub === "confirmed") return "order_status_confirmed_awaiting_payment";
    // 含 pending_bilateral（53 接单后）等：待双边确认
    return "order_status_bilateral_pending";
  }

  if (state === "escrowed" || state === "funded") return "order_status_escrowed";

  if (state === "completed" || state === "released") {
    if (sub === "rating_confirmed") return "order_status_rating_confirmed";
    if (sub === "rating_pending") return "order_status_rating_pending";
    return "order_status_completed";
  }

  if (state === "confirmed") return "order_status_confirmed_awaiting_payment";
  if (state === "closed") return "order_status_closed";

  return "order_status_unknown";
}

export type OrderBadgeVariant = "neutral" | "warning" | "success" | "danger";

/** 列表/卡片状态徽章色带：与 orderStateToStatusLabelKey 同源 state/sub_status。 */
export function orderStateToBadgeVariant(input: OrderStatusInput | string): OrderBadgeVariant {
  const state = typeof input === "string"
    ? (input || "").toLowerCase()
    : (input?.state ?? input?.status ?? "").toLowerCase();
  const sub =
    typeof input === "string"
      ? ""
      : (input?.sub_status ?? "").toLowerCase().replace(/-/g, "_");

  if (state === "completed" || state === "released") {
    if (sub === "rating_pending") return "warning";
    return "success";
  }
  if (state === "closed") return "success";

  if (state === "draft" || state === "open") {
    if (sub === "guide_claimed") return "warning";
    return "neutral";
  }

  if (state === "created") return "warning";

  if (
    state === "cancelled" ||
    state === "canceled" ||
    state === "disputed" ||
    state === "failed" ||
    state === "refunded" ||
    state === "partiallyrefunded" ||
    state === "partially_refunded" ||
    state === "slashed"
  ) {
    return "danger";
  }

  if (["accepted", "confirmed", "funded", "escrowed"].includes(state)) return "warning";

  return "neutral";
}
