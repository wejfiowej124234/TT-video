/**
 * 从列表 / 市场 / 抽屉 / Landing / 社区 / 创建流程进入托管页时，用已持有的 order/itinerary 做首屏预填；
 * 进入页后 consume 一次；权威数据仍以 GET /orders/:id 为准（07 §5.1）。
 *
 * 台账：627～810 批见 07 §六 6.4；87 §11.1.1 列 rg stashEscrow / 单测；DID 榜目录 components/did-rank、app/did-rank 勿引用本模块（scripts/check-did-rank-no-escrow-prefetch.sh）；新增 Link 预填须专名 export + Vitest。
 * **641 机读**：`OrderChatContextCard.tsx` 内 `rg stash` 仅 `stashEscrowOrderPrefetchFromOrderAndItinerary`（import + 三处 onClick），勿强并其它 `stash*`。
 * **勿强并**：`OrderChatContextCard` 等处的 `itinerary` / `?? null` 三分支语义须保留，勿收束为单闭包。
 *
 * **导出族（速查）**：`MinimalIfAbsent` / `FromOrderIdOnly`；`ForOrderIdNav` / `ForFromOrderDeepLink` / `ForPayHubEscrowNav` / `ForRatingPageMainNav`；
 * `FromOrderResponse` / `FromOrderAndItinerary`；`FromListItem` / `FromMarketCard` / `FromDetailDrawer`；`FromAdminOrderListRow` / `FromAdminOrderDetailBody`；
 * `FromItineraryCreateResult` / `FromPostOrderSuccess`；`consumeEscrowOrderPrefetch` / `clearEscrowOrderPrefetch`。
 */

import type { OrderListItem } from "@/lib/apiClient/orders";
import type { OrderCardItem } from "@/lib/marketTypes";
import type { ItineraryBlock, OrderResponse, OrderRow } from "@/components/escrow/EscrowDetail/types";

const PREFIX = "tt_escrow_order_pf:v1:";
const TTL_MS = 5 * 60 * 1000;

function keyFor(orderId: string): string {
  return `${PREFIX}${orderId}`;
}

function writePrefetch(orderId: string, order: OrderRow, itinerary: ItineraryBlock | null): void {
  if (typeof window === "undefined" || !orderId) return;
  try {
    window.sessionStorage.setItem(
      keyFor(String(orderId)),
      JSON.stringify({ ts: Date.now(), order, itinerary }),
    );
  } catch {
    /* quota / private mode */
  }
}

function hasFreshEscrowPrefetch(orderId: string): boolean {
  if (typeof window === "undefined" || !orderId) return false;
  try {
    const raw = window.sessionStorage.getItem(keyFor(String(orderId)));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { ts?: number };
    return typeof parsed.ts === "number" && Date.now() - parsed.ts <= TTL_MS;
  } catch {
    return false;
  }
}

/**
 * 仅当该订单尚无**未过期**预填时写入 `{ id }` 级最小快照。
 * 用于支付页、评分页等：避免在 GET /orders/:id 未完成时用空快照覆盖列表/市场/托管已写入的 richer 数据（07 §5.1）。
 */
export function stashEscrowOrderPrefetchMinimalIfAbsent(orderId: string): void {
  if (!orderId || hasFreshEscrowPrefetch(orderId)) return;
  stashEscrowOrderPrefetchFromOrderIdOnly(orderId);
}

export function orderListItemToEscrowPrefetchOrder(item: OrderListItem): OrderRow {
  return {
    id: String(item.id),
    state: item.state,
    status: item.status,
    sub_status: item.sub_status,
    amount: item.amount,
    currency: item.currency,
    escrow_address: item.escrow_address ?? null,
    destination: item.destination,
    city: item.city,
    country: item.country,
    travel_date: item.travel_date ?? undefined,
    days: item.days,
    image: item.image ?? undefined,
    tourist_id: item.tourist_id,
    traveler_id: item.traveler_id ?? item.tourist_id,
    guide_id: item.guide_id,
    created_at: item.created_at,
  };
}

/** 我的订单列表 → 托管 */
export function stashEscrowOrderPrefetchFromListItem(item: OrderListItem): void {
  if (!item?.id) return;
  writePrefetch(
    String(item.id),
    orderListItemToEscrowPrefetchOrder(item),
    (item.itinerary ?? null) as ItineraryBlock | null,
  );
}

/** Discover / 自由市场卡片 → 托管（与 GET discover/orders item 同形） */
export function orderCardItemToEscrowPrefetchOrder(item: OrderCardItem): OrderRow {
  return {
    id: String(item.id),
    state: item.state,
    status: item.status,
    sub_status: item.sub_status,
    destination: item.destination,
    country: item.country,
    city: item.city,
    days: item.days,
    amount: item.amount,
    currency: item.currency,
    escrow_address: item.escrow_address ?? null,
    image: item.image ?? undefined,
    tourist_id: item.tourist_id,
    traveler_id: item.traveler_id ?? item.tourist_id,
    guide_id: item.guide_id,
    created_at: item.created_at ?? undefined,
  };
}

