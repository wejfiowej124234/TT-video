/**
 * Order / card / drawer 形 → 托管预填 `OrderRow` 映射（`orderEscrowPrefetch` 子模块）。
 */

import type { OrderListItem } from "@/lib/apiClient/orders";
import type { OrderCardItem } from "@/lib/marketTypes";
import type { ItineraryBlock, OrderResponse, OrderRow } from "@/components/escrow/EscrowDetail/types";

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

export function orderRowFromOrderResponse(orderId: string, res: OrderResponse): OrderRow {
  const o = res.order;
  return o && o.id ? { ...o, id: String(o.id) } : o ? { ...o, id: String(orderId) } : { id: String(orderId) };
}
