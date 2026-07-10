import { ORDERS_LIST_SEARCH_QUERY } from "@/lib/orders/ordersListClientSearch";
import { resolveOrdersListOrdersChainId } from "@/lib/orders/ordersListChainScope";
import { ordersListStateForApiQuery } from "@/lib/ordersListStateQuery";
import { ORDERS_PAGE_SIZE } from "@/app/orders/ordersListPageModel";

export type OrdersListFetchParamsInput = {
  cursor?: string;
  stateParam: string | null | undefined;
  searchQ?: string | null;
  hat?: "guide" | "merchant" | "traveler" | null;
};

/** `GET /api/v1/orders` 查询参数（列表首屏 / load-more / 静默轮询同源） */
export function buildOrdersListGetParams(input: OrdersListFetchParamsInput): {
  limit: number;
  cursor: string | undefined;
  state: string | undefined;
  orders_chain_id: number | undefined;
  q: string | undefined;
  hat: "guide" | "merchant" | "traveler" | undefined;
} {
  const search = (input.searchQ ?? "").trim();
  const rawHat = (input.hat ?? "").trim();
  const hat =
    rawHat === "guide" || rawHat === "merchant" || rawHat === "traveler" ? rawHat : undefined;
  return {
    limit: ORDERS_PAGE_SIZE,
    cursor: input.cursor,
    state: ordersListStateForApiQuery(input.stateParam),
    orders_chain_id: resolveOrdersListOrdersChainId(),
    q: search || undefined,
    hat,
  };
}

export const ORDERS_LIST_SEARCH_QUERY_KEY = ORDERS_LIST_SEARCH_QUERY;
