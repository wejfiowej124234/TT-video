import {
  ORDERS_LIST_HAT_GUIDE,
  ORDERS_LIST_HAT_QUERY,
  parseOrdersListHat as parseGuideOrdersListHat,
  isGuideOrdersListHat,
  type OrdersListHat as GuideOrdersListHat,
} from "@/lib/guide/guideOrderCorridorModel";
import {
  ORDERS_LIST_HAT_MERCHANT,
  merchantOrdersListHref,
  parseMerchantOrdersListHat,
  isMerchantOrdersListHat,
  type MerchantOrdersListHat,
} from "@/lib/provider/merchantOrderCorridorModel";

export { ORDERS_LIST_HAT_QUERY };

export type OrdersListHatQuery = GuideOrdersListHat | MerchantOrdersListHat;

export function parseOrdersListHatQuery(raw: string | null | undefined): OrdersListHatQuery {
  return parseMerchantOrdersListHat(raw) ?? parseGuideOrdersListHat(raw);
}

export function isWorkspaceOrdersListHat(hat: OrdersListHatQuery): hat is typeof ORDERS_LIST_HAT_GUIDE | typeof ORDERS_LIST_HAT_MERCHANT {
  return isGuideOrdersListHat(hat) || isMerchantOrdersListHat(hat);
}

export function ordersListHatForApi(hat: OrdersListHatQuery): "guide" | "merchant" | undefined {
  if (isGuideOrdersListHat(hat)) return "guide";
  if (isMerchantOrdersListHat(hat)) return "merchant";
  return undefined;
}

/** 工作台订单页「查看全部订单」：向导 → 旅行者 `/orders`；商家 → `hat=merchant` 全量列表 */
export function workspaceOrdersViewAllHref(hat: OrdersListHatQuery | null | undefined): string {
  if (isGuideOrdersListHat(hat)) return "/orders";
  if (isMerchantOrdersListHat(hat)) return merchantOrdersListHref();
  return "/orders";
}
