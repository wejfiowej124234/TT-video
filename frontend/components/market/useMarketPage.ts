"use client";

import { useEffect, useState, useCallback, useRef, useMemo, startTransition, type SetStateAction } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getDiscoverOrders, getGuides, getOrder, orderAccept, getIdempotencyKey } from "@/lib/apiClient";
import { orderGetResponseToMarketCard } from "@/lib/marketOrderCardFromGetOrder";
import {
  applyDiscoverGeoFiltersKeepingPin,
  pinOrderInDiscoverList,
  isOwnPublishedOpenListing,
  normalizeMarketOrderCountry,
} from "@/lib/marketBindOrderList";
import {
  buildMarketDiscoverOrderList,
  filterDiscoverOrdersForViewer,
  mergeDiscoverPageWithOwnPublished,
  ownPublishedOpenListingIds,
  invalidateOwnPublishedMarketCardsCache,
} from "@/lib/marketDiscoverOrdersMerge";
import { AUTH_USER_ID_KEY, AUTH_SESSION_TOKEN_KEY } from "@/lib/apiClient/core";
import { useTranslation } from "@/components/LocaleProvider";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { trackMarketEvent } from "@/lib/analytics";
import {
  buildMarketGuideListApiParams,
  guideMatchesMarketAdvancedFilters,
  hasMarketGuideListFilters,
  marketGuideListNeedsClientOnlyFilters,
} from "@/lib/marketGuideFilterQuery";
import { CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY } from "@/lib/geoOptions";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import { useMarketPageFavorites } from "./useMarketPageFavorites";
import {
  buildMarketGuidesListCacheKey,
  invalidateMarketGuidesListCache,
  readMarketGuidesListCache,
  writeMarketGuidesListCache,
} from "@/lib/marketGuidesListCache";
import {
  buildMarketDiscoverListCacheKey,
  invalidateMarketDiscoverListCache,
  readMarketDiscoverListCache,
  writeMarketDiscoverListCache,
} from "@/lib/marketDiscoverListCache";
import { COMMUNITY_USER_MARKET_QUERY } from "@/lib/communityMarketDeepLink";
import {
  MARKET_BIND_GUIDE_ORDER_QUERY,
  MARKET_CREATE_ITINERARY_QUERY,
  isMarketCreateItineraryDeepLink,
} from "@/lib/marketDeepLink";
import { isUuidString } from "@/lib/isUuidString";
import { dedupeListById, mergeListsUniqueById } from "@/lib/dedupeListById";
import { useBindOrderTripDates } from "@/hooks/useBindOrderTripDates";
import { filterGuidesAvailableForTrip } from "@/lib/guidesAvailableForTrip";
import { discoverOrderDedupeKey } from "@/lib/discoverOrderDedupeKey";
import { stashEscrowOrderPrefetchFromMarketCard } from "@/lib/orderEscrowPrefetch";
import { appendMarketDevVarietyOrders } from "@/lib/marketDevVarietyOrders";
import { isPlaceholderGlobalGuideCity } from "@/lib/marketDisplayCopy";
import {
  applyMarketTripDaysFilterToOrders,
  parseMarketTripDaysParam,
} from "@/lib/marketTripDaysFilter";
import {
  MARKET_PAGE_FILTER_EXPANDED_QUERY,
  MARKET_PAGE_SORT_QUERY,
  parseMarketPageFilterExpandedParam,
  parseMarketPageSortParam,
  serializeMarketPageFilterExpandedParam,
  serializeMarketPageSortParam,
} from "@/lib/marketPageQuery";
import type { MarketPageInitialSnapshot } from "@/lib/market/marketPageInitialData";

/** 与后端 GET discover/orders ?limit 对齐（55 分页） */
const DISCOVER_ORDERS_PAGE_SIZE = 30;
const GUIDES_PAGE_SIZE = 30;
/** 与 `useMarketStandaloneBusinessPage` 子站筛选防抖对齐 */
const MARKET_LIST_REFETCH_DEBOUNCE_MS = 300;

/** 筛选/视图 UI 用 transition 更新；URL 回填与深链 priming 用 sync  setter。 */
function useFilterTransitionState<T>(initial: T): [T, (v: SetStateAction<T>) => void, (v: SetStateAction<T>) => void] {
  const [value, setValue] = useState(initial);
  const setValueTransition = useCallback((next: SetStateAction<T>) => {
    startTransition(() => {
      setValue(next);
    });
  }, []);
  return [value, setValueTransition, setValue];
}