export function stashEscrowOrderPrefetchFromMarketCard(item: OrderCardItem): void {
  if (!item?.id) return;
  writePrefetch(
    String(item.id),
    orderCardItemToEscrowPrefetchOrder(item),
    (item.itinerary ?? null) as ItineraryBlock | null,
  );
}

/** 与 OrderDetailDrawer 的 OrderDetailItem 结构兼容（避免 lib ↔ 抽屉循环依赖） */
export type EscrowPrefetchFromDetailLike = {
  id: string;
  state?: string;
  status?: string;
  sub_status?: string;
  amount?: string;
  currency?: string;
  destination?: string;
  country?: string;
  city?: string;
  days?: number;
  version?: number;
  image?: string | null;
  escrow_address?: string | null;
  itinerary?: ItineraryBlock | null;
};

/** 市场行程抽屉「进托管」→ 与 displayOrder 一致（含 getOrder 合并后 enriched） */
export function orderDetailLikeToEscrowPrefetchOrder(order: EscrowPrefetchFromDetailLike): OrderRow {
  return {
    id: String(order.id),
    state: order.state,
    status: order.status,
    sub_status: order.sub_status,
    amount: order.amount,
    currency: order.currency,
    escrow_address: order.escrow_address ?? null,
    destination: order.destination,
    country: order.country,
    city: order.city,
    days: order.days,
    image: order.image ?? undefined,
    version: order.version,
  };
}

export function stashEscrowOrderPrefetchFromDetailDrawer(order: EscrowPrefetchFromDetailLike): void {
  if (!order?.id) return;
  writePrefetch(
    String(order.id),
    orderDetailLikeToEscrowPrefetchOrder(order),
    (order.itinerary ?? null) as ItineraryBlock | null,
  );
}

/** GET /orders/:id 形（Landing 解锁卡 orderDetails、其它已持完整响应处） */
export function stashEscrowOrderPrefetchFromOrderResponse(
  orderId: string,
  res: OrderResponse | null | undefined,
): void {
  if (!orderId || !res) return;
  const o = res.order;
  const row: OrderRow =
    o && o.id
      ? { ...o, id: String(o.id) }
      : o
        ? { ...o, id: String(orderId) }
        : { id: String(orderId) };
  writePrefetch(String(orderId), row, (res.itinerary ?? null) as ItineraryBlock | null);
}

/** 管理端订单详情 GET 已返回 `order` + `itinerary` 时，Escrow / Pay 双链共用同一预填入口 */
export function stashEscrowOrderPrefetchFromAdminOrderDetailBody(
  orderId: string,
  order: unknown,
  itinerary: unknown,
): void {
  stashEscrowOrderPrefetchFromOrderResponse(orderId, {
    order: order as OrderResponse["order"],
    itinerary: (itinerary ?? null) as OrderResponse["itinerary"],
  });
}

/** 社区订单上下文卡等：内存中已有 order + itinerary */
export function stashEscrowOrderPrefetchFromOrderAndItinerary(
  orderId: string,
  order: OrderRow | null,
  itinerary: ItineraryBlock | null,
): void {
  if (!orderId) return;
  const row: OrderRow =
    order && (order.id != null || orderId)
      ? { ...order, id: String(order.id ?? orderId) }
      : { id: String(orderId) };
  writePrefetch(String(orderId), row, itinerary);
}

/** 仅持有 orderId 时写入最小预填（覆盖同名 session 项；Pay 链侧优先用 stashEscrowOrderPrefetchMinimalIfAbsent 以免盖掉富快照） */
export function stashEscrowOrderPrefetchFromOrderIdOnly(orderId: string): void {
  if (!orderId) return;
  stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, null, null);
}

/** 仅 orderId：`escrow`→`FromOrderIdOnly`，`pay`→`MinimalIfAbsent`（627；与 `ForFromOrderDeepLink` 无 GET 体分支同语义） */
export function stashEscrowOrderPrefetchForOrderIdNav(
  orderId: string,
  branch: "escrow" | "pay",
): void {
  if (!orderId) return;
  if (branch === "escrow") stashEscrowOrderPrefetchFromOrderIdOnly(orderId);
  else stashEscrowOrderPrefetchMinimalIfAbsent(orderId);
}

/** `/itinerary/new?fromOrder=`：已拉 GET 则双链走 `FromOrderResponse`；否则 Escrow 最小行、Pay `MinimalIfAbsent`（与 627 语义一致） */
export function stashEscrowOrderPrefetchForFromOrderDeepLink(
  orderId: string,
  full: OrderResponse | null | undefined,
  branch: "escrow" | "pay",
): void {
  if (!orderId) return;
  if (full) {
    stashEscrowOrderPrefetchFromOrderResponse(orderId, full);
    return;
  }
  stashEscrowOrderPrefetchForOrderIdNav(orderId, branch);
}

