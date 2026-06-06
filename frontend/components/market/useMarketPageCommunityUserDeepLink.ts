"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { COMMUNITY_USER_MARKET_QUERY } from "@/lib/communityMarketDeepLink";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { GuideCardItem } from "@/components/market/GuideCard";

type SearchParamsRead = { get: (key: string) => string | null; toString: () => string };

type RouterReplace = { replace: (href: string, options?: { scroll?: boolean }) => void };

export function useMarketPageCommunityUserDeepLink(opts: {
  searchParams: SearchParamsRead;
  router: RouterReplace;
  pathname: string | null;
  guides: GuideCardItem[];
  loadingGuides: boolean;
  setView: (v: MarketView) => void;
  setDetailGuide: (g: GuideCardItem | null) => void;
}) {
  const { searchParams, router, pathname, guides, loadingGuides, setView, setDetailGuide } = opts;

  const [communityGuideDeepLinkNotFound, setCommunityGuideDeepLinkNotFound] = useState(false);
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
  }, [searchParams, guides, loadingGuides, router, pathname, setView, setDetailGuide]);

  return { communityGuideDeepLinkNotFound, dismissCommunityGuideDeepLinkMiss };
}
