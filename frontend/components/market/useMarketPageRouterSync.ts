"use client";

import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY } from "@/lib/geoOptions";
import { COMMUNITY_USER_MARKET_QUERY } from "@/lib/communityMarketDeepLink";
import {
  MARKET_GUIDE_DETAIL_QUERY,
  MARKET_ITINERARY_DRAFT_QUERY,
  MARKET_ORDER_DETAIL_QUERY,
  MARKET_BIND_GUIDE_ORDER_QUERY,
} from "@/lib/marketDeepLink";
import { isUuidString } from "@/lib/isUuidString";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";

type MarketRouter = { replace: (href: string, options?: { scroll?: boolean }) => void };

/** P29：用户点「双栏/订单/向导」时须**同步**写回 `view` query；仅靠 `useEffect` 在 Strict Mode / 批处理下可能晚于 E2E 断言，导致地址栏长期无 `view=`。 */
export function replaceMarketViewQueryParam(
  router: MarketRouter,
  pathname: string | null,
  searchParams: { toString: () => string },
  nextView: MarketView,
): void {
  const p = new URLSearchParams(searchParams.toString());
  if (nextView === "split") {
    p.delete("view");
  } else {
    p.set("view", nextView);
  }
  const path = pathname ?? "/market";
  const qs = p.toString();
  const href = qs ? `${path}?${qs}` : path;
  router.replace(href, { scroll: false });
}

/** 非法 `orderId` / `guideId` / draft id 立即从地址栏剔除（须不等待列表加载）。 */
export function useMarketPageSanitizeMarketQueries(
  searchParams: { toString: () => string; get: (k: string) => string | null },
  router: MarketRouter,
  pathname: string | null,
) {
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    let changed = false;
    const oRaw = next.get(MARKET_ORDER_DETAIL_QUERY)?.trim() ?? "";
    if (oRaw && !isUuidString(oRaw)) {
      next.delete(MARKET_ORDER_DETAIL_QUERY);
      changed = true;
    }
    const gRaw = next.get(MARKET_GUIDE_DETAIL_QUERY)?.trim() ?? "";
    if (gRaw && !isUuidString(gRaw)) {
      next.delete(MARKET_GUIDE_DETAIL_QUERY);
      changed = true;
    }
    const dRaw = next.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
    if (dRaw && !isUuidString(dRaw)) {
      next.delete(MARKET_ITINERARY_DRAFT_QUERY);
      changed = true;
    }
    const bRaw = next.get(MARKET_BIND_GUIDE_ORDER_QUERY)?.trim() ?? "";
    if (bRaw && !isUuidString(bRaw)) {
      next.delete(MARKET_BIND_GUIDE_ORDER_QUERY);
      changed = true;
    }
    if (!changed) return;
    const qs = next.toString();
    const base = pathname ?? "/market";
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [searchParams, router, pathname]);
}

/** 首屏 URL → 筛选态（`lastAppliedUrlRef` 去抖）。 */
export function useMarketPageHydrateMarketFromUrl(
  searchParams: { toString: () => string; get: (k: string) => string | null },
  lastAppliedUrlRef: MutableRefObject<string | null>,
  setView: Dispatch<SetStateAction<MarketView>>,
  setCountry: Dispatch<SetStateAction<string>>,
  setCity: Dispatch<SetStateAction<string>>,
  setLanguages: Dispatch<SetStateAction<string[]>>,
  setServiceTypes: Dispatch<SetStateAction<string[]>>,
) {
  useEffect(() => {
    const q = searchParams.toString();
    if (q === lastAppliedUrlRef.current) return;
    lastAppliedUrlRef.current = q;
    const v = searchParams.get("view");
    if (v === "orders" || v === "guides") setView(v);
    else if (v === "split") setView("split");
    const c = searchParams.get("country");
    if (c != null) setCountry(c);
    const ciParam = searchParams.get("city");
    if (ciParam != null) {
      let ci = ciParam;
      if (c) {
        const cities = CITIES_BY_COUNTRY[c];
        if (cities && !cities.some((x) => x.value === ci)) ci = "";
      }
      setCity(ci);
    }
    const lParam = searchParams.get("language");
    if (lParam != null) {
      let langList = lParam ? lParam.split(",").filter(Boolean) : [];
      if (langList.length > 0 && c) {
        const allowed = LANGUAGES_BY_COUNTRY[c]?.map((o) => o.value) ?? [];
        langList = langList.filter((l) => allowed.includes(l));
      }
      setLanguages(langList);
    }
    const s = searchParams.get("service");
    if (s != null) setServiceTypes(s ? s.split(",").filter(Boolean) : []);
  }, [searchParams, lastAppliedUrlRef, setView, setCountry, setCity, setLanguages, setServiceTypes]);
}

