/**
 * F-020 · `/` + `/market` 星标：localStorage SSOT + 已登录时 best-effort 同步 `GET/POST/DELETE …/me/market-bookmarks`。
 * ② 跨设备 SLA · ③ 生产持久化：WEB3-P2-009 / MKT-FILT-P2-009 / WEB3-P3-006。
 */

import {
  deleteMarketTravelBookmark,
  getMarketTravelBookmarks,
  postMarketTravelBookmark,
} from "@/lib/apiClient/marketTravelBookmarks";
import { AUTH_SESSION_TOKEN_KEY } from "@/lib/apiClient/core";
import {
  FAV_GUIDES_KEY,
  FAV_ORDERS_KEY,
  loadFavSet,
  saveFavSet,
} from "@/lib/marketFavoritesStorage";

export function hasMarketAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim());
}

function mergeRemoteIntoLocal(
  orderIds: readonly string[],
  guideIds: readonly string[],
): void {
  const mergedOrders = loadFavSet(FAV_ORDERS_KEY);
  for (const id of orderIds) {
    const trimmed = id.trim();
    if (trimmed) mergedOrders.add(trimmed);
  }
  saveFavSet(FAV_ORDERS_KEY, mergedOrders);

  const mergedGuides = loadFavSet(FAV_GUIDES_KEY);
  for (const id of guideIds) {
    const trimmed = id.trim();
    if (trimmed) mergedGuides.add(trimmed);
  }
  saveFavSet(FAV_GUIDES_KEY, mergedGuides);
}

/** 已登录：拉取账户星标并与本机 union；未登录或 401：静默成功。 */
export async function pullMarketTravelBookmarksIntoLocal(): Promise<{ ok: boolean; errorKey?: string }> {
  if (!hasMarketAuthSession()) return { ok: true };
  try {
    const data = await getMarketTravelBookmarks();
    mergeRemoteIntoLocal(data.order_ids ?? [], data.guide_ids ?? []);
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "login_required") return { ok: true };
    return { ok: false, errorKey: err instanceof Error ? err.message : "sync_failed" };
  }
}

export async function pushMarketOrderBookmarkToggle(orderId: string, favorited: boolean): Promise<void> {
  if (!hasMarketAuthSession()) return;
  if (favorited) await postMarketTravelBookmark("order", orderId);
  else await deleteMarketTravelBookmark("order", orderId);
}

export async function pushMarketGuideBookmarkToggle(guideId: string, favorited: boolean): Promise<void> {
  if (!hasMarketAuthSession()) return;
  if (favorited) await postMarketTravelBookmark("guide", guideId);
  else await deleteMarketTravelBookmark("guide", guideId);
}
