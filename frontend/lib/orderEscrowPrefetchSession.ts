/**
 * SessionStorage 读写与 TTL（`orderEscrowPrefetch` 子模块；对外仍从 `@/lib/orderEscrowPrefetch` 导入）。
 */

import type { ItineraryBlock, OrderRow } from "@/components/escrow/EscrowDetail/types";

const PREFIX = "tt_escrow_order_pf:v1:";
const TTL_MS = 5 * 60 * 1000;

function keyFor(orderId: string): string {
  return `${PREFIX}${orderId}`;
}

export function writePrefetch(orderId: string, order: OrderRow, itinerary: ItineraryBlock | null): void {
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

export function hasFreshEscrowPrefetch(orderId: string): boolean {
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

export type EscrowOrderPrefetchPayload = {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
};

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
