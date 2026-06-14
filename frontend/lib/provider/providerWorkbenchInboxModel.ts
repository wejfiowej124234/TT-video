import type { OrderListItem } from "@/lib/apiClient";
import { filterOrdersForMerchantSellerService } from "@/lib/provider/merchantOrderCorridorModel";
import {
  orderAmountLineForGuideInbox,
  orderDestinationLabelForGuideInbox,
  orderTravelerLabelForGuideInbox,
} from "@/lib/guide/guideWorkbenchInboxModel";
import {
  normalizedOrderListItemState,
  orderListItemIsInProgress,
} from "@/lib/orders/ordersListStateFilter";

export const PROVIDER_WORKBENCH_L5_PROBE = "provider-workbench-v1" as const;

export type ProviderWorkbenchNextOrder = {
  id: string;
  buyerLabel: string;
  destinationLabel: string;
  travelDateLine: string | null;
  amountLine: string;
  statusLabelKey: string;
};

export type ProviderWorkbenchInboxSnapshot = {
  pendingFulfillmentCount: number;
  inProgressCount: number;
  nextOrder: ProviderWorkbenchNextOrder | null;
};

function providerStatusLabelKey(item: OrderListItem): string {
  const state = normalizedOrderListItemState(item);
  if (state === "created") return "provider_workbench_status_new_order";
  if (orderListItemIsInProgress(item)) return "provider_workbench_status_in_progress";
  return "provider_workbench_status_in_progress";
}

function buildNextOrder(item: OrderListItem): ProviderWorkbenchNextOrder {
  return {
    id: String(item.id),
    buyerLabel: orderTravelerLabelForGuideInbox(item),
    destinationLabel: orderDestinationLabelForGuideInbox(item),
    travelDateLine: item.travel_date?.trim() ? item.travel_date.trim() : null,
    amountLine: orderAmountLineForGuideInbox(item),
    statusLabelKey: providerStatusLabelKey(item),
  };
}

export function buildProviderWorkbenchInboxSnapshot(
  allItems: readonly OrderListItem[],
): ProviderWorkbenchInboxSnapshot {
  const items = filterOrdersForMerchantSellerService(allItems);
  const inProgress = items.filter(orderListItemIsInProgress);
  const pendingFulfillment = inProgress.filter(
    (o) => normalizedOrderListItemState(o) === "created",
  );
  const ranked = [...inProgress].sort((a, b) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
  const next = ranked[0] ?? null;
  return {
    pendingFulfillmentCount: pendingFulfillment.length,
    inProgressCount: inProgress.length,
    nextOrder: next ? buildNextOrder(next) : null,
  };
}