/** `/pay`：跳转托管前已拉 GET 则 `FromOrderResponse`，否则 `MinimalIfAbsent`（Pay 链勿盖富快照 · 07 §5.1） */
export function stashEscrowOrderPrefetchForPayHubEscrowNav(
  orderId: string,
  full: OrderResponse | null | undefined,
): void {
  if (!orderId) return;
  if (full) stashEscrowOrderPrefetchFromOrderResponse(orderId, full);
  else stashEscrowOrderPrefetchMinimalIfAbsent(orderId);
}

/** `escrow/[id]/rate`：回主托管页 — 全量 GET、仅 order 头、或 `MinimalIfAbsent` */
export function stashEscrowOrderPrefetchForRatingPageMainNav(
  orderId: string,
  full: OrderResponse | null | undefined,
  orderHead: OrderRow | null | undefined,
): void {
  if (!orderId) return;
  if (full?.order) {
    stashEscrowOrderPrefetchFromOrderResponse(orderId, full);
    return;
  }
  if (orderHead) {
    stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, orderHead, null);
    return;
  }
  stashEscrowOrderPrefetchMinimalIfAbsent(orderId);
}

/** 管理端订单列表行 → Escrow / Pay 导航前 session 预填（无 itinerary） */
export function stashEscrowOrderPrefetchFromAdminOrderListRow(o: {
  id: string;
  state: string;
  amount: string;
  currency: string;
  tourist_id?: string;
  traveler_id?: string;
  guide_id?: string;
  created_at?: string;
  escrow_address?: string | null;
}): void {
  if (!o?.id) return;
  stashEscrowOrderPrefetchFromOrderAndItinerary(
    o.id,
    {
      id: o.id,
      state: o.state,
      amount: o.amount,
      currency: o.currency,
      tourist_id: o.tourist_id,
      traveler_id: o.traveler_id ?? o.tourist_id,
      guide_id: o.guide_id,
      created_at: o.created_at,
      escrow_address: o.escrow_address ?? null,
    },
    null,
  );
}

/** POST /itineraries 成功响应（/itinerary/new 结果区） */
export function stashEscrowOrderPrefetchFromItineraryCreateResult(
  orderId: string,
  res: {
    version?: number;
    order_status?: string;
    status?: string;
    daily_itinerary?: ItineraryBlock["daily_itinerary"];
    amount_breakdown?: ItineraryBlock["amount_breakdown"];
  },
): void {
  if (!orderId) return;
  const status = res.order_status ?? res.status;
  const order: OrderRow = {
    id: String(orderId),
    status: typeof status === "string" ? status : undefined,
    version: res.version,
  };
  const hasItin =
    (res.daily_itinerary && res.daily_itinerary.length > 0) || res.amount_breakdown != null;
  const itinerary: ItineraryBlock | null = hasItin
    ? {
        version: res.version,
        daily_itinerary: res.daily_itinerary,
        amount_breakdown: res.amount_breakdown,
      }
    : null;
  writePrefetch(String(orderId), order, itinerary);
}

/** `POST /api/v1/orders` 创建成功，仅有 id 与表单头字段 */
export function stashEscrowOrderPrefetchFromPostOrderSuccess(params: {
  id: string;
  amount?: string;
  currency?: string;
  guide_id?: string;
}): void {
  if (!params.id) return;
  writePrefetch(
    String(params.id),
    {
      id: String(params.id),
      amount: params.amount,
      currency: params.currency,
      guide_id: params.guide_id,
    },
    null,
  );
}

export type EscrowOrderPrefetchPayload = {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
};

/** 权限失败 / 换账号时主动丢弃预填，避免 403 前闪出他人订单壳 */
export function clearEscrowOrderPrefetch(orderId: string): void {
  if (typeof window === "undefined" || !orderId) return;
  try {
    window.sessionStorage.removeItem(keyFor(String(orderId)));
  } catch {
    /* private mode */
  }
}

/** 托管页挂载时读取并删除；过期或损坏返回 null */
export function consumeEscrowOrderPrefetch(orderId: string): EscrowOrderPrefetchPayload | null {
  if (typeof window === "undefined" || !orderId) return null;
  const k = keyFor(orderId);
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(k);
    if (raw) window.sessionStorage.removeItem(k);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      ts?: number;
      order?: OrderRow;
      itinerary?: ItineraryBlock | null;
    };
    if (typeof parsed.ts !== "number" || Date.now() - parsed.ts > TTL_MS) return null;
    const order = parsed.order;
    if (!order || String(order.id) !== String(orderId)) return null;
    return {
      order: { ...order, id: String(orderId) },
      itinerary: parsed.itinerary ?? null,
    };
  } catch {
    return null;
  }
}
