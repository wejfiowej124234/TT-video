"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getDiscoverOrders, getGuides, orderAccept, getIdempotencyKey } from "@/lib/apiClient";
import { useTranslation } from "@/components/LocaleProvider";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { trackMarketEvent } from "@/lib/analytics";
import { CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY } from "@/lib/geoOptions";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import { FAV_ORDERS_KEY, FAV_GUIDES_KEY, loadFavSet, saveFavSet } from "./marketPageUtils";
import { COMMUNITY_USER_MARKET_QUERY } from "@/lib/communityMarketDeepLink";
import { dedupeListById, mergeListsUniqueById } from "@/lib/dedupeListById";
import { discoverOrderDedupeKey } from "@/lib/discoverOrderDedupeKey";
import { stashEscrowOrderPrefetchFromMarketCard } from "@/lib/orderEscrowPrefetch";

/** 与后端 GET discover/orders ?limit 对齐（55 分页） */
const DISCOVER_ORDERS_PAGE_SIZE = 30;

export function useMarketPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrlRef = useRef(true);
  const lastAppliedUrlRef = useRef<string | null>(null);
  /** B-061：`GET discover/orders` 全量/分页与筛选竞态时，禁止慢请求落地覆盖新参数下的列表态 */
  const ordersListEpochRef = useRef(0);
  /** B-061：`getGuides` + 客户端筛同理 */
  const guidesListEpochRef = useRef(0);

  const [view, setView] = useState<MarketView>("split");
  const [sortBy, setSortBy] = useState<"latest" | "priceDesc" | "priceAsc">("latest");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  const [orders, setOrders] = useState<OrderCardItem[]>([]);
  const [guides, setGuides] = useState<GuideCardItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [apiErrorOrders, setApiErrorOrders] = useState<string | null>(null);
  const [apiErrorGuides, setApiErrorGuides] = useState<string | null>(null);
  const [apiErrorDismissed, setApiErrorDismissed] = useState(false);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersNextCursor, setOrdersNextCursor] = useState<string | null>(null);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);

  const [favoritedOrderIds, setFavoritedOrderIds] = useState<Set<string>>(new Set());
  const [favoritedGuideIds, setFavoritedGuideIds] = useState<Set<string>>(new Set());

  const [detailOrder, setDetailOrder] = useState<OrderCardItem | null>(null);
  const [detailGuide, setDetailGuide] = useState<GuideCardItem | null>(null);
  const [bookGuideId, setBookGuideId] = useState<string | null>(null);
  const [bookGuideName, setBookGuideName] = useState<string | null>(null);
  const [customItineraryOpen, setCustomItineraryOpen] = useState(false);
  const [customCreatedToast, setCustomCreatedToast] = useState(false);
  const [customCreatedOrderId, setCustomCreatedOrderId] = useState<string | null>(null);
  const [acceptSuccessToast, setAcceptSuccessToast] = useState(false);
  const [acceptSuccessOrderId, setAcceptSuccessOrderId] = useState<string | null>(null);
  const [communityGuideDeepLinkNotFound, setCommunityGuideDeepLinkNotFound] = useState(false);

  const detailOrderRef = useRef<OrderCardItem | null>(null);
  useEffect(() => {
    detailOrderRef.current = detailOrder;
  }, [detailOrder]);

  /** 31 §2.4：社区「约向导」→ /market?communityUserId=…；仅匹配成功时清 query，避免静默无效 */
  const communityUserDeepLinkHandledRef = useRef(false);
  const dismissCommunityGuideDeepLinkMiss = useCallback(() => {
    setCommunityGuideDeepLinkNotFound(false);
    const uid = searchParams.get(COMMUNITY_USER_MARKET_QUERY)?.trim();
    if (!uid) {
      communityUserDeepLinkHandledRef.current = false;
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete(COMMUNITY_USER_MARKET_QUERY);
    const qs = next.toString();
    const base = pathname ?? "/market";
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    communityUserDeepLinkHandledRef.current = false;
  }, [searchParams, router, pathname]);

  useEffect(() => {
    const uid = searchParams.get(COMMUNITY_USER_MARKET_QUERY)?.trim();
    if (!uid) {
      communityUserDeepLinkHandledRef.current = false;
      setCommunityGuideDeepLinkNotFound(false);
      return;
    }
    if (loadingGuides) return;
    if (communityUserDeepLinkHandledRef.current) return;
    communityUserDeepLinkHandledRef.current = true;
    const g = guides.find((x) => (x.user_id && x.user_id === uid) || x.id === uid);
    if (g) {
      setCommunityGuideDeepLinkNotFound(false);
      setView("guides");
      setDetailGuide(g);
      const next = new URLSearchParams(searchParams.toString());
      next.delete(COMMUNITY_USER_MARKET_QUERY);
      const qs = next.toString();
      const base = pathname ?? "/market";
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    } else {
      setCommunityGuideDeepLinkNotFound(true);
    }
  }, [searchParams, guides, loadingGuides, router, pathname]);

  useEffect(() => {
    setFavoritedOrderIds(loadFavSet(FAV_ORDERS_KEY));
    setFavoritedGuideIds(loadFavSet(FAV_GUIDES_KEY));
  }, []);

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
  }, [searchParams]);

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
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [view, country, city, languages, serviceTypes, router, pathname]);

  const toggleOrderFavorite = useCallback((id: string) => {
    setFavoritedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavSet(FAV_ORDERS_KEY, next);
      return next;
    });
  }, []);
  const toggleGuideFavorite = useCallback((id: string) => {
    setFavoritedGuideIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavSet(FAV_GUIDES_KEY, next);
      return next;
    });
  }, []);

  const loadOrders = useCallback(() => {
    const epoch = ++ordersListEpochRef.current;
    setLoadingOrders(true);
    setApiErrorOrders(null);
    setApiErrorDismissed(false);
    setOrdersNextCursor(null);
    setOrdersHasMore(false);
    const countryVal = country.trim() || undefined;
    const cityVal = city.trim() || undefined;
    const base =
      countryVal || cityVal ? { country: countryVal, city: cityVal } : ({} as { country?: string; city?: string });
    getDiscoverOrders({ ...base, limit: DISCOVER_ORDERS_PAGE_SIZE })
      .then((res) => {
        if (epoch !== ordersListEpochRef.current) return;
        const raw = (res.items as OrderCardItem[]) ?? [];
        const deduped = dedupeListById(raw, discoverOrderDedupeKey);
        /* 与后端互通：只展示 API 返回的可抢订单（Draft）；返回空则展示空，不再用假数据填空 */
        setOrders(deduped);
        const p = res.page;
        setOrdersHasMore(!!p?.has_more);
        setOrdersNextCursor(typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null);
        setApiErrorOrders(null);
      })
      .catch((err) => {
        if (epoch !== ordersListEpochRef.current) return;
        if (typeof window !== "undefined") {
          console.error("useMarketPage getDiscoverOrders:", err);
        }
        setOrders([]);
        setOrdersHasMore(false);
        setOrdersNextCursor(null);
        setApiErrorOrders(mapApiReadError(err, t, "market_apiError_orders"));
      })
      .finally(() => {
        if (epoch !== ordersListEpochRef.current) return;
        setLoadingOrders(false);
      });
  }, [country, city, t]);

  const loadMoreOrders = useCallback(() => {
    if (!ordersNextCursor || !ordersHasMore || loadingMoreOrders || loadingOrders) return;
    const epochAtStart = ordersListEpochRef.current;
    setLoadingMoreOrders(true);
    const countryVal = country.trim() || undefined;
    const cityVal = city.trim() || undefined;
    const base =
      countryVal || cityVal ? { country: countryVal, city: cityVal } : ({} as { country?: string; city?: string });
    getDiscoverOrders({
      ...base,
      limit: DISCOVER_ORDERS_PAGE_SIZE,
      cursor: ordersNextCursor,
    })
      .then((res) => {
        if (epochAtStart !== ordersListEpochRef.current) return;
        const raw = (res.items as OrderCardItem[]) ?? [];
        setOrders((prev) => mergeListsUniqueById(prev, raw, discoverOrderDedupeKey));
        const p = res.page;
        setOrdersHasMore(!!p?.has_more);
        setOrdersNextCursor(typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null);
      })
      .catch((err) => {
        if (epochAtStart !== ordersListEpochRef.current) return;
        if (typeof window !== "undefined") {
          console.error("useMarketPage getDiscoverOrders loadMore:", err);
        }
        setApiErrorOrders(mapApiReadError(err, t, "market_apiError_orders"));
      })
      .finally(() => {
        if (epochAtStart !== ordersListEpochRef.current) return;
        setLoadingMoreOrders(false);
      });
  }, [country, city, ordersNextCursor, ordersHasMore, loadingMoreOrders, loadingOrders, t]);

  const loadGuides = useCallback(() => {
    const epoch = ++guidesListEpochRef.current;
    setLoadingGuides(true);
    setApiErrorGuides(null);
    setApiErrorDismissed(false);
    const countryVal = country.trim();
    const cityVal = city.trim();
    const languageVals = languages.filter(Boolean);
    const serviceVals = serviceTypes.filter(Boolean);
    const citiesInCountry = countryVal ? (CITIES_BY_COUNTRY[countryVal]?.map((c) => c.value) ?? []) : [];
    const matchGuide = (g: GuideCardItem) => {
      if (countryVal && citiesInCountry.length > 0) {
        if (!g.city || !citiesInCountry.includes(g.city)) return false;
      }
      if (cityVal && g.city !== cityVal) return false;
      if (languageVals.length > 0 && Array.isArray(g.languages)) {
        const hasAny = languageVals.some((lv) => g.languages!.some((l) => l === lv || l.includes(lv) || lv.includes(l)));
        if (!hasAny) return false;
      }
      if (serviceVals.length > 0 && Array.isArray(g.service_types)) {
        const hasAny = serviceVals.some((sv) => g.service_types!.some((s) => s === sv || s.includes(sv) || sv.includes(s)));
        if (!hasAny) return false;
      }
      return true;
    };
    getGuides({
      city: cityVal || undefined,
      language: languageVals[0] || undefined,
      service_type: serviceVals[0] || undefined,
    })
      .then((items) => {
        if (epoch !== guidesListEpochRef.current) return;
        let list = dedupeListById((items as GuideCardItem[]) ?? [], (g) => String(g.id ?? ""));
        if (countryVal || cityVal || languageVals.length > 0 || serviceVals.length > 0) {
          list = list.filter(matchGuide);
        }
        setGuides(list);
        setApiErrorGuides(null);
      })
      .catch((err) => {
        if (epoch !== guidesListEpochRef.current) return;
        if (typeof window !== "undefined") {
          console.error("useMarketPage getGuides:", err);
        }
        setGuides([]);
        setApiErrorGuides(mapApiReadError(err, t, "market_apiError_guides"));
      })
      .finally(() => {
        if (epoch !== guidesListEpochRef.current) return;
        setLoadingGuides(false);
      });
  }, [country, city, languages, serviceTypes, t]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (country) list = list.filter((o) => (o.country ?? "") === country);
    if (city) list = list.filter((o) => (o.city ?? "") === city);
    return list;
  }, [orders, country, city]);

  const sortedOrders = useMemo(() => {
    const list = dedupeListById([...filteredOrders], discoverOrderDedupeKey);
    if (sortBy === "latest") {
      /* discover 项常缺 created_at：缺任一则不重排，顺序与 GET discover/orders 一致；仅当全员可解析时间戳时才按时间倒序 */
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

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);
  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  useEffect(() => {
    if (!loadingOrders && !loadingGuides) {
      trackMarketEvent("market_list_view", {
        ordersCount: filteredOrders.length,
        guidesCount: guides.length,
      });
    }
  }, [loadingOrders, loadingGuides, filteredOrders.length, guides.length]);

  const resetFilters = useCallback(() => {
    setCountry("");
    setCity("");
    setLanguages([]);
    setServiceTypes([]);
  }, []);

  const customItineraryPreselectedGuideId = useMemo(
    () => searchParams.get("guide_id")?.trim() ?? "",
    [searchParams]
  );

  const hasFilters = !!(country || city || languages.length > 0 || serviceTypes.length > 0);
  const showOrders = view === "split" || view === "orders";
  const showGuides = view === "split" || view === "guides";

  /** 49 A：自定义行程提交成功后，刷新列表并展示 Toast */
  const handleCustomItinerarySubmit = useCallback(
    (orderId: string) => {
      setCustomItineraryOpen(false);
      setCustomCreatedOrderId(orderId);
      setCustomCreatedToast(true);
      setView("orders");
      loadOrders();
      setTimeout(() => {
        setCustomCreatedToast(false);
        setCustomCreatedOrderId(null);
      }, 4000);
    },
    [loadOrders]
  );

  const acceptIdempotencyKeyRef = useRef<Record<string, string>>({});
  /** 53-S5：向导在右侧弹窗内「确认接该项目」→ POST accept，成功后刷新列表并关闭抽屉；53-S21 幂等键 */
  const handleConfirmAccept = useCallback(
    async (orderId: string) => {
      const key = acceptIdempotencyKeyRef.current[orderId] ?? (acceptIdempotencyKeyRef.current[orderId] = getIdempotencyKey());
      const snap = detailOrderRef.current;
      await orderAccept(orderId, key);
      if (snap && String(snap.id) === String(orderId)) {
        stashEscrowOrderPrefetchFromMarketCard(snap);
      }
      setDetailOrder(null);
      setAcceptSuccessOrderId(orderId);
      setAcceptSuccessToast(true);
      loadOrders();
      setTimeout(() => {
        setAcceptSuccessToast(false);
        setAcceptSuccessOrderId(null);
      }, 4000);
    },
    [loadOrders]
  );

  return {
    view,
    setView,
    sortBy,
    setSortBy,
    country,
    setCountry,
    city,
    setCity,
    languages,
    setLanguages,
    serviceTypes,
    setServiceTypes,
    orders,
    guides,
    loadingOrders,
    loadingGuides,
    apiErrorOrders,
    apiErrorGuides,
    apiErrorDismissed,
    setApiErrorDismissed,
    favoritedOrderIds,
    favoritedGuideIds,
    toggleOrderFavorite,
    toggleGuideFavorite,
    detailOrder,
    setDetailOrder,
    detailGuide,
    setDetailGuide,
    bookGuideId,
    bookGuideName,
    setBookGuideId,
    setBookGuideName,
    customItineraryOpen,
    setCustomItineraryOpen,
    customItineraryPreselectedGuideId,
    customCreatedToast,
    customCreatedOrderId,
    acceptSuccessToast,
    acceptSuccessOrderId,
    communityGuideDeepLinkNotFound,
    dismissCommunityGuideDeepLinkMiss,
    filteredOrders,
    hasFilters,
    showOrders,
    showGuides,
    loadOrders,
    loadMoreOrders,
    ordersHasMore,
    loadingMoreOrders,
    loadGuides,
    resetFilters,
    sortedOrders,
    sortedGuides,
    handleCustomItinerarySubmit,
    handleConfirmAccept,
  };
}
