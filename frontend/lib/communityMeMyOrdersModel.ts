import type { OrderListItem } from "@/lib/apiClient";
import { getOrders } from "@/lib/apiClient";
import { isDraftOrderListState } from "@/lib/isDraftOrderListState";
import { COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE } from "@/lib/communityMeListPageSize";

/** 列表项主状态（与 `GET /orders` 列表 `state` / 兼容 `status` 对齐） */
export function normalizedOrderListState(item: OrderListItem): string {
  return (item.state ?? item.status ?? "").toString().trim().toLowerCase();
}

/**
 * 个人中心「我的订单」快览：**不展示**仍停留在「市集草稿 / 未成交闭环」的订单。
 * 与 `OrderState::Draft` 及历史 `open` 对齐（`isDraftOrderListState`）。
 * 已进入 **Created+**（已下单待接单、履约中、终态等）均保留。
 */
export function isMarketplaceListingOnlyDraft(item: OrderListItem): boolean {
  return isDraftOrderListState(normalizedOrderListState(item));
}

export function filterOrdersForCommunityMeMyOrdersSurface(items: readonly OrderListItem[]): OrderListItem[] {
  return (items ?? []).filter((o) => o && String(o.id ?? "").length > 0 && !isMarketplaceListingOnlyDraft(o));
}

/**
 * 参与方是否可尝试 **POST …/orders/:id/cancel**（与链下状态机 `allowed_next` 对齐的保守前判）。
 * 已进入托管等阶段须走争议/完成流，不在此菜单提供「取消」。
 */
export function orderListItemMayRequestCancel(item: OrderListItem): boolean {
  const s = normalizedOrderListState(item);
  return s === "draft" || s === "open" || s === "created" || s === "accepted";
}

export const MY_ORDERS_DRAWER_PAGE_SIZE = COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE;
export const MY_ORDERS_DRAWER_MAX_PAGES = 40;
/** 个人中心抽屉单次会话最多拉取的原始列表条数（过滤 Draft/open 前）；用于「可能截断」提示。 */
export const MY_ORDERS_DRAWER_RAW_FETCH_CAP = MY_ORDERS_DRAWER_PAGE_SIZE * MY_ORDERS_DRAWER_MAX_PAGES;

export type FetchOrdersPageForCommunityMeDrawerResult = {
  items: OrderListItem[];
  page: { has_more?: boolean; next_cursor?: string } | undefined;
};

/** 单页 `GET /orders`（Hub 抽屉 cursor 分页；过滤在 hook 层合并）。 */
export async function fetchOrdersPageForCommunityMeDrawer(
  cursor?: string,
): Promise<FetchOrdersPageForCommunityMeDrawerResult> {
  const r = await getOrders({ limit: MY_ORDERS_DRAWER_PAGE_SIZE, cursor });
  const page = r.page;
  return {
    items: (r.items ?? []) as OrderListItem[],
    page: page
      ? {
          has_more: page.has_more,
          next_cursor: page.next_cursor ?? undefined,
        }
      : undefined,
  };
}

/** 与 `GET /orders` 列表对齐：全站「我的订单」页与个人中心快览均不展示 Draft/open 市集草稿（`isDraftOrderListState`）。 */
export function filterOrdersForTransactionalMyOrdersSurface(items: readonly OrderListItem[]): OrderListItem[] {
  return filterOrdersForCommunityMeMyOrdersSurface(items);
}

/** `/orders` 列表：默认隐藏 Draft；`?state=draft` 时仅展示可取消的行程草稿。 */
export function filterOrdersForOrdersListPage(
  items: readonly OrderListItem[],
  stateParam: string | null | undefined,
): OrderListItem[] {
  const state = (stateParam ?? "").trim().toLowerCase();
  if (state === "draft") {
    return (items ?? []).filter(
      (o) => o && String(o.id ?? "").length > 0 && isDraftOrderListState(normalizedOrderListState(o)),
    );
  }
  return filterOrdersForTransactionalMyOrdersSurface(items);
}
