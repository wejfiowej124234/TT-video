/**
 * 自由市场 discover 列表 + 旅客本单「已发布·待选向导」合并（与 `/orders` 分页列表对拍）。
 * SSOT：避免 discover 只返回部分本单、或筛选误伤后 banner/左栏计数不一致。
 */
import type { OrderListItem } from "@/lib/apiClient";
import { getOrders } from "@/lib/apiClient";
import { AUTH_USER_ID_KEY } from "@/lib/apiClient/core";
import type { OrderCardItem } from "@/lib/marketTypes";
import { mergeListsUniqueById } from "@/lib/dedupeListById";
import { discoverOrderDedupeKey } from "@/lib/discoverOrderDedupeKey";
import {
  isDiscoverMarketPublishedListing,
  isOwnPublishedOpenListing,
  orderListItemToMarketCard,
} from "@/lib/marketBindOrderList";

export function resolveMarketViewerUserId(ownUserId?: string): string {
  const explicit = ownUserId?.trim() ?? "";
  if (explicit) return explicit;
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_USER_ID_KEY)?.trim() ?? "";
}

/** 登录旅客浏览 discover：隐藏他人单；保留本单「待选向导」与 Escrow 深链 pin。 */
export function filterDiscoverOrdersForViewer(
  items: OrderCardItem[],
  bindGuideOrderId = "",
  ownUserId?: string,
): OrderCardItem[] {
  const ownId = resolveMarketViewerUserId(ownUserId);
  const keepId = bindGuideOrderId.trim();
  return items.filter((o) => {
    if (keepId && String(o.id) === keepId) return true;
    if (!ownId) return true;
    const tid = o.traveler_id ?? o.tourist_id;
    if (tid && String(tid) === ownId) {
      return isOwnPublishedOpenListing(o, ownId);
    }
    return isDiscoverMarketPublishedListing(o);
  });
}

export function ownPublishedMarketCardsFromOrderListItems(
  items: readonly OrderListItem[],
): OrderCardItem[] {
  return items
    .map((row) => orderListItemToMarketCard(row))
    .filter((c): c is OrderCardItem => c != null);
}

export function mergeDiscoverWithOwnPublishedCards(
  discoverItems: OrderCardItem[],
  ownCards: OrderCardItem[],
): OrderCardItem[] {
  return mergeListsUniqueById(ownCards, discoverItems, discoverOrderDedupeKey);
}

export function ownPublishedOpenListingIds(
  orders: readonly OrderCardItem[],
  ownUserId?: string,
): Set<string> {
  const ownId = resolveMarketViewerUserId(ownUserId);
  if (!ownId) return new Set();
  return new Set(
    orders.filter((o) => isOwnPublishedOpenListing(o, ownId)).map((o) => String(o.id)),
  );
}

export const MARKET_OWN_PUBLISHED_PAGE_SIZE = 50;
export const MARKET_OWN_PUBLISHED_MAX_PAGES = 10;

/** Short TTL cache: `loadOrders` debounce still refetches discover, but skips repeated `GET /orders` pagination. */
const OWN_PUBLISHED_CACHE_TTL_MS = 30_000;
let ownPublishedCache: { userId: string; cards: OrderCardItem[]; fetchedAt: number } | null = null;

export function invalidateOwnPublishedMarketCardsCache(): void {
  ownPublishedCache = null;
}

/** `GET /orders` 分页拉取并转为市场左栏本单 eligible 卡片（失败返回 []）。 */
export async function fetchOwnPublishedMarketCards(
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<OrderCardItem[]> {
  const ownId = resolveMarketViewerUserId();
  const now = Date.now();
  if (
    ownId &&
    ownPublishedCache &&
    ownPublishedCache.userId === ownId &&
    now - ownPublishedCache.fetchedAt < OWN_PUBLISHED_CACHE_TTL_MS
  ) {
    return ownPublishedCache.cards;
  }

  const pageSize = options.pageSize ?? MARKET_OWN_PUBLISHED_PAGE_SIZE;
  const maxPages = options.maxPages ?? MARKET_OWN_PUBLISHED_MAX_PAGES;
  const acc: OrderListItem[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const mine = await getOrders({ limit: pageSize, cursor });
    acc.push(...((mine.items as OrderListItem[]) ?? []));
    const p = mine.page;
    if (!p?.has_more || !p.next_cursor) break;
    cursor = p.next_cursor;
  }
  const cards = ownPublishedMarketCardsFromOrderListItems(acc);
  if (ownId) {
    ownPublishedCache = { userId: ownId, cards, fetchedAt: now };
  }
  return cards;
}

/**
 * discover 分页追加：先合并本页，再重拉 `GET /orders` 本单 eligible 行（与首屏 `buildMarketDiscoverOrderList` 同源）。
 */
export async function mergeDiscoverPageWithOwnPublished(
  prev: OrderCardItem[],
  discoverPage: OrderCardItem[],
  options: { ownUserId?: string; bindGuideOrderId?: string; ordersFetchMaxPages?: number } = {},
): Promise<OrderCardItem[]> {
  const ownId = resolveMarketViewerUserId(options.ownUserId);
  const bindGuideOrderId = options.bindGuideOrderId ?? "";
  let merged = mergeListsUniqueById(
    prev,
    filterDiscoverOrdersForViewer(discoverPage, bindGuideOrderId, ownId),
    discoverOrderDedupeKey,
  );
  if (!ownId) return merged;
  try {
    const ownCards = await fetchOwnPublishedMarketCards({
      maxPages: options.ordersFetchMaxPages ?? MARKET_OWN_PUBLISHED_MAX_PAGES,
    });
    if (ownCards.length > 0) {
      merged = filterDiscoverOrdersForViewer(
        mergeDiscoverWithOwnPublishedCards(merged, ownCards),
        bindGuideOrderId,
        ownId,
      );
    }
  } catch {
    /* 回填失败不挡 discover 分页 */
  }
  return merged;
}

/**
 * discover 首屏/刷新：始终与 `GET /orders` 本单 eligible 行合并后再做 viewer 过滤。
 * 禁止「discover 已有 1 条本单就跳过回填」类部分合并。
 */
export async function buildMarketDiscoverOrderList(
  discoverItems: OrderCardItem[],
  options: { ownUserId?: string; bindGuideOrderId?: string; ordersFetchMaxPages?: number } = {},
): Promise<OrderCardItem[]> {
  const ownId = resolveMarketViewerUserId(options.ownUserId);
  const bindGuideOrderId = options.bindGuideOrderId ?? "";
  let merged = discoverItems;
  if (ownId) {
    try {
      const ownCards = await fetchOwnPublishedMarketCards({
        maxPages: options.ordersFetchMaxPages ?? MARKET_OWN_PUBLISHED_MAX_PAGES,
      });
      if (ownCards.length > 0) {
        merged = mergeDiscoverWithOwnPublishedCards(discoverItems, ownCards);
      }
    } catch {
      /* 回填失败不挡 discover 主列表 */
    }
  }
  return filterDiscoverOrdersForViewer(merged, bindGuideOrderId, ownId);
}
