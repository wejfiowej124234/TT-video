"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { MARKET_GUIDE_DETAIL_QUERY, MARKET_ORDER_DETAIL_QUERY } from "@/lib/marketDeepLink";
import { isUuidString } from "@/lib/isUuidString";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";

/** `/market?orderId=` / `/market?guideId=`：合法 UUID 且列表已加载时打开对应抽屉。 */
export function useMarketPageOrderGuideDeepLinks({
  searchParams,
  loadingOrders,
  loadingGuides,
  sortedOrders,
  filteredOrders,
  orders,
  guides,
  suppressMarketOrderDeepLinkRef,
  suppressMarketGuideDeepLinkRef,
  setView,
  setDetailOrder,
  setDetailGuide,
}: {
  searchParams: { get: (k: string) => string | null };
  loadingOrders: boolean;
  loadingGuides: boolean;
  sortedOrders: OrderCardItem[];
  filteredOrders: OrderCardItem[];
  orders: OrderCardItem[];
  guides: GuideCardItem[];
  suppressMarketOrderDeepLinkRef: MutableRefObject<string | null>;
  suppressMarketGuideDeepLinkRef: MutableRefObject<string | null>;
  setView: Dispatch<SetStateAction<MarketView>>;
  setDetailOrder: Dispatch<SetStateAction<OrderCardItem | null>>;
  setDetailGuide: Dispatch<SetStateAction<GuideCardItem | null>>;
}) {
  useEffect(() => {
    const raw = searchParams.get(MARKET_ORDER_DETAIL_QUERY)?.trim() ?? "";
    if (!raw) {
      suppressMarketOrderDeepLinkRef.current = null;
      return;
    }
    if (!isUuidString(raw)) return;
    if (suppressMarketOrderDeepLinkRef.current && suppressMarketOrderDeepLinkRef.current === raw) return;
    if (loadingOrders) return;
    const o =
      sortedOrders.find((x) => String(x.id ?? "") === raw) ||
      filteredOrders.find((x) => String(x.id ?? "") === raw) ||
      orders.find((x) => String(x.id ?? "") === raw);
    if (o) {
      setView((v) => (v === "guides" ? "orders" : v));
      setDetailOrder(o);
    }
  }, [
    searchParams,
    loadingOrders,
    sortedOrders,
    filteredOrders,
    orders,
    suppressMarketOrderDeepLinkRef,
    setView,
    setDetailOrder,
  ]);

  useEffect(() => {
    const raw = searchParams.get(MARKET_GUIDE_DETAIL_QUERY)?.trim() ?? "";
    if (!raw) {
      suppressMarketGuideDeepLinkRef.current = null;
      return;
    }
    if (!isUuidString(raw)) return;
    if (suppressMarketGuideDeepLinkRef.current && suppressMarketGuideDeepLinkRef.current === raw) return;
    if (loadingGuides) return;
    const g = guides.find((x) => String(x.id ?? "") === raw);
    if (g) {
      setView((v) => (v === "orders" ? "guides" : v));
      setDetailGuide(g);
    }
  }, [searchParams, loadingGuides, guides, suppressMarketGuideDeepLinkRef, setView, setDetailGuide]);
}
