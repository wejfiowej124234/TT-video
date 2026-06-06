import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import type { OrderDetailItem } from "./orderDetailDrawerModel";

type GetOrderDrawerLikeResponse = {
  order?: Record<string, unknown>;
  itinerary?: {
    daily_itinerary?: unknown[];
    amount_breakdown?: Record<string, unknown>;
  };
};

/**
 * 将 `getOrder` 返回体合并进列表侧 `base`（缺行程时返回 `null`，与 hook 内原语义一致）。
 */
export function buildEnrichedOrderDetailFromGetOrderResponse(
  base: OrderDetailItem,
  data: unknown,
): OrderDetailItem | null {
  const typed = data as GetOrderDrawerLikeResponse;
  const itinerary = typed?.itinerary;
  if (!itinerary) return null;

  const apiOrder = typed?.order;
  const escrowFromApi =
    typeof apiOrder?.escrow_address === "string" ? apiOrder.escrow_address : undefined;
  const stateFromApi = typeof apiOrder?.state === "string" ? apiOrder.state : undefined;
  const daily = Array.isArray(itinerary.daily_itinerary) ? itinerary.daily_itinerary : [];
  const ab = itinerary.amount_breakdown;

  const merged: OrderDetailItem = {
    ...base,
    escrow_address: escrowFromApi ?? base.escrow_address,
    state: stateFromApi ?? base.state,
    itinerary: {
      daily_itinerary: daily as UnifiedDayRow[],
      amount_breakdown: ab
        ? {
            hotel: typeof ab.hotel === "number" ? ab.hotel : undefined,
            catering: typeof ab.catering === "number" ? ab.catering : undefined,
            tickets: typeof ab.tickets === "number" ? ab.tickets : undefined,
            guide_fee: typeof ab.guide_fee === "number" ? ab.guide_fee : undefined,
            vehicle: typeof ab.vehicle === "number" ? ab.vehicle : undefined,
            platform_fee: typeof ab.platform_fee === "number" ? ab.platform_fee : undefined,
            total_budget: typeof ab.total_budget === "number" ? ab.total_budget : undefined,
          }
        : undefined,
    },
    breakdown:
      ab && typeof ab.total_budget === "number"
        ? {
            hotel: typeof ab.hotel === "number" ? ab.hotel : undefined,
            catering: typeof ab.catering === "number" ? ab.catering : undefined,
            food: typeof ab.catering === "number" ? ab.catering : undefined,
            tickets: typeof ab.tickets === "number" ? ab.tickets : undefined,
            guideFee: typeof ab.guide_fee === "number" ? ab.guide_fee : undefined,
            vehicle: typeof ab.vehicle === "number" ? ab.vehicle : undefined,
            platform_fee: typeof ab.platform_fee === "number" ? ab.platform_fee : undefined,
            total_budget: ab.total_budget,
          }
        : base.breakdown ?? undefined,
  };
  return merged;
}

/**
 * 托管轮询 `getOrder` 后，仅 state/status/sub_status/escrow_address 增量 patch；无变化时返回同一 `prev` 引用。
 */
export function computeEscrowSyncPatchAfterPoll(
  prev: Partial<OrderDetailItem> | null | undefined,
  apiOrder: Record<string, unknown>,
): Partial<OrderDetailItem> {
  const candidate: Partial<OrderDetailItem> = { ...(prev ?? {}) };
  if (typeof apiOrder.state === "string") candidate.state = apiOrder.state;
  if (typeof apiOrder.status === "string") candidate.status = apiOrder.status;
  if (typeof apiOrder.sub_status === "string") candidate.sub_status = apiOrder.sub_status;
  if (typeof apiOrder.escrow_address === "string") {
    candidate.escrow_address = apiOrder.escrow_address;
  } else if (apiOrder.escrow_address === null) {
    candidate.escrow_address = null;
  }
  if (
    prev &&
    candidate.state === prev.state &&
    candidate.status === prev.status &&
    candidate.sub_status === prev.sub_status &&
    candidate.escrow_address === prev.escrow_address
  ) {
    return prev;
  }
  return candidate;
}
