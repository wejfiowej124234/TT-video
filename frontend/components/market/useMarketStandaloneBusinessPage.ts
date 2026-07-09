"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import type { MarketCatalogListRow } from "@/lib/marketCatalogAdapter";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { marketSubsiteDemoStudioFallbackEnabled } from "@/lib/marketSubsiteProductionGate";
import {
  buildFilteredSubsiteMasonryItems,
  fetchMarketStandaloneCatalog,
  invalidateMarketStandaloneCatalogCache,
  marketSubsiteFilterStateEffective,
  marketSubsiteListingsQueryFromSearchParams,
  pushWithListingParam,
} from "./marketStandaloneBusinessPageUtils";
import { useEffectiveSubsiteCountry } from "@/lib/useEffectiveSubsiteCountry";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";

export type MarketStandaloneBusinessVariant = "provider" | "acquisition";

const SUBSITE_LISTINGS_REFETCH_DEBOUNCE_MS = 300;

/** `/market/provider` · `/market/acquisition` 子站：目录列表、**`?listing=`** 与 Studio 刷新。 */
export function useMarketStandaloneBusinessPage(variant: MarketStandaloneBusinessVariant) {
  const { t, locale } = useTranslation();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const isProvider = variant === "provider";

  const listingId = searchParams.get("listing")?.trim() || null;

  const [catalogRows, setCatalogRows] = useState<MarketCatalogListRow[]>([]);
  const [catalogSourced, setCatalogSourced] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [catalogDegraded, setCatalogDegraded] = useState(false);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const studioAutoOpen = useMemo(() => {
    const v = searchParams.get("studio")?.trim().toLowerCase() ?? "";
    return v === "1" || v === "true" || v === "open";
  }, [searchParams]);

  const [studioOpen, setStudioOpen] = useState(false);

  useEffect(() => {
    if (studioAutoOpen) setStudioOpen(true);
  }, [studioAutoOpen]);

  const openStudio = useCallback(() => setStudioOpen(true), []);

  const closeStudio = useCallback(() => {
    setStudioOpen(false);
    if (!searchParams.has("studio")) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("studio");
    const q = sp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const demoAllowed = marketSubsiteDemoStudioFallbackEnabled();

  const effectiveCountry = useEffectiveSubsiteCountry(searchParams, variant);

  const filterState = useMemo(
    () => marketSubsiteFilterStateEffective(searchParams, variant),
    [searchParams, variant],
  );

  const listingsQuery = useMemo(
    () => marketSubsiteListingsQueryFromSearchParams(searchParams, variant, effectiveCountry),
    [searchParams, variant, effectiveCountry],
  );

  const applyCatalogResult = useCallback(
    (rows: MarketCatalogListRow[], sourced: boolean, hasMore = false) => {
      setCatalogRows(rows);
      setCatalogSourced(sourced);
      setCatalogHasMore(hasMore);
      if (sourced) setCatalogDegraded(false);
    },
    [],
  );

  const handleCatalogError = useCallback(
    (e: unknown) => {
      setCatalogRows([]);
      setCatalogSourced(false);
      setCatalogHasMore(false);
      if (marketSubsiteDemoStudioFallbackEnabled()) {
        setCatalogDegraded(true);
        setListError(null);
        return;
      }
      setCatalogDegraded(false);
      setListError(mapApiReadError(e, t, "market_errorTitle"));
    },
    [t],
  );

  const loadCatalog = useCallback(
    (query: string, showLoading: boolean, epoch: number, bypassCache = false) => {
      if (showLoading) {
        setListLoading(true);
        setListError(null);
      }
      void fetchMarketStandaloneCatalog(isProvider, query, { bypassCache })
        .then(({ rows, catalogSourced: sourced, catalogHasMore: hasMore }) => {
          if (epoch !== listingsFetchGeneration.current) return;
          applyCatalogResult(rows, sourced, hasMore);
        })
        .catch((e) => {
          if (epoch !== listingsFetchGeneration.current) return;
          handleCatalogError(e);
        })
        .finally(() => {
          if (epoch !== listingsFetchGeneration.current) return;
          if (showLoading) setListLoading(false);
        });
    },
    [applyCatalogResult, handleCatalogError, isProvider],
  );

  /** B-061 parity: subsite catalog races (unfiltered vs localStorage country) must not overwrite latest query. */
  const listingsFetchGeneration = useRef(0);
  const syncedCountryToUrlRef = useRef<string | null>(null);

  /** Mirror explicit user save into URL (bookmark/share); never auto-persist country on init. */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams.get("country")?.trim()) return;
    if (effectiveCountry === "all") return;
    if (syncedCountryToUrlRef.current === effectiveCountry) return;
    syncedCountryToUrlRef.current = effectiveCountry;
    const next = new URLSearchParams(searchParams.toString());
    next.set("country", effectiveCountry);
    router.replace(buildPathnameSearchHref(pathname, next.toString()), { scroll: false });
  }, [effectiveCountry, pathname, router, searchParams, variant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const epoch = ++listingsFetchGeneration.current;
      loadCatalog(listingsQuery, true, epoch);
    }, SUBSITE_LISTINGS_REFETCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [listingsQuery, loadCatalog, isProvider]);

  const refetchCatalog = useCallback(() => {
    invalidateMarketStandaloneCatalogCache();
    const epoch = ++listingsFetchGeneration.current;
    loadCatalog(listingsQuery, true, epoch, true);
  }, [loadCatalog, listingsQuery]);

  const masonryItems = useMemo(
    () =>
      buildFilteredSubsiteMasonryItems({
        variant,
        catalogRows,
        catalogSourced,
        demoAllowed,
        filters: filterState,
        locale,
      }),
    [variant, catalogRows, catalogSourced, demoAllowed, filterState, locale],
  );

  const listSummaryMode = useMemo((): "postgres_catalog" | "demo_client" | "no_catalog" => {
    if (catalogSourced) return "postgres_catalog";
    if (masonryItems.length > 0) return "demo_client";
    return "no_catalog";
  }, [catalogSourced, masonryItems.length]);

  const drawerCatalogSourced = catalogSourced;

  const openListing = useCallback(
    (id: string) => {
      router.push(pushWithListingParam(pathname, searchParams, id), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const closeListing = useCallback(() => {
    router.push(pushWithListingParam(pathname, searchParams, null), { scroll: false });
  }, [pathname, router, searchParams]);

  return {
    t,
    locale,
    variant,
    isProvider,
    listingId,
    listLoading,
    listError,
    catalogDegraded,
    studioOpen,
    setStudioOpen,
    openStudio,
    closeStudio,
    studioAutoOpen,
    masonryItems,
    listSummaryMode,
    catalogHasMore,
    catalogSourced,
    drawerCatalogSourced,
    openListing,
    closeListing,
    refetchCatalog,
    searchParams,
    effectiveCountry,
    listingsQuery,
  };
}
