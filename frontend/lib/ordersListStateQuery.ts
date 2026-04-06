/**
 * B-071：`/orders` 终态筛选与 `GET /api/v1/orders?state=` 及 URL query 同源（值与后端 `order_state_to_str` 一致）。
 */
export const ORDERS_LIST_STATE_QUERY = "state" as const;

/** 母表 B-071 明示的终态（可扩展其它 `OrderState` 字符串） */
export const ORDERS_LIST_TERMINAL_FILTER_OPTIONS = [
  { value: "completed", labelKey: "orders_list_state_completed" as const },
  { value: "cancelled", labelKey: "orders_list_state_cancelled" as const },
  { value: "disputed", labelKey: "orders_list_state_disputed" as const },
] as const;

/** 非空且不在白名单时返回 `null`（由页面决定是否从 URL 剔除非法值） */
export function normalizeOrdersListStateQueryParam(raw: string | null): string | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return null;
  return ORDERS_LIST_TERMINAL_FILTER_OPTIONS.some((o) => o.value === t) ? t : null;
}
