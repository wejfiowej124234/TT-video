import type { ItineraryBlock, OrderRow } from "./types";

/** 与 GET /api/v1/orders/:id/messages items[] 对齐 */
export type OrderChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_avatar_url?: string | null;
  sender_name?: string | null;
};

/** Escrow 页传入可避免 `OrderChatContextCard` 重复 GET order（须与 `orderId` 一致） */
export type ChatBlockOrderContextInline = { order: OrderRow; itinerary: ItineraryBlock | null } | null | undefined;