/** 筛选态写回 URL；须排在 orderId/guideId 深链 effect 之后，避免 loading 刚结束一帧误丢 query。 */
export function useMarketPagePushMarketFiltersToUrl({
  searchParams,
  router,
  pathname,
  fromUrlRef,
  suppressMarketOrderDeepLinkRef,
  suppressMarketGuideDeepLinkRef,
  view,
  country,
  city,
  languages,
  serviceTypes,
  detailOrder,
  detailGuide,
  loadingOrders,
  loadingGuides,
}: {
  searchParams: { toString: () => string; get: (k: string) => string | null };
  router: MarketRouter;
  pathname: string | null;
  fromUrlRef: MutableRefObject<boolean>;
  suppressMarketOrderDeepLinkRef: MutableRefObject<string | null>;
  suppressMarketGuideDeepLinkRef: MutableRefObject<string | null>;
  view: MarketView;
  country: string;
  city: string;
  languages: string[];
  serviceTypes: string[];
  detailOrder: OrderCardItem | null;
  detailGuide: GuideCardItem | null;
  loadingOrders: boolean;
  loadingGuides: boolean;
}) {
  /** 避免同 href 反复 `replace` 打断弹窗等客户端态（见 `useMarketPagePushMarketFiltersToUrl` 文件内说明）。 */
  const lastPushedMarketHrefRef = useRef<string | null>(null);
  useEffect(() => {
    if (fromUrlRef.current) {
      fromUrlRef.current = false;
      return;
    }
    const p = new URLSearchParams();
    if (view !== "split") p.set("view", view);
    if (country) p.set("country", country);
    if (city) p.set("city", city);
    if (languages.length > 0) p.set("language", languages.join(","));
    if (serviceTypes.length > 0) p.set("service", serviceTypes.join(","));
    const preserveSource = new URLSearchParams(searchParams.toString());
    const oSan = preserveSource.get(MARKET_ORDER_DETAIL_QUERY)?.trim() ?? "";
    if (oSan && !isUuidString(oSan)) preserveSource.delete(MARKET_ORDER_DETAIL_QUERY);
    const gSan = preserveSource.get(MARKET_GUIDE_DETAIL_QUERY)?.trim() ?? "";
    if (gSan && !isUuidString(gSan)) preserveSource.delete(MARKET_GUIDE_DETAIL_QUERY);
    const preserveKeys = [
      MARKET_ORDER_DETAIL_QUERY,
      MARKET_GUIDE_DETAIL_QUERY,
      MARKET_BIND_GUIDE_ORDER_QUERY,
      COMMUNITY_USER_MARKET_QUERY,
      MARKET_ITINERARY_DRAFT_QUERY,
      "guide_id",
    ] as const;
    for (const key of preserveKeys) {
      const v = preserveSource.get(key)?.trim();
      if (!v) continue;
      if (key === MARKET_ORDER_DETAIL_QUERY) {
        if (!isUuidString(v)) continue;
        if (suppressMarketOrderDeepLinkRef.current === v) continue;
        const openId = String(detailOrder?.id ?? "");
        if (openId === v) p.set(key, v);
        else if (!openId && loadingOrders) p.set(key, v);
        continue;
      }
      if (key === MARKET_GUIDE_DETAIL_QUERY) {
        if (!isUuidString(v)) continue;
        if (suppressMarketGuideDeepLinkRef.current === v) continue;
        const openId = String(detailGuide?.id ?? "");
        if (openId === v) p.set(key, v);
        else if (!openId && loadingGuides) p.set(key, v);
        continue;
      }
      if (key === MARKET_ITINERARY_DRAFT_QUERY) {
        if (!isUuidString(v)) continue;
        p.set(key, v);
        continue;
      }
      p.set(key, v);
    }
    const q = p.toString();
    const path = pathname ?? "/market";
    const nextHref = q ? `${path}?${q}` : path;
    if (lastPushedMarketHrefRef.current === nextHref) return;
    lastPushedMarketHrefRef.current = nextHref;
    router.replace(nextHref, { scroll: false });
  }, [
    view,
    country,
    city,
    languages,
    serviceTypes,
    router,
    pathname,
    searchParams,
    detailOrder,
    detailGuide,
    loadingOrders,
    loadingGuides,
    fromUrlRef,
    suppressMarketOrderDeepLinkRef,
    suppressMarketGuideDeepLinkRef,
  ]);
}
