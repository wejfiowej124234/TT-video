import type { OrderListItem } from "@/lib/apiClient";
import { orderBusinessLineFromApi } from "@/lib/communityMeOrdersDrawerModel";
import { ORDERS_LIST_HAT_QUERY } from "@/lib/guide/guideOrderCorridorModel";

/** Merchant Workbench L5 · seller 视角订单走廊 */
export const MERCHANT_ORDER_CORRIDOR_SPRINT_MARKER = "merchant-order-corridor-closure-20260612" as const;

export const PROVIDER_WORKBENCH_MARKET_EXPOSURE_ANCHOR = "provider-workbench-market-exposure" as const;

export const ORDERS_LIST_HAT_MERCHANT = "merchant" as const;

export type MerchantOrdersListHat = typeof ORDERS_LIST_HAT_MERCHANT | null;

export function parseMerchantOrdersListHat(raw: string | null | undefined): MerchantOrdersListHat {
  const v = raw?.trim().toLowerCase();
  if (v === ORDERS_LIST_HAT_MERCHANT) return ORDERS_LIST_HAT_MERCHANT;
  return null;
}

export function isMerchantOrdersListHat(hat: MerchantOrdersListHat): hat is typeof ORDERS_LIST_HAT_MERCHANT {
  return hat === ORDERS_LIST_HAT_MERCHANT;
}

/** seller 订单：merchant_service 轨（服务端按 order_guide_user_id 过滤；客户端仅 business_line 旁证） */
export function orderMatchesMerchantSellerService(item: OrderListItem): boolean {
  return orderBusinessLineFromApi(item) === "merchant_service";
}

export function filterOrdersForMerchantSellerService(items: readonly OrderListItem[]): OrderListItem[] {
  return (items ?? []).filter(orderMatchesMerchantSellerService);
}

export function merchantOrdersListHref(opts?: { state?: string | null }): string {
  const p = new URLSearchParams();
  p.set(ORDERS_LIST_HAT_QUERY, ORDERS_LIST_HAT_MERCHANT);
  const state = opts?.state?.trim();
  if (state) p.set("state", state);
  const q = p.toString();
  return q ? `/orders?${q}` : "/orders";
}

export function merchantOrdersInProgressHref(): string {
  return merchantOrdersListHref({ state: "in_progress" });
}
