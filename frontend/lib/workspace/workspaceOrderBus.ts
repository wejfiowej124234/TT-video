import type { OrderListItem } from "@/lib/apiClient";
import { orderBusinessLineFromApi } from "@/lib/communityMeOrdersDrawerModel";
import { guideOrdersInProgressHref } from "@/lib/guide/guideOrderCorridorModel";
import { ORDERS_LIST_IN_PROGRESS_VALUE } from "@/lib/ordersListStateQuery";
import {
  normalizedOrderListItemState,
  orderListItemIsInProgress,
} from "@/lib/orders/ordersListStateFilter";
import type { WorkspaceIdentityId } from "./workspaceIdentityModel";

/** 统一订单总线：各身份共用 `/orders` 列表 + `/escrow/[id]` 走廊 */
export const WORKSPACE_ORDERS_LIST_HREF = "/orders" as const;

/** 旅客进行中订单列表 */
export function workspaceOrdersInProgressHref(): string {
  return `${WORKSPACE_ORDERS_LIST_HREF}?state=${ORDERS_LIST_IN_PROGRESS_VALUE}`;
}

/** 向导接待进行中订单（`hat=guide` · guide_id SSOT） */
export function workspaceGuideOrdersInProgressHref(): string {
  return guideOrdersInProgressHref();
}

export function workspaceEscrowHref(orderId: string): string {
  return `/escrow/${encodeURIComponent(orderId)}`;
}

/** 按身份过滤参与方订单（客户端旁证；全量仍走 GET /orders） */
export function orderMatchesWorkspaceIdentity(
  item: OrderListItem,
  identity: WorkspaceIdentityId,
  opts?: { userId?: string | null },
): boolean {
  const line = orderBusinessLineFromApi(item);
  switch (identity) {
    case "traveler":
      return line === "trip";
    case "merchant":
      return line === "merchant_service";
    case "acquisition":
      return line === "acquisition";
    case "guide":
      return line === "trip";
    case "region_steward":
      return false;
    default:
      return false;
  }
}

export function filterOrdersForWorkspaceIdentity(
  items: readonly OrderListItem[],
  identity: WorkspaceIdentityId,
): OrderListItem[] {
  return items.filter((item) => orderMatchesWorkspaceIdentity(item, identity));
}

export function countInProgressOrders(items: readonly OrderListItem[]): number {
  return items.filter(orderListItemIsInProgress).length;
}

export function countPendingAcceptOrders(items: readonly OrderListItem[]): number {
  return items.filter(
    (o) => orderListItemIsInProgress(o) && normalizedOrderListItemState(o) === "created",
  ).length;
}