export function useMarketPage(options?: { initialSnapshot?: MarketPageInitialSnapshot | null }) {
  const initialSnapshot = options?.initialSnapshot ?? null;
  const deferInitialListFetchRef = useRef(Boolean(initialSnapshot));
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
  /** 旅客绑定向导流：放宽 geo 客户端筛选，避免右栏空列表 */
  const bindingFlowActiveRef = useRef(false);
  const [view, setView, setViewSync] = useFilterTransitionState<MarketView>("split");
  const [sortBy, setSortBy, setSortBySync] = useFilterTransitionState<"latest" | "priceDesc" | "priceAsc">("latest");
  const [country, setCountry, setCountrySync] = useFilterTransitionState("");
  const [city, setCity, setCitySync] = useFilterTransitionState("");
  const [languages, setLanguages, setLanguagesSync] = useFilterTransitionState<string[]>([]);
  const [serviceTypes, setServiceTypes, setServiceTypesSync] = useFilterTransitionState<string[]>([]);
  /** 英雄区「快捷天数」：筛选可抢订单 `days` 字段（非打开自定义行程弹窗） */
  const [tripDaysFilter, setTripDaysFilter, setTripDaysFilterSync] = useFilterTransitionState<number | null>(null);
  const [filterExpanded, setFilterExpanded, setFilterExpandedSync] = useFilterTransitionState(false);

  const [orders, setOrders] = useState<OrderCardItem[]>(() => initialSnapshot?.orders ?? []);
  const [guides, setGuides] = useState<GuideCardItem[]>(() => initialSnapshot?.guides ?? []);
  const [loadingOrders, setLoadingOrders] = useState(() => !initialSnapshot);
  const [loadingGuides, setLoadingGuides] = useState(() => !initialSnapshot);
  const [apiErrorOrders, setApiErrorOrders] = useState<string | null>(null);
  const [apiErrorGuides, setApiErrorGuides] = useState<string | null>(null);
  const [apiErrorDismissed, setApiErrorDismissed] = useState(false);
  const [ordersHasMore, setOrdersHasMore] = useState(() => initialSnapshot?.ordersHasMore ?? false);
  const [ordersNextCursor, setOrdersNextCursor] = useState<string | null>(
    () => initialSnapshot?.ordersNextCursor ?? null,
  );
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [guidesHasMore, setGuidesHasMore] = useState(() => initialSnapshot?.guidesHasMore ?? false);
  const [guidesNextCursor, setGuidesNextCursor] = useState<string | null>(
    () => initialSnapshot?.guidesNextCursor ?? null,
  );
  const [loadingMoreGuides, setLoadingMoreGuides] = useState(false);

  const {
    favoritedOrderIds,
    favoritedGuideIds,
    toggleOrderFavorite,
    toggleGuideFavorite,
    favoritesSyncHint,
    bookmarkSyncAlert,
    onBookmarkSyncRetry,
    favoriteToggleAlert,
    onFavoriteToggleAlertDismiss,
  } = useMarketPageFavorites();

  const [detailOrder, setDetailOrder] = useState<OrderCardItem | null>(null);
  const [detailGuide, setDetailGuide] = useState<GuideCardItem | null>(null);
  const [bookGuideId, setBookGuideId] = useState<string | null>(null);
  const [bookGuideName, setBookGuideName] = useState<string | null>(null);
  const [customItineraryOpen, setCustomItineraryOpen] = useState(false);
  const [customItineraryInitialDays, setCustomItineraryInitialDays] = useState(5);
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [customCreatedToast, setCustomCreatedToast] = useState(false);
  const [customCreatedOrderId, setCustomCreatedOrderId] = useState<string | null>(null);
  const [acceptSuccessToast, setAcceptSuccessToast] = useState(false);
  const [acceptSuccessOrderId, setAcceptSuccessOrderId] = useState<string | null>(null);
  const [communityGuideDeepLinkNotFound, setCommunityGuideDeepLinkNotFound] = useState(false);
  const [bindOrderBackfillError, setBindOrderBackfillError] = useState<string | null>(null);
  /** 多笔「我的订单」时，旅客在左栏点选要绑定向导的目标单 */
  const [selectedOwnBindingOrderId, setSelectedOwnBindingOrderId] = useState("");

  const detailOrderRef = useRef<OrderCardItem | null>(null);
  const ownViewerUserIdRef = useRef("");
  useEffect(() => {
    detailOrderRef.current = detailOrder;
  }, [detailOrder]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    ownViewerUserIdRef.current = localStorage.getItem(AUTH_USER_ID_KEY)?.trim() ?? "";
  }, []);

  const bindGuideToOrderId = useMemo(() => {
    const raw = searchParams.get(MARKET_BIND_GUIDE_ORDER_QUERY)?.trim() ?? "";
    return isUuidString(raw) ? raw : "";
  }, [searchParams]);

  /** 31 §2.4：社区「约向导」→ /market?communityUserId=…；仅匹配成功时清 query，避免静默无效 */
  const communityUserDeepLinkHandledRef = useRef(false);
  /** 进入 bind 深链时清筛选并刷新 discover（每订单一次） */
  const bindDeepLinkPrimedRef = useRef<string | null>(null);
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
    const q = searchParams.toString();
    if (q === lastAppliedUrlRef.current) return;
    lastAppliedUrlRef.current = q;
    const v = searchParams.get("view");
    if (v === "orders" || v === "guides") setViewSync(v);
    else if (v === "split") setViewSync("split");
    const c = searchParams.get("country");
    if (c != null) setCountrySync(c);
    const ciParam = searchParams.get("city");
    if (ciParam != null) {
      let ci = ciParam;
      if (c) {
        const cities = CITIES_BY_COUNTRY[c];
        if (cities && !cities.some((x) => x.value === ci)) ci = "";
      }
      setCitySync(ci);
    }
    const lParam = searchParams.get("language");
    if (lParam != null) {
      let langList = lParam ? lParam.split(",").filter(Boolean) : [];
      if (langList.length > 0 && c) {
        const allowed = LANGUAGES_BY_COUNTRY[c]?.map((o) => o.value) ?? [];
        langList = langList.filter((l) => allowed.includes(l));
      }
      setLanguagesSync(langList);
    }
    const s = searchParams.get("service");
    if (s != null) setServiceTypesSync(s ? s.split(",").filter(Boolean) : []);
    setTripDaysFilterSync(parseMarketTripDaysParam(searchParams.get("days")));
    setSortBySync(parseMarketPageSortParam(searchParams.get(MARKET_PAGE_SORT_QUERY)));
    setFilterExpandedSync(parseMarketPageFilterExpandedParam(searchParams.get(MARKET_PAGE_FILTER_EXPANDED_QUERY)));
    const bindRaw = searchParams.get(MARKET_BIND_GUIDE_ORDER_QUERY)?.trim() ?? "";
    if (bindRaw && !isUuidString(bindRaw)) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(MARKET_BIND_GUIDE_ORDER_QUERY);
      const qs = next.toString();
      const base = pathname ?? "/market";
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (fromUrlRef.current) {
      fromUrlRef.current = false;
      return;
    }
    const preserveSource = new URLSearchParams(searchParams.toString());
    const p = new URLSearchParams();
    if (view !== "split") p.set("view", view);
    if (country) p.set("country", country);
    if (city) p.set("city", city);
    if (languages.length > 0) p.set("language", languages.join(","));
    if (serviceTypes.length > 0) p.set("service", serviceTypes.join(","));
    if (tripDaysFilter != null) p.set("days", String(tripDaysFilter));
    const sortSerialized = serializeMarketPageSortParam(sortBy);
    if (sortSerialized) p.set(MARKET_PAGE_SORT_QUERY, sortSerialized);
    const filtersSerialized = serializeMarketPageFilterExpandedParam(filterExpanded);
    if (filtersSerialized) p.set(MARKET_PAGE_FILTER_EXPANDED_QUERY, filtersSerialized);
    const bindRaw = preserveSource.get(MARKET_BIND_GUIDE_ORDER_QUERY)?.trim() ?? "";
    if (bindRaw && isUuidString(bindRaw)) {
      p.set(MARKET_BIND_GUIDE_ORDER_QUERY, bindRaw);
    }
    const guideIdRaw = preserveSource.get("guide_id")?.trim() ?? "";
    if (guideIdRaw) p.set("guide_id", guideIdRaw);
    const q = p.toString();
    const nextHref = q ? `${pathname}?${q}` : pathname;
    const curHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (nextHref !== curHref) {
      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    }
  }, [view, country, city, languages, serviceTypes, tripDaysFilter, sortBy, filterExpanded, router, pathname, searchParams]);

  const loadOrders = useCallback(() => {
    const epoch = ++ordersListEpochRef.current;
    setLoadingOrders(true);
    setApiErrorOrders(null);
    setApiErrorDismissed(false);
    setOrdersNextCursor(null);
    setOrdersHasMore(false);
    const countryVal = country.trim() || undefined;
    const cityVal = city.trim() || undefined;
    const cacheKey = buildMarketDiscoverListCacheKey({
      country: countryVal,
      city: cityVal,
      days: tripDaysFilter ?? undefined,
      bindGuideOrderId: bindGuideToOrderId,
    });
    const cachedDiscover = readMarketDiscoverListCache(cacheKey);
    if (cachedDiscover) {
      setOrders(cachedDiscover.orders);
      setOrdersHasMore(cachedDiscover.hasMore);
      setOrdersNextCursor(cachedDiscover.nextCursor);
      setApiErrorOrders(null);
      setLoadingOrders(false);
      return;
    }
    const base =
      countryVal || cityVal ? { country: countryVal, city: cityVal } : ({} as { country?: string; city?: string });
    getDiscoverOrders({
      ...base,
      days: tripDaysFilter ?? undefined,
      limit: DISCOVER_ORDERS_PAGE_SIZE,
    })
      .then(async (res) => {
        if (epoch !== ordersListEpochRef.current) return;
        const raw = (res.items as OrderCardItem[]) ?? [];
        const deduped = dedupeListById(raw, discoverOrderDedupeKey);
        const filtered = await buildMarketDiscoverOrderList(deduped, { bindGuideOrderId: bindGuideToOrderId });
        /* 与后端互通：展示 API 可抢订单 + 旅客本单已发布态；空则展示空 */
        setOrders(filtered);
        const p = res.page;
        const hasMore = !!p?.has_more;
        const nextCursor = typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null;
        setOrdersHasMore(hasMore);
        setOrdersNextCursor(nextCursor);
        setApiErrorOrders(null);
        writeMarketDiscoverListCache({
          key: cacheKey,
          orders: filtered,
          hasMore,
          nextCursor,
        });
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
  }, [country, city, tripDaysFilter, t, bindGuideToOrderId]);

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
      days: tripDaysFilter ?? undefined,
      limit: DISCOVER_ORDERS_PAGE_SIZE,
      cursor: ordersNextCursor,
    })
      .then(async (res) => {
        if (epochAtStart !== ordersListEpochRef.current) return;
        const raw = (res.items as OrderCardItem[]) ?? [];
        let prevSnapshot: OrderCardItem[] = [];
        setOrders((prev) => {
          prevSnapshot = prev;
          return prev;
        });
        const merged = await mergeDiscoverPageWithOwnPublished(prevSnapshot, raw, {
          bindGuideOrderId: bindGuideToOrderId,
        });
        if (epochAtStart !== ordersListEpochRef.current) return;
        setOrders(merged);
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
  }, [country, city, tripDaysFilter, ordersNextCursor, ordersHasMore, loadingMoreOrders, loadingOrders, t, bindGuideToOrderId]);

  const loadGuides = useCallback(() => {
    const epoch = ++guidesListEpochRef.current;
    setLoadingGuides(true);
    setApiErrorGuides(null);
    setApiErrorDismissed(false);
    setGuidesNextCursor(null);
    setGuidesHasMore(false);
    const filterState = { country, city, languages, serviceTypes };
    const apiParams = buildMarketGuideListApiParams(filterState);
    if (!marketGuideListNeedsClientOnlyFilters(filterState)) {
      apiParams.limit = GUIDES_PAGE_SIZE;
    }
    const cacheKey = buildMarketGuidesListCacheKey(filterState, apiParams);
    const cached = readMarketGuidesListCache(cacheKey);
    if (cached) {
      setGuides(cached.guides);
      setGuidesHasMore(cached.hasMore);
      setGuidesNextCursor(cached.nextCursor);
      setApiErrorGuides(null);
      setLoadingGuides(false);
      return;
    }
    getGuides(apiParams)
      .then((res) => {
        if (epoch !== guidesListEpochRef.current) return;
        let list = dedupeListById((res.items as GuideCardItem[]) ?? [], (g) => String(g.id ?? ""));
        list = list.filter((g) => !isPlaceholderGlobalGuideCity(g.city));
        list = list.filter((g) => guideMatchesMarketAdvancedFilters(g, filterState));
        setGuides(list);
        const p = res.page;
        const hasMore = !!p?.has_more;
        const nextCursor = typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null;
        setGuidesHasMore(hasMore);
        setGuidesNextCursor(nextCursor);
        setApiErrorGuides(null);
        writeMarketGuidesListCache({
          key: cacheKey,
          guides: list,
          hasMore,
          nextCursor,
        });
      })
      .catch((err) => {
        if (epoch !== guidesListEpochRef.current) return;
        if (typeof window !== "undefined") {
          console.error("useMarketPage getGuides:", err);
        }
        setGuides([]);
        setGuidesHasMore(false);
        setGuidesNextCursor(null);
        setApiErrorGuides(mapApiReadError(err, t, "market_apiError_guides"));
      })
      .finally(() => {
        if (epoch !== guidesListEpochRef.current) return;
        setLoadingGuides(false);
      });
  }, [country, city, languages, serviceTypes, t]);

  const loadMoreGuides = useCallback(() => {
    if (!guidesNextCursor || !guidesHasMore || loadingMoreGuides || loadingGuides) return;
    const epochAtStart = guidesListEpochRef.current;
    setLoadingMoreGuides(true);
    const filterState = { country, city, languages, serviceTypes };
    const apiParams = buildMarketGuideListApiParams(filterState);
    apiParams.limit = GUIDES_PAGE_SIZE;
    apiParams.cursor = guidesNextCursor;
    getGuides(apiParams)
      .then((res) => {
        if (epochAtStart !== guidesListEpochRef.current) return;
        let raw = dedupeListById((res.items as GuideCardItem[]) ?? [], (g) => String(g.id ?? ""));
        raw = raw.filter((g) => !isPlaceholderGlobalGuideCity(g.city));
        raw = raw.filter((g) => guideMatchesMarketAdvancedFilters(g, filterState));
        setGuides((prev) => mergeListsUniqueById(prev, raw, (g) => String(g.id ?? "")));
        const p = res.page;
        setGuidesHasMore(!!p?.has_more);
        setGuidesNextCursor(typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null);
      })
      .catch((err) => {
        if (epochAtStart !== guidesListEpochRef.current) return;
        if (typeof window !== "undefined") {
          console.error("useMarketPage getGuides loadMore:", err);
        }
        setApiErrorGuides(mapApiReadError(err, t, "market_apiError_guides"));
      })
      .finally(() => {
        if (epochAtStart !== guidesListEpochRef.current) return;
        setLoadingMoreGuides(false);
      });
  }, [
    country,
    city,
    languages,
    serviceTypes,
    guidesNextCursor,
    guidesHasMore,
    loadingMoreGuides,
    loadingGuides,
    t,
  ]);

  const ownPublishedIds = useMemo(() => ownPublishedOpenListingIds(orders), [orders]);

  const geoFilteredOrders = useMemo(() => {
    const pin = bindGuideToOrderId.trim();
    if (pin) {
      return applyDiscoverGeoFiltersKeepingPin(
        orders,
        { country, city, tripDaysFilter },
        pin,
        ownPublishedIds,
      );
    }
    let list = orders;
    if (country) {
      const countryNeedle = country.trim();
      list = list.filter(
        (o) =>
          ownPublishedIds.has(String(o.id)) || normalizeMarketOrderCountry(o) === countryNeedle,
      );
    }
    if (city) {
      const cityNeedle = city.trim();
      list = list.filter((o) => {
        if (ownPublishedIds.has(String(o.id))) return true;
        if ((o.city ?? "").trim() === cityNeedle) return true;
        const route = o.route_label ?? "";
        return route.includes(cityNeedle);
      });
    }
    return applyMarketTripDaysFilterToOrders(list, tripDaysFilter, bindGuideToOrderId, ownPublishedIds);
  }, [orders, country, city, tripDaysFilter, bindGuideToOrderId, ownPublishedIds]);

  const sortedOrders = useMemo(() => {
    const list = dedupeListById([...geoFilteredOrders], discoverOrderDedupeKey);
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
    const withDemo =
      bindGuideToOrderId.trim() !== ""
        ? list
        : appendMarketDevVarietyOrders(list, { tripDaysFilter });
    return pinOrderInDiscoverList(withDemo, orders, bindGuideToOrderId);
  }, [geoFilteredOrders, sortBy, tripDaysFilter, bindGuideToOrderId, orders]);

  /** 展示列表（含排序 + 天数筛选终态） */
  const filteredOrders = sortedOrders;

  const ownPublishedOpenOrders = useMemo(() => {
    const ownId = ownViewerUserIdRef.current;
    if (!ownId) return [] as OrderCardItem[];
    return orders.filter((o) => isOwnPublishedOpenListing(o, ownId));
  }, [orders]);

  const hasOwnPublishedOpenOrders = ownPublishedOpenOrders.length > 0;
  const multipleOwnPublishedOpenOrders = ownPublishedOpenOrders.length > 1;

  useEffect(() => {
    bindingFlowActiveRef.current =
      hasOwnPublishedOpenOrders ||
      !!bindGuideToOrderId.trim() ||
      !!selectedOwnBindingOrderId.trim();
  }, [hasOwnPublishedOpenOrders, bindGuideToOrderId, selectedOwnBindingOrderId]);

  useEffect(() => {
    if (!bindingFlowActiveRef.current || loadingOrders) return;
    loadGuides();
  }, [hasOwnPublishedOpenOrders, bindGuideToOrderId, selectedOwnBindingOrderId, loadingOrders, loadGuides]);

  const guidesEmptyRetryRef = useRef(false);
  useEffect(() => {
    if (loadingGuides) return;
    if (guides.length > 0) {
      guidesEmptyRetryRef.current = false;
      return;
    }
    if (!bindingFlowActiveRef.current) return;
    if (guidesEmptyRetryRef.current) return;
    guidesEmptyRetryRef.current = true;
    loadGuides();
  }, [loadingGuides, guides.length, loadGuides]);

  const effectiveBindGuideToOrderId = useMemo(() => {
    const deepLink = bindGuideToOrderId.trim();
    if (deepLink) return deepLink;
    const selected = selectedOwnBindingOrderId.trim();
    if (selected) return selected;
    if (ownPublishedOpenOrders.length === 1) return String(ownPublishedOpenOrders[0]!.id);
    return "";
  }, [bindGuideToOrderId, selectedOwnBindingOrderId, ownPublishedOpenOrders]);

  useEffect(() => {
    if (bindGuideToOrderId.trim()) {
      setSelectedOwnBindingOrderId("");
    }
  }, [bindGuideToOrderId]);

  const { tripDates: bindOrderTripDates, loading: bindOrderTripLoading } =
    useBindOrderTripDates(effectiveBindGuideToOrderId);

  const [tripFilteredGuides, setTripFilteredGuides] = useState<GuideCardItem[] | null>(null);
  const [guidesTripFilterLoading, setGuidesTripFilterLoading] = useState(false);

  useEffect(() => {
    const binding = effectiveBindGuideToOrderId.trim();
    const trip = bindOrderTripDates;
    if (!binding || !trip || guides.length === 0) {
      setTripFilteredGuides(null);
      setGuidesTripFilterLoading(false);
      return;
    }
    let cancelled = false;
    setGuidesTripFilterLoading(true);
    const debounceMs = 350;
    const timer = setTimeout(() => {
      void filterGuidesAvailableForTrip(guides, trip)
        .then((filtered) => {
          if (!cancelled) setTripFilteredGuides(filtered);
        })
        .finally(() => {
          if (!cancelled) setGuidesTripFilterLoading(false);
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [guides, bindOrderTripDates, effectiveBindGuideToOrderId]);

  const sortedGuides = useMemo(() => {
    const list = [...(tripFilteredGuides ?? guides)];
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
  }, [guides, tripFilteredGuides, sortBy]);

  const ordersFetchGeneration = useRef(0);
  const guidesFetchGeneration = useRef(0);

  useEffect(() => {
    const generation = ++ordersFetchGeneration.current;
    const isInitial = generation === 1;
    if (isInitial && deferInitialListFetchRef.current) {
      deferInitialListFetchRef.current = false;
      const refresh = () => {
        if (generation !== ordersFetchGeneration.current) return;
        loadOrders();
      };
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(refresh, { timeout: 2500 });
        return () => window.cancelIdleCallback(id);
      }
      const timer = globalThis.setTimeout(refresh, 800);
      return () => globalThis.clearTimeout(timer);
    }
    const delay = isInitial ? 0 : MARKET_LIST_REFETCH_DEBOUNCE_MS;
    const timer = globalThis.setTimeout(() => {
      if (generation !== ordersFetchGeneration.current) return;
      loadOrders();
    }, delay);
    return () => globalThis.clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    const bindingActive =
      !!bindGuideToOrderId.trim() ||
      !!selectedOwnBindingOrderId.trim() ||
      hasOwnPublishedOpenOrders;
    if (view === "orders" && !bindingActive) {
      return;
    }
    const generation = ++guidesFetchGeneration.current;
    const isInitial = generation === 1;
    if (isInitial && initialSnapshot) {
      const refresh = () => {
        if (generation !== guidesFetchGeneration.current) return;
        loadGuides();
      };
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(refresh, { timeout: 2500 });
        return () => window.cancelIdleCallback(id);
      }
      const timer = globalThis.setTimeout(refresh, 800);
      return () => globalThis.clearTimeout(timer);
    }
    const delay = isInitial ? 0 : MARKET_LIST_REFETCH_DEBOUNCE_MS;
    const timer = globalThis.setTimeout(() => {
      if (generation !== guidesFetchGeneration.current) return;
      loadGuides();
    }, delay);
    return () => globalThis.clearTimeout(timer);
  }, [loadGuides, view, bindGuideToOrderId, selectedOwnBindingOrderId, hasOwnPublishedOpenOrders, initialSnapshot]);

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
    setTripDaysFilter(null);
    setFilterExpanded(false);
  }, []);

  const ownPublishedGeoBypass = useMemo(
    () =>
      hasOwnPublishedOpenOrders &&
      Boolean(country.trim() || city.trim() || tripDaysFilter != null),
    [hasOwnPublishedOpenOrders, country, city, tripDaysFilter],
  );

  const customItineraryPreselectedGuideId = useMemo(
    () => searchParams.get("guide_id")?.trim() ?? "",
    [searchParams]
  );

  useEffect(() => {
    if (bindGuideToOrderId) setViewSync("guides");
  }, [bindGuideToOrderId]);

  useEffect(() => {
    setBindOrderBackfillError(null);
  }, [bindGuideToOrderId]);

  useEffect(() => {
    const pin = bindGuideToOrderId.trim();
    if (!pin) {
      bindDeepLinkPrimedRef.current = null;
      return;
    }
    if (bindDeepLinkPrimedRef.current === pin) return;
    bindDeepLinkPrimedRef.current = pin;
    setCountrySync("");
    setCitySync("");
    setLanguagesSync([]);
    setServiceTypesSync([]);
    setTripDaysFilterSync(null);
    loadOrders();
  }, [bindGuideToOrderId, loadOrders]);

  /** Escrow 深链：discover 未含本单（刚发布/筛选）时从 GET order 回填左栏 */
  useEffect(() => {
    const bindId = bindGuideToOrderId.trim();
    if (!bindId || loadingOrders) return;
    if (orders.some((o) => String(o.id) === bindId)) return;

    let cancelled = false;
    void getOrder(bindId)
      .then((res) => {
        if (cancelled) return;
        const card = orderGetResponseToMarketCard(res);
        if (!card) {
          setBindOrderBackfillError(t("market_bindGuide_backfill_invalid"));
          return;
        }
        setBindOrderBackfillError(null);
        setOrders((prev) => {
          if (prev.some((o) => String(o.id) === bindId)) return prev;
          return [card, ...prev];
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setBindOrderBackfillError(mapApiReadError(err, t, "market_bindGuide_backfill_failed"));
      });
    return () => {
      cancelled = true;
    };
  }, [bindGuideToOrderId, loadingOrders, orders]);

  const clearCreateItineraryDeepLink = useCallback(() => {
    const raw = searchParams.get(MARKET_CREATE_ITINERARY_QUERY)?.trim() ?? "";
    if (!raw) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(MARKET_CREATE_ITINERARY_QUERY);
    const qs = next.toString();
    const base = pathname ?? "/market";
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [searchParams, router, pathname]);

  const closeCustomItinerary = useCallback(() => {
    setCustomItineraryOpen(false);
    clearCreateItineraryDeepLink();
  }, [clearCreateItineraryDeepLink]);

  const hasClientAuthSession = useCallback(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim());
  }, []);

  useEffect(() => {
    if (!isMarketCreateItineraryDeepLink(searchParams.get(MARKET_CREATE_ITINERARY_QUERY))) return;
    if (!hasClientAuthSession()) {
      setAuthRequiredOpen(true);
      return;
    }
    setCustomItineraryOpen(true);
  }, [searchParams, hasClientAuthSession]);

  const openCustomItinerary = useCallback(() => {
    if (!hasClientAuthSession()) {
      setAuthRequiredOpen(true);
      return;
    }
    setCustomItineraryInitialDays(5);
    setCustomItineraryOpen(true);
  }, [hasClientAuthSession]);

  const openCustomItineraryWithDays = useCallback(
    (days: number) => {
      if (!hasClientAuthSession()) {
        setAuthRequiredOpen(true);
        return;
      }
      setCustomItineraryInitialDays(days);
      setCustomItineraryOpen(true);
    },
    [hasClientAuthSession],
  );

  const clearAuthRequired = useCallback(() => setAuthRequiredOpen(false), []);

  /** 英雄区 1/3/5/7 天：切换行程天数筛选；再次点击同一天数则清除筛选 */
  const applyTripDaysFilter = useCallback((days: number) => {
    setCustomItineraryOpen(false);
    setTripDaysFilter((prev) => (prev === days ? null : days));
    setView((v) => (v === "guides" ? "orders" : v));
  }, []);

  const clearTripDaysFilter = useCallback(() => {
    setTripDaysFilter(null);
  }, []);

  const hasFilters = !!(
    country ||
    city ||
    languages.length > 0 ||
    serviceTypes.length > 0 ||
    tripDaysFilter != null
  );
  const hasGuideFilters = useMemo(
    () => hasMarketGuideListFilters({ country, city, languages, serviceTypes }),
    [country, city, languages, serviceTypes],
  );
  const showOrders = view === "split" || view === "orders";
  const showGuides = view === "split" || view === "guides";

  /** 49 A：自定义行程提交成功后，刷新列表并展示 Toast */
  const handleCustomItinerarySubmit = useCallback(
    (orderId: string) => {
      invalidateOwnPublishedMarketCardsCache();
      invalidateMarketGuidesListCache();
      invalidateMarketDiscoverListCache();
      clearCreateItineraryDeepLink();
      setCustomItineraryOpen(false);
      setCustomCreatedOrderId(orderId);
      setCustomCreatedToast(true);
      setViewSync("orders");
      loadOrders();
      setTimeout(() => {
        setCustomCreatedToast(false);
        setCustomCreatedOrderId(null);
      }, 4000);
    },
    [loadOrders, clearCreateItineraryDeepLink]
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
      invalidateOwnPublishedMarketCardsCache();
      invalidateMarketGuidesListCache();
      invalidateMarketDiscoverListCache();
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
    favoritesSyncHint,
    bookmarkSyncAlert,
    onBookmarkSyncRetry,
    favoriteToggleAlert,
    onFavoriteToggleAlertDismiss,
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
    closeCustomItinerary,
    customItineraryInitialDays,
    openCustomItinerary,
    openCustomItineraryWithDays,
    authRequiredOpen,
    clearAuthRequired,
    tripDaysFilter,
    applyTripDaysFilter,
    clearTripDaysFilter,
    customItineraryPreselectedGuideId,
    customCreatedToast,
    customCreatedOrderId,
    acceptSuccessToast,
    acceptSuccessOrderId,
    communityGuideDeepLinkNotFound,
    dismissCommunityGuideDeepLinkMiss,
    filteredOrders,
    hasFilters,
    hasGuideFilters,
    showOrders,
    showGuides,
    loadOrders,
    loadMoreOrders,
    ordersHasMore,
    loadingMoreOrders,
    loadGuides,
    loadMoreGuides,
    guidesHasMore,
    loadingMoreGuides,
    resetFilters,
    sortedOrders,
    sortedGuides,
    filterExpanded,
    setFilterExpanded,
    ownPublishedGeoBypass,
    handleCustomItinerarySubmit,
    handleConfirmAccept,
    bindGuideToOrderId,
    effectiveBindGuideToOrderId,
    selectedOwnBindingOrderId,
    setSelectedOwnBindingOrderId,
    hasOwnPublishedOpenOrders,
    ownPublishedOpenCount: ownPublishedOpenOrders.length,
    multipleOwnPublishedOpenOrders,
    bindOrderBackfillError,
    dismissBindOrderBackfillError: () => setBindOrderBackfillError(null),
    bindOrderTripDates,
    bindOrderTripLoading,
    guidesTripFilterLoading,
    guidesFilteredByTrip: tripFilteredGuides != null,
  };
}
