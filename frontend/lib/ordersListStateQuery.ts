/**
 * B-071：`/orders` 筛选与 `GET /api/v1/orders?state=` 及 URL query 同源（值与后端 `order_state_to_str` 一致）。
 * `in_progress` 为客户端桶（created/accepted/escrowed 等），不传给 API。
 */
export const ORDERS_LIST_STATE_QUERY = "state" as const;

/** 进行中 · 仅客户端筛选（API 仍拉全量参与方订单后本地过滤） */
export const ORDERS_LIST_IN_PROGRESS_VALUE = "in_progress" as const;

/** 母表 B-071 明示的终态 */
export const ORDERS_LIST_TERMINAL_FILTER_OPTIONS = [
  { value: "completed", labelKey: "orders_list_state_completed" as const },
  { value: "cancelled", labelKey: "orders_list_state_cancelled" as const },
  { value: "disputed", labelKey: "orders_list_state_disputed" as const },
] as const;

/** 进行中 Tab（客户端） */
export const ORDERS_LIST_IN_PROGRESS_FILTER_OPTION = {
  value: ORDERS_LIST_IN_PROGRESS_VALUE,
  labelKey: "orders_list_state_in_progress" as const,
} as const;

/** 首页 AI 行程草稿（`OrderState::Draft` · 默认列表隐藏，此 Tab 专显） */
export const ORDERS_LIST_DRAFT_FILTER_OPTION = {
  value: "draft",
  labelKey: "orders_list_state_draft" as const,
} as const;

/** 筛选轨 Tab 顺序：草稿 → 进行中 → 终态 */
export const ORDERS_LIST_FILTER_TAB_OPTIONS = [
  ORDERS_LIST_DRAFT_FILTER_OPTION,
  ORDERS_LIST_IN_PROGRESS_FILTER_OPTION,
  ...ORDERS_LIST_TERMINAL_FILTER_OPTIONS,
] as const;

export type OrdersListFilterTabValue =
  | (typeof ORDERS_LIST_FILTER_TAB_OPTIONS)[number]["value"]
  | "";

const ALLOWED_STATE_VALUES = new Set<string>([
  ORDERS_LIST_DRAFT_FILTER_OPTION.value,
  ORDERS_LIST_IN_PROGRESS_VALUE,
  ...ORDERS_LIST_TERMINAL_FILTER_OPTIONS.map((o) => o.value),
]);

/** 非空且不在白名单时返回 `null`（由页面决定是否从 URL 剔除非法值） */
export function normalizeOrdersListStateQueryParam(raw: string | null): string | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return null;
  return ALLOWED_STATE_VALUES.has(t) ? t : null;
}

/** 传给 `getOrders` 的 `state`：客户端桶不传 */
export function ordersListStateForApiQuery(stateParam: string | null | undefined): string | undefined {
  const t = (stateParam ?? "").trim().toLowerCase();
  if (!t || t === ORDERS_LIST_IN_PROGRESS_VALUE) return undefined;
  return t;
}

/** 筛选 Tab → locales 扁平 key（空则 `orders_list_state_all`） */
export function ordersListStateLabelKey(
  state: string | null | undefined,
):
  | (typeof ORDERS_LIST_FILTER_TAB_OPTIONS)[number]["labelKey"]
  | "orders_list_state_all" {
  const t = (state ?? "").trim().toLowerCase();
  if (!t) return "orders_list_state_all";
  if (t === ORDERS_LIST_IN_PROGRESS_VALUE) return ORDERS_LIST_IN_PROGRESS_FILTER_OPTION.labelKey;
  if (t === ORDERS_LIST_DRAFT_FILTER_OPTION.value) return ORDERS_LIST_DRAFT_FILTER_OPTION.labelKey;
  return ORDERS_LIST_TERMINAL_FILTER_OPTIONS.find((o) => o.value === t)?.labelKey ?? "orders_list_state_all";
}