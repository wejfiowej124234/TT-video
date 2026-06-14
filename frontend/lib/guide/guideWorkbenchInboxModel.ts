import type { OrderListItem } from "@/lib/apiClient";
import { filterOrdersForGuideReception } from "@/lib/guide/guideOrderCorridorModel";
import {
  normalizedOrderListItemState,
  orderListItemIsInProgress,
} from "@/lib/orders/ordersListStateFilter";

export {
  GUIDE_WORKBENCH_INBOX_L5_FROZEN,
  GUIDE_WORKBENCH_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_L5_FROZEN_MARKER,
} from "./guideWorkbenchL5ClosureSprintModel";

export type GuideWorkbenchInboxNextOrder = {
  id: string;
  state: string;
  destinationLabel: string;
  travelDateLine: string | null;
  primaryAction: "accept" | "enter_escrow";
  travelerLabel: string;
  amountLine: string;
  statusLabelKey: string;
};

export type GuideWorkbenchInboxSnapshot = {
  pendingAcceptCount: number;
  todayPendingCount: number;
  nextOrder: GuideWorkbenchInboxNextOrder | null;
};

function localTodayYmd(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function orderTravelDateYmd(item: OrderListItem): string | null {
  const raw = item.travel_date?.trim();
  if (!raw) return null;
  return raw.slice(0, 10);
}

export function orderDestinationLabelForGuideInbox(item: OrderListItem): string {
  const dest = item.destination ?? item.city ?? item.country ?? item.id;
  return String(dest ?? "").trim() || String(item.id ?? "");
}

export function orderTravelerLabelForGuideInbox(item: OrderListItem): string {
  const nick = item.traveler_nickname?.trim();
  if (nick) return nick;
  const legacy = (item as { tourist_nickname?: string }).tourist_nickname?.trim();
  if (legacy) return legacy;
  return "";
}

export function orderAmountLineForGuideInbox(item: OrderListItem): string {
  const amount = item.amount?.trim();
  if (!amount) return "";
  const currency = item.currency?.trim() || "USDC";
  return `${amount} ${currency}`;
}

/** 向导收件箱：待接单 / 待确认 / 进行中（短标签 i18n 键） */
export function guideWorkbenchInboxStatusLabelKey(item: OrderListItem): string {
  const state = normalizedOrderListItemState(item);
  const sub = (item.sub_status ?? "").trim().toLowerCase();
  if (state === "created") return "guide_workbench_status_pending_accept";
  if (state === "accepted" && sub === "pending_bilateral") {
    return "guide_workbench_status_pending_confirm";
  }
  if (orderListItemIsInProgress(item)) return "guide_workbench_status_in_progress";
  return "guide_workbench_status_in_progress";
}

function isTodayPendingGuideAction(item: OrderListItem, today: string): boolean {
  const state = normalizedOrderListItemState(item);
  if (state === "created") return true;
  const sub = (item.sub_status ?? "").trim().toLowerCase();
  if (state === "accepted" && sub === "pending_bilateral") return true;
  const travelYmd = orderTravelDateYmd(item);
  if (travelYmd === today && orderListItemIsInProgress(item)) return true;
  return false;
}

function nextOrderPriority(item: OrderListItem): number {
  const state = normalizedOrderListItemState(item);
  const sub = (item.sub_status ?? "").trim().toLowerCase();
  if (state === "created") return 0;
  if (state === "accepted" && sub === "pending_bilateral") return 1;
  return 2;
}

export function buildGuideWorkbenchNextOrderFromItem(item: OrderListItem): GuideWorkbenchInboxNextOrder {
  const state = normalizedOrderListItemState(item);
  return {
    id: String(item.id),
    state,
    destinationLabel: orderDestinationLabelForGuideInbox(item),
    travelDateLine: item.travel_date?.trim() ? item.travel_date.trim() : null,
    primaryAction: state === "created" ? "accept" : "enter_escrow",
    travelerLabel: orderTravelerLabelForGuideInbox(item),
    amountLine: orderAmountLineForGuideInbox(item),
    statusLabelKey: guideWorkbenchInboxStatusLabelKey(item),
  };
}

/** 向导工作台首屏收件箱：待接单 / 今日待处理 / 下一单（① · `guide_id` SSOT） */
export function buildGuideWorkbenchInboxSnapshot(
  items: readonly OrderListItem[],
  guideRowId: string | null | undefined,
  now: Date = new Date(),
): GuideWorkbenchInboxSnapshot {
  const tripItems = filterOrdersForGuideReception(items, guideRowId);
  const today = localTodayYmd(now);
  const inProgress = tripItems.filter(orderListItemIsInProgress);
  const pendingAccept = inProgress.filter((o) => normalizedOrderListItemState(o) === "created");
  const todayPending = inProgress.filter((o) => isTodayPendingGuideAction(o, today));

  const ranked = [...todayPending].sort((a, b) => {
    const pa = nextOrderPriority(a);
    const pb = nextOrderPriority(b);
    if (pa !== pb) return pa - pb;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });

  const top = ranked[0];
  const nextOrder: GuideWorkbenchInboxNextOrder | null =
    top?.id != null && String(top.id).trim() ? buildGuideWorkbenchNextOrderFromItem(top) : null;

  return {
    pendingAcceptCount: pendingAccept.length,
    todayPendingCount: todayPending.length,
    nextOrder,
  };
}
