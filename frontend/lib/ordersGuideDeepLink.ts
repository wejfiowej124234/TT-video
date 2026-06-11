import { MARKET_BIND_GUIDE_ORDER_QUERY } from "@/lib/marketDeepLink";

/**
 * 5.1 / 53：从市场或「预约向导」入口直达创建订单并预填 `guide_id`（与 `app/orders/new/page.tsx` 一致）。
 */
export type OrdersNewGuideQuery = {
  startDate?: string | null;
  endDate?: string | null;
};

export function ordersNewHrefForGuide(guideId: string, trip?: OrdersNewGuideQuery): string {
  const q = new URLSearchParams();
  q.set("guide_id", guideId.trim());
  const start = trip?.startDate?.trim();
  const end = trip?.endDate?.trim();
  if (start && end) {
    q.set("start_date", start);
    q.set("end_date", end);
  }
  return `/orders/new?${q.toString()}`;
}

/** `/orders/new` 更换向导：打开自由市场向导视图（卡片 · 头像 · 详情），与 `BookGuideModal` 同源发现面。 */
export function marketHrefForPickGuide(): string {
  return "/market?view=guides";
}

/** 5.2 / 自由市场：带 `guide_id` 打开市场，自定义行程提交走 `POST /itineraries/custom`（与 `useMarketPage` 一致）。 */
export function marketHrefForGuideCustomItinerary(guideId: string): string {
  const q = new URLSearchParams();
  q.set("guide_id", guideId.trim());
  return `/market?${q.toString()}`;
}

/** Escrow 草稿：自由市场向导视图 + 为既有订单绑定向导（`bindGuideToOrder` 保留绑定上下文） */
export function marketHrefForEscrowGuideBind(orderId: string): string {
  const q = new URLSearchParams();
  q.set("view", "guides");
  q.set(MARKET_BIND_GUIDE_ORDER_QUERY, orderId.trim());
  return `/market?${q.toString()}`;
}

/** 向导详情页：保留 `bindGuideToOrder` 以便行程日期自动带入（与市场绑定向导同源） */
export function guideDetailHrefForBind(guideId: string, orderId?: string | null): string {
  const id = guideId.trim();
  const base = `/guides/${encodeURIComponent(id)}`;
  const bind = orderId?.trim() ?? "";
  if (!bind) return base;
  const q = new URLSearchParams();
  q.set(MARKET_BIND_GUIDE_ORDER_QUERY, bind);
  return `${base}?${q.toString()}`;
}

/**
 * B-059：`/orders/new` 遇 `login_required` 时，登录成功应回到创建页（保留 guide_id 与可选档期）。
 */
export function ordersNewHrefForLoginReturn(
  guideId: string,
  trip?: OrdersNewGuideQuery,
): string | null {
  const id = guideId.trim();
  if (!id) return null;
  return ordersNewHrefForGuide(id, trip);
}

/** @deprecated 优先 `authLoginHrefForOrdersNewReturn`；保留供向导详情只读链 */
export function guideDetailHrefForOrdersNewLoginReturn(guideId: string): string | null {
  const id = guideId.trim();
  if (!id) return null;
  return `/guides/${encodeURIComponent(id)}`;
}

/** 完整登录链；`guideId` 无效时返回 `null`。 */
export function authLoginHrefForOrdersNewReturn(
  guideId: string,
  trip?: OrdersNewGuideQuery,
): string | null {
  const href = ordersNewHrefForLoginReturn(guideId, trip);
  if (!href) return null;
  return `/auth/login?returnUrl=${encodeURIComponent(href)}`;
}

/** 完整登录链（回向导详情）；`guideId` 无效时返回 `null`。 */
export function authLoginHrefForGuideDetailReturn(guideId: string): string | null {
  const detail = guideDetailHrefForOrdersNewLoginReturn(guideId);
  if (!detail) return null;
  return `/auth/login?returnUrl=${encodeURIComponent(detail)}`;
}
