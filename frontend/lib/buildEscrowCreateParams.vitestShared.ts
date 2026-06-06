import type { ItineraryBlock, OrderRow } from "@/components/escrow/EscrowDetail/types";

export const ORDER_UUID = "11111111-1111-1111-1111-111111111111";
export const SNAP32 = `0x${"ab".repeat(32)}` as `0x${string}`;
export const ADDR = (n: number) =>
  `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

export function baseOrder(over: Partial<OrderRow> = {}): OrderRow {
  return {
    id: ORDER_UUID,
    amount: "100",
    travel_date: "2026-06-01",
    days: 3,
    ...over,
  };
}

export function buildEscrowCreateParamsTestBase() {
  return {
    itinerary: null as ItineraryBlock | null,
    snapshotHash: SNAP32,
    traveler: ADDR(1),
    guide: ADDR(2),
    token: ADDR(3),
    arbitrator: ADDR(4),
    chainId: BigInt(137),
    disputeWindowSeconds: 86_400,
  };
}
