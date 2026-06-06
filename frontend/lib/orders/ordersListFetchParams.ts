import { ORDERS_LIST_SEARCH_QUERY } from "@/lib/orders/ordersListClientSearch";
import { resolveOrdersListOrdersChainId } from "@/lib/orders/ordersListChainScope";
import { ordersListStateForApiQuery } from "@/lib/ordersListStateQuery";
import { ORDERS_PAGE_SIZE } from "@/app/orders/ordersListPageModel";

export type OrdersListFetchParamsInput = {
  cursor?: string;
  stateParam: string | null | undefined;
  searchQ?: string | null;
};

/** `GET /api/v1/orders` 查询参数（列表首屏 / load-more / 静默轮询同源） */
export function buildOrdersListGetParams(input: OrdersListFetchParamsInput) {
  const search = (input.searchQ ?? "").trim();
  return {
    limit: ORDERS_PAGE_SIZE,
    cursor: input.cursor,
    state: ordersListStateForApiQuery(input.stateParam),
    orders_chain_id: resolveOrdersListOrdersChainId(),
    q: search || undefined,
  };
}

export const ORDERS_LIST_SEARCH_QUERY_KEY = ORDERS_LIST_SEARCH_QUERY;
