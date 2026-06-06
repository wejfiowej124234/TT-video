import type { AmountBreakdownUnified } from "@/lib/itineraryUnified";

export const UNIFIED_ITINERARY_AMOUNT_KEYS: { key: keyof AmountBreakdownUnified; i18n: string }[] = [
  { key: "hotel", i18n: "escrow_hotel" },
  { key: "catering", i18n: "escrow_catering" },
  { key: "tickets", i18n: "escrow_tickets" },
  { key: "guide_fee", i18n: "escrow_guideFee" },
  { key: "vehicle", i18n: "escrow_vehicle" },
  { key: "platform_fee", i18n: "escrow_platformFee" },
];

export function formatUnifiedItineraryAmount(v: number | undefined | null, dash: string): string {
  if (v == null || Number.isNaN(v)) return dash;
  const n = Math.round(v * 100) / 100;
  return n.toFixed(2);
}
