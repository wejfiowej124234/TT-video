import type { OrderListItem } from "@/lib/apiClient";
import { ORDERS_LIST_IN_PROGRESS_VALUE } from "@/lib/ordersListStateQuery";

/** 进行中（① · 客户端筛选；与列表主操作 `resolveOrdersListCardPrimaryAction` 口径对齐） */
export const ORDERS_LIST_IN_PROGRESS_STATES = [
  "created",
  "accepted",
  "escrowed",
  "funded",
  "confirmed",
] as const;

export function normalizedOrderListItemState(item: OrderListItem): string {
  const raw = (item?.state ?? item?.status ?? "").trim().toLowerCase();
  return raw === "canceled" ? "cancelled" : raw;
}

export function isOrdersListInProgressState(state: string): boolean {
  const s = state === "canceled" ? "cancelled" : state.trim().toLowerCase();
  return (ORDERS_LIST_IN_PROGRESS_STATES as readonly string[]).includes(s);
}

export function orderListItemIsInProgress(item: OrderListItem): boolean {
  return isOrdersListInProgressState(normalizedOrderListItemState(item));
}

/**
 * URL `?state=` 二次筛选：`in_progress` 为客户端桶；其余由 API 已筛时直接透传。
 */
export function filterOrdersListByUrlStateParam(
  list: readonly OrderListItem[],
  stateParam: string | null | undefined,
): OrderListItem[] {
  const t = (stateParam ?? "").trim().toLowerCase();
  if (!t || t === ORDERS_LIST_IN_PROGRESS_VALUE) {
    if (t !== ORDERS_LIST_IN_PROGRESS_VALUE) return [...list];
    return list.filter((item) => orderListItemIsInProgress(item));
  }
  return [...list];
}
