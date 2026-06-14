import type { OrderListItem } from "@/lib/apiClient";
import { orderBusinessLineFromApi } from "@/lib/communityMeOrdersDrawerModel";

/** Guide Order Corridor Closure Sprint · 接待订单 `guide_id` SSOT */
export const GUIDE_ORDER_CORRIDOR_SPRINT_MARKER = "guide-order-corridor-closure-20260612" as const;

export const GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR = "guide-workbench-market-exposure" as const;

/** 订单列表向导帽：`/orders?hat=guide` */
export const ORDERS_LIST_HAT_QUERY = "hat" as const;
export const ORDERS_LIST_HAT_GUIDE = "guide" as const;

export type OrdersListHat = typeof ORDERS_LIST_HAT_GUIDE | null;

export function normalizeGuideRowId(guideRowId: string | null | undefined): string | null {
  const id = guideRowId?.trim();
  return id ? id : null;
}

export function parseOrdersListHat(raw: string | null | undefined): OrdersListHat {
  const v = raw?.trim().toLowerCase();
  if (v === ORDERS_LIST_HAT_GUIDE) return ORDERS_LIST_HAT_GUIDE;
  return null;
}

export function isGuideOrdersListHat(hat: OrdersListHat): hat is typeof ORDERS_LIST_HAT_GUIDE {
  return hat === ORDERS_LIST_HAT_GUIDE;
}

/** 接待订单：trip 轨且 `order.guide_id` 与当前向导 guides 行 id 一致 */
export function orderMatchesGuideReception(
  item: OrderListItem,
  guideRowId: string | null | undefined,
): boolean {
  const gid = normalizeGuideRowId(guideRowId);
  if (!gid) return false;
  if (orderBusinessLineFromApi(item) !== "trip") return false;
  const orderGuideId = item.guide_id?.trim();
  return Boolean(orderGuideId && orderGuideId === gid);
}

export function filterOrdersForGuideReception(
  items: readonly OrderListItem[],
  guideRowId: string | null | undefined,
): OrderListItem[] {
  return (items ?? []).filter((item) => orderMatchesGuideReception(item, guideRowId));
}

export function guideOrdersListHref(opts?: { state?: string | null }): string {
  const p = new URLSearchParams();
  p.set(ORDERS_LIST_HAT_QUERY, ORDERS_LIST_HAT_GUIDE);
  const state = opts?.state?.trim();
  if (state) p.set("state", state);
  const q = p.toString();
  return q ? `/orders?${q}` : "/orders";
}

export function guideOrdersInProgressHref(): string {
  return guideOrdersListHref({ state: "in_progress" });
}
