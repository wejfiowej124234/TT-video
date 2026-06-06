import { MARKET_BIND_GUIDE_ORDER_QUERY } from "@/lib/marketDeepLink";

/**
 * 5.1 / 53：从市场或「预约向导」入口直达创建订单并预填 `guide_id`（与 `app/orders/new/page.tsx` 一致）。
 */
export function ordersNewHrefForGuide(guideId: string): string {
  const q = new URLSearchParams();
  q.set("guide_id", guideId.trim());
  return `/orders/new?${q.toString()}`;
}

/** 5.2 / 自由市场：带 `guide_id` 打开市场，自定义行程提交走 `POST /itineraries/custom`（与 `useMarketPage` 一致）。 */
export function marketHrefForGuideCustomItinerary(guideId: string): string {
  const q = new URLSearchParams();
  q.set("guide_id", guideId.trim());
  return `/market?${q.toString()}`;
}

/** Escrow 草稿：双栏市场 + 为既有订单绑定向导（左栏可见本单 · 右栏选向导） */
export function marketHrefForEscrowGuideBind(orderId: string): string {
  const q = new URLSearchParams();
  q.set("view", "split");
  q.set(MARKET_BIND_GUIDE_ORDER_QUERY, orderId.trim());
  return `/market?${q.toString()}`;
}

/**
 * B-059：`/orders/new?guide_id=` 遇 `login_required` 时，登录成功应回到对应向导详情（与 `/guides/[id]` 预订链一致）。
 */
export function guideDetailHrefForOrdersNewLoginReturn(guideId: string): string | null {
  const id = guideId.trim();
  if (!id) return null;
  return `/guides/${encodeURIComponent(id)}`;
}

/** 完整登录链；`guideId` 无效时返回 `null`（调用方走默认错误 UX）。 */
export function authLoginHrefForGuideDetailReturn(guideId: string): string | null {
  const detail = guideDetailHrefForOrdersNewLoginReturn(guideId);
  if (!detail) return null;
  return `/auth/login?returnUrl=${encodeURIComponent(detail)}`;
}
