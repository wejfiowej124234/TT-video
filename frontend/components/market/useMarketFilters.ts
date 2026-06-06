"use client";

import { useMemo } from "react";
import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import { dedupeListById } from "@/lib/dedupeListById";
import { discoverOrderDedupeKey } from "@/lib/discoverOrderDedupeKey";

export type MarketSortKey = "latest" | "priceDesc" | "priceAsc";

/**
 * 市场页：订单/向导列表的客户端筛选与排序（与原先 `useMarketPage` 内联逻辑同源）。
 */
export function useMarketFilters(params: {
  orders: OrderCardItem[];
  guides: GuideCardItem[];
  country: string;
  city: string;
  languages: string[];
  serviceTypes: string[];
  sortBy: MarketSortKey;
}) {
  const { orders, guides, country, city, languages, serviceTypes, sortBy } = params;

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (country) list = list.filter((o) => (o.country ?? "") === country);
    if (city) list = list.filter((o) => (o.city ?? "") === city);
    return list;
  }, [orders, country, city]);

  const sortedOrders = useMemo(() => {
    const list = dedupeListById([...filteredOrders], discoverOrderDedupeKey);
    if (sortBy === "latest") {
      const allHaveUsableCreatedAt =
        list.length > 0 &&
        list.every((o) => {
          const s = o.created_at;
          if (s == null || String(s).trim() === "") return false;
          const t = new Date(s).getTime();
          return !Number.isNaN(t);
        });
      if (allHaveUsableCreatedAt) {
        list.sort((a, b) => {
          const ta = new Date(a.created_at as string).getTime();
          const tb = new Date(b.created_at as string).getTime();
          return tb - ta;
        });
      }
    } else {
      list.sort((a, b) => {
        const na = parseFloat(a.amount ?? "0") || 0;
        const nb = parseFloat(b.amount ?? "0") || 0;
        return sortBy === "priceDesc" ? nb - na : na - nb;
      });
    }
    return list;
  }, [filteredOrders, sortBy]);

  const sortedGuides = useMemo(() => {
    const list = [...guides];
    if (sortBy === "latest") {
      list.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
    } else {
      list.sort((a, b) => {
        const na = parseFloat(a.hourly_rate ?? a.stake_amount ?? "0") || 0;
        const nb = parseFloat(b.hourly_rate ?? b.stake_amount ?? "0") || 0;
        return sortBy === "priceDesc" ? nb - na : na - nb;
      });
    }
    return list;
  }, [guides, sortBy]);

  const hasFilters = useMemo(
    () => !!(country || city || languages.length > 0 || serviceTypes.length > 0),
    [country, city, languages, serviceTypes],
  );

  return { filteredOrders, sortedOrders, sortedGuides, hasFilters };
}
