import type { OrderListItem } from "@/lib/apiClient";
import {
  ORDERS_LIST_IN_PROGRESS_VALUE,
  ORDERS_LIST_TERMINAL_FILTER_OPTIONS,
} from "@/lib/ordersListStateQuery";
import {
  normalizedOrderListItemState,
  orderListItemIsInProgress,
} from "@/lib/orders/ordersListStateFilter";

export type OrdersListStateCounts = {
  __all__: number;
  [ORDERS_LIST_IN_PROGRESS_VALUE]: number;
} & Record<(typeof ORDERS_LIST_TERMINAL_FILTER_OPTIONS)[number]["value"], number>;

/** 已加载列表内各筛选 Tab 数量（① · 客户端旁证，非 API 全量） */
export function countOrdersListByTerminalState(list: OrderListItem[]): OrdersListStateCounts {
  const counts: OrdersListStateCounts = {
    __all__: list.length,
    [ORDERS_LIST_IN_PROGRESS_VALUE]: 0,
    completed: 0,
    cancelled: 0,
    disputed: 0,
  };

  for (const item of list) {
    const state = normalizedOrderListItemState(item);
    if (orderListItemIsInProgress(item)) {
      counts[ORDERS_LIST_IN_PROGRESS_VALUE] += 1;
    }
    if (state === "completed" || state === "cancelled" || state === "disputed") {
      counts[state] += 1;
    }
  }

  return counts;
}

export function ordersListFilterTabCount(counts: OrdersListStateCounts, tabValue: string): number {
  if (!tabValue) return counts.__all__;
  if (tabValue === ORDERS_LIST_IN_PROGRESS_VALUE) return counts[ORDERS_LIST_IN_PROGRESS_VALUE];
  if (tabValue === "completed" || tabValue === "cancelled" || tabValue === "disputed") {
    return counts[tabValue];
  }
  return 0;
}
