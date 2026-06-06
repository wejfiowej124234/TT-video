import type { ItineraryBlock } from "@/components/escrow/EscrowDetail/types";

export type OrderChatContextCardLayout = "community-page" | "escrow-embedded";

export type OrderChatContextDailyRow = NonNullable<ItineraryBlock["daily_itinerary"]>[number] & {
  city?: string;
  description?: string;
  content_text?: string;
};
