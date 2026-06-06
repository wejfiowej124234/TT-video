import { apiUrl, routes } from "@/lib/api";
import type { MarketPageInitialSnapshot } from "@/lib/market/marketPageInitialData";
import type { GuideCardItem } from "@/components/market/GuideCard";
import type { OrderCardItem } from "@/lib/marketTypes";

const DISCOVER_ORDERS_PAGE_SIZE = 30;
const GUIDES_PAGE_SIZE = 30;
const FETCH_TIMEOUT_MS = 2500;

type PaginatedPayload = {
  items?: unknown[];
  page?: { next_cursor?: string | null; has_more?: boolean };
};

async function fetchJson(url: string): Promise<PaginatedPayload | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "x-request-id": `market-ssr-${Date.now()}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PaginatedPayload & { status?: string };
    if (data.status && data.status !== "ok") return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 并行拉 discover + guides，失败时返回 null（客户端照常 fetch） */
export async function fetchMarketPageInitialSnapshot(): Promise<MarketPageInitialSnapshot | null> {
  const [ordersPayload, guidesPayload] = await Promise.all([
    fetchJson(`${apiUrl(routes.discoverOrders)}?limit=${DISCOVER_ORDERS_PAGE_SIZE}`),
    fetchJson(`${apiUrl(routes.guides)}?limit=${GUIDES_PAGE_SIZE}`),
  ]);

  if (!ordersPayload && !guidesPayload) return null;

  const orders = (Array.isArray(ordersPayload?.items) ? ordersPayload.items : []) as OrderCardItem[];
  const guides = (Array.isArray(guidesPayload?.items) ? guidesPayload.items : []) as GuideCardItem[];

  return {
    orders,
    guides,
    ordersNextCursor: ordersPayload?.page?.next_cursor ?? null,
    ordersHasMore: Boolean(ordersPayload?.page?.has_more),
    guidesNextCursor: guidesPayload?.page?.next_cursor ?? null,
    guidesHasMore: Boolean(guidesPayload?.page?.has_more),
  };
}
