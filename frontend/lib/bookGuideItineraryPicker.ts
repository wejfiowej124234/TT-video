/**
 * GD-L5-P3 · BookGuideModal itinerary-first 行程选择（①）
 */
import type { OrderCardItem } from "@/lib/marketTypes";
import { isOwnPublishedOpenListing } from "@/lib/marketBindOrderList";
import { isAssignedGuideId } from "@/lib/isAssignedGuideId";
import {
  fetchOwnPublishedMarketCards,
  invalidateOwnPublishedMarketCardsCache,
  resolveMarketViewerUserId,
} from "@/lib/marketDiscoverOrdersMerge";
import { buildMarketOrderItineraryTeaserFallback } from "@/lib/marketDisplayCopy";

/** 下拉仅展示：本人 · 已发布 · 尚未指派向导 */
export function filterBindableOwnItineraryOrders(
  cards: readonly OrderCardItem[],
  ownUserId?: string,
): OrderCardItem[] {
  const ownId = resolveMarketViewerUserId(ownUserId);
  if (!ownId) return [];
  return cards.filter(
    (c) => isOwnPublishedOpenListing(c, ownId) && !isAssignedGuideId(c.guide_id),
  );
}

export async function fetchBindableOwnItineraryOrders(options?: {
  bustCache?: boolean;
}): Promise<OrderCardItem[]> {
  if (options?.bustCache) invalidateOwnPublishedMarketCardsCache();
  const ownId = resolveMarketViewerUserId();
  if (!ownId) return [];
  const cards = await fetchOwnPublishedMarketCards();
  return filterBindableOwnItineraryOrders(cards, ownId);
}

/** 行程优先绑定向导：URL > Landing 最近预览 > 列表首条 */
export function pickDefaultBindOrderId(
  bindable: readonly OrderCardItem[],
  preferredIds?: readonly string[],
): string {
  if (bindable.length === 0) return "";
  const bindSet = new Set(bindable.map((c) => String(c.id)));
  for (const raw of preferredIds ?? []) {
    const id = String(raw ?? "").trim();
    if (id && bindSet.has(id)) return id;
  }
  return String(bindable[0]!.id);
}

/** 行程已 confirm-final-plan（`snapshot_hash` 非空）时不可再 PATCH guide */
export function orderItineraryConfirmedFromGetOrderPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const row = data as Record<string, unknown>;
  const itinerary = row.itinerary;
  if (!itinerary || typeof itinerary !== "object") return false;
  const snap = (itinerary as Record<string, unknown>).snapshot_hash;
  return typeof snap === "string" && snap.trim().length > 0;
}

/** `GET /orders/:id` 成功体上的 `guide_id`（与 Escrow 同源） */
export function guideIdFromOrderPayload(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const row = data as Record<string, unknown>;
  const order = row.order;
  if (order && typeof order === "object") {
    const g = (order as Record<string, unknown>).guide_id;
    if (typeof g === "string" && g.trim()) return g.trim();
  }
  const g = row.guide_id;
  return typeof g === "string" ? g.trim() : "";
}

export function formatBookGuideItineraryOptionLabel(
  item: OrderCardItem,
  t: (key: string) => string,
): string {
  const teaser =
    buildMarketOrderItineraryTeaserFallback(item, t) ||
    item.route_label?.trim() ||
    item.city?.trim() ||
    item.destination?.trim() ||
    t("book_guide_itineraryOptionFallback");
  const shortId = String(item.id).slice(0, 8);
  return `${teaser} · #${shortId}`;
}
