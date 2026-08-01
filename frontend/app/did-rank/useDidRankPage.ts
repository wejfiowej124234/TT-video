// search-params gate: parent route provides Suspense boundary.
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useState, useCallback, useEffect, useId, useMemo, startTransition } from "react";
import { getDidRankItineraries } from "@/lib/apiClient";
import { buildDidRankSharePath } from "@/lib/didRankShareLink";
import { warmDidRankBoardChunk } from "@/lib/didRankBoardChunkPrefetch";
import { warmDidRankPrizePool } from "@/lib/didRankPrizePoolPrefetch";
import { warmDidRankSecondaryBoardData } from "@/lib/didRankSecondaryBoardPrefetch";
import { scheduleCommunityIdleWork } from "@/lib/communityConversationsQuery";
import { useTranslation } from "@/components/LocaleProvider";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";
import {
  parsePeriodParam,
  parseGuideSortParam,
  parseDidRankBoardParam,
  parseDidRankMeHighlight,
  type DidRankBoardTab,
  type GuideLeaderboardSort,
  type Period,
} from "@/lib/didRankUtils";
import { useDidRankData } from "@/components/did-rank/useDidRankData";
import { useDidRankBoardPagination } from "@/components/did-rank/useDidRankBoardPagination";
import { useDidRankEmptyStateImpression } from "@/components/did-rank/useDidRankEmptyStateImpression";
import { useDidRankScrollToMyRank } from "@/components/did-rank/useDidRankScrollToMyRank";
import { useDidRankDeepLinkAutoScroll } from "@/components/did-rank/useDidRankDeepLinkAutoScroll";
import { useDidRankPrizePool } from "@/components/did-rank/useDidRankPrizePool";
import { useDidRankSecondaryBoard } from "@/components/did-rank/useDidRankSecondaryBoard";
import { useDidRankItineraryBoard } from "@/components/did-rank/useDidRankItineraryBoard";
import type { DidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData";

const PAGE_SIZE = 20;

/** URL、埋点、分页与 `useDidRankData` 编排；视图见 `DidRankPageInner.tsx` */
export function useDidRankPage(options?: { initialSnapshot?: DidRankPageInitialSnapshot | null }) {
  const initialSnapshot = options?.initialSnapshot ?? null;
  const { t } = useTranslation();
  const rankTabPanelId = useId();
  const rankTabIdPrefix = useId();
  const travelerRankTopGridId = useId();
  const guideRankTopGridId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const meParam = (searchParams?.get("me") ?? "").trim();
  const periodParam = searchParams?.get("period") ?? "";
  const guideSortParam = searchParams?.get("guide_sort") ?? "";
  const activeBoard = parseDidRankBoardParam(searchParams?.get("board") ?? null);
  const meHighlight = parseDidRankMeHighlight(meParam);
  const urlTravelerHighlight =
    meHighlight?.board === "traveler" ? meHighlight.userId : null;
  const urlGuideHighlight = meHighlight?.board === "guide" ? meHighlight.userId : null;
  const urlProviderHighlight =
    meHighlight?.board === "provider" ? meHighlight.userId : null;
  const urlAcquisitionHighlight =
    meHighlight?.board === "acquisition" ? meHighlight.userId : null;
  const urlItineraryHighlight =
    meHighlight?.board === "itinerary" ? meHighlight.userId : null;

  const [timeRange, setTimeRangeState] = useState<Period>(() => parsePeriodParam(periodParam || null, "all"));
  const [guideSort, setGuideSortState] = useState<GuideLeaderboardSort>(() =>
    parseGuideSortParam(guideSortParam || null),
  );
  const [pageTraveler, setPageTraveler] = useState(1);
  const [pageGuide, setPageGuide] = useState(1);
  const [recordModal, setRecordModal] = useState<TravelerRankItem | null>(null);
  const [guideModal, setGuideModal] = useState<GuideRankItem | null>(null);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<string>>(new Set());

  const {
    listTravelers,
    listGuides,
    isLoading,
    isRefreshing,
    fetchError,
    apiDataConnected,
    devPreviewActive,
    livePollActive,
    retryFetch,
  } = useDidRankData(timeRange, guideSort, t, { initialSnapshot });

  const prizePool = useDidRankPrizePool({ initialPrizePool: initialSnapshot?.prizePool ?? null });

  const [secondaryBoardWarm, setSecondaryBoardWarm] = useState<Set<DidRankBoardTab>>(() => {
    const warm = new Set<DidRankBoardTab>();
    if (activeBoard === "provider" || activeBoard === "acquisition" || activeBoard === "itinerary") {
      warm.add(activeBoard);
    }
    if (urlProviderHighlight) warm.add("provider");
    if (urlAcquisitionHighlight) warm.add("acquisition");
    if (urlItineraryHighlight) warm.add("itinerary");
    return warm;
  });

  useEffect(() => {
    if (activeBoard !== "provider" && activeBoard !== "acquisition" && activeBoard !== "itinerary") {
      return;
    }
    setSecondaryBoardWarm((prev) => (prev.has(activeBoard) ? prev : new Set(prev).add(activeBoard)));
  }, [activeBoard]);

  const warmBoard = useCallback(
    (board: DidRankBoardTab) => {
      warmDidRankBoardChunk(board);
      if (board === "itinerary") {
        void getDidRankItineraries(timeRange);
        setSecondaryBoardWarm((prev) => (prev.has(board) ? prev : new Set(prev).add(board)));
        return;
      }
      if (board !== "provider" && board !== "acquisition") return;
      warmDidRankSecondaryBoardData(board, timeRange);
      setSecondaryBoardWarm((prev) => (prev.has(board) ? prev : new Set(prev).add(board)));
    },
    [timeRange],
  );

  useEffect(() => {
    warmDidRankBoardChunk(activeBoard);
  }, [activeBoard]);

  useEffect(() => {
    if (initialSnapshot?.prizePool) return;
    return scheduleCommunityIdleWork(() => warmDidRankPrizePool(), 1500);
  }, [initialSnapshot?.prizePool]);

  const providerBoard = useDidRankSecondaryBoard("provider", timeRange, {
    enabled: secondaryBoardWarm.has("provider"),
  });
  const acquisitionBoard = useDidRankSecondaryBoard("acquisition", timeRange, {
    enabled: secondaryBoardWarm.has("acquisition"),
  });
  const itineraryBoard = useDidRankItineraryBoard(timeRange, {
    enabled: secondaryBoardWarm.has("itinerary"),
    initialItems:
      initialSnapshot?.period === timeRange ? initialSnapshot.itineraries ?? null : null,
  });
  const secondaryLivePollActive =
    (activeBoard === "provider" && providerBoard.livePollActive) ||
    (activeBoard === "acquisition" && acquisitionBoard.livePollActive) ||
    (activeBoard === "itinerary" && itineraryBoard.livePollActive);
  const headerLivePollActive = livePollActive || secondaryLivePollActive;

  const skipPrizeRefreshOnMountRef = useRef(Boolean(initialSnapshot?.prizePool));

  useEffect(() => {
    if (skipPrizeRefreshOnMountRef.current) {
      skipPrizeRefreshOnMountRef.current = false;
      return;
    }
    void prizePool.refresh();
  }, [timeRange, prizePool.refresh]);

  const travelerListRef = useRef<HTMLDivElement>(null);
  const guideListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeRangeState(parsePeriodParam(periodParam || null, "all"));
  }, [periodParam]);

  useEffect(() => {
    setGuideSortState(parseGuideSortParam(guideSortParam || null));
  }, [guideSortParam]);

  const setGuideSort = useCallback(
    (sort: GuideLeaderboardSort) => {
      if (sort === guideSort) return;
      setGuideSortState(sort);
      setPageGuide(1);
      trackDidRankEvent("did_rank_guide_sort_change", { period: timeRange, sort });
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (sort === "weighted") next.delete("guide_sort");
      else if (sort === "reviews") next.set("guide_sort", "reviews");
      else next.set("guide_sort", "reception");
      startTransition(() => {
        router.replace(`${pathname ?? "/did-rank"}?${next.toString()}`, { scroll: false });
      });
    },
    [guideSort, router, pathname, searchParams, timeRange],
  );

  useEffect(() => {
    trackDidRankEvent("did_rank_view", { period: timeRange });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: fire once on mount

  useDidRankEmptyStateImpression(isLoading, isRefreshing, timeRange, listTravelers.length, listGuides.length);

  const setBoard = useCallback(
    (next: DidRankBoardTab) => {
      if (next === activeBoard) return;
      const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
      if (next === "traveler") nextParams.delete("board");
      else nextParams.set("board", next);
      startTransition(() => {
        router.replace(`${pathname ?? "/did-rank"}?${nextParams.toString()}`, { scroll: false });
      });
    },
    [activeBoard, router, pathname, searchParams],
  );

  const setTimeRange = useCallback(
    (range: Period) => {
      if (range === timeRange) return;
      setTimeRangeState(range);
      setPageTraveler(1);
      setPageGuide(1);
      trackDidRankEvent("did_rank_period_change", { period: range });
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("period", range);
      startTransition(() => {
        router.replace(`${pathname ?? "/did-rank"}?${next.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, timeRange],
  );

  const highlightTravelerId = urlTravelerHighlight ?? listTravelers.find((x) => x.is_me)?.id ?? null;
  const highlightGuideId = urlGuideHighlight ?? listGuides.find((x) => x.is_me)?.id ?? null;
  const highlightItineraryId =
    urlItineraryHighlight ?? itineraryBoard.items.find((x) => x.is_me)?.id ?? null;

  const scrollToItineraryRank = useCallback(() => {
    const id = urlItineraryHighlight ?? highlightItineraryId;
    if (!id || typeof document === "undefined") return;
    const el = document.querySelector(`[data-did-rank-itinerary-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [urlItineraryHighlight, highlightItineraryId]);

  const shareTravelerPath = useMemo(
    () => (highlightTravelerId ? buildDidRankSharePath("traveler", highlightTravelerId, timeRange) : null),
    [highlightTravelerId, timeRange],
  );
  const shareGuidePath = useMemo(
    () => (highlightGuideId ? buildDidRankSharePath("guide", highlightGuideId, timeRange) : null),
    [highlightGuideId, timeRange],
  );

  const {
    topTravelers,
    topGuides,
    listTravelersFrom11,
    listGuidesFrom11,
    totalPagesTraveler,
    totalPagesGuide,
    paginatedTravelers,
    paginatedGuides,
  } = useDidRankBoardPagination(listTravelers, listGuides, pageTraveler, pageGuide, PAGE_SIZE);

  const { scrollToTravelerRank, scrollToGuideRank } = useDidRankScrollToMyRank({
    highlightTravelerId,
    highlightGuideId,
    listTravelers,
    listGuides,
    travelerRankTopGridId,
    guideRankTopGridId,
    pageSize: PAGE_SIZE,
    setPageTraveler,
    setPageGuide,
  });

  useDidRankDeepLinkAutoScroll({
    meParam,
    period: timeRange,
    isLoading,
    isRefreshing,
    activeBoard,
    setBoard,
    highlightTravelerId,
    highlightGuideId,
    listTravelers,
    listGuides,
    scrollToTravelerRank,
    scrollToGuideRank,
    itineraryLoading: itineraryBoard.isLoading,
    listItineraries: itineraryBoard.items,
    scrollToItineraryRank,
  });

  const addFailedAvatar = useCallback((id: string) => {
    setFailedAvatarIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const openRecordModal = useCallback((item: TravelerRankItem) => setRecordModal(item), []);
  const openGuideModal = useCallback((item: GuideRankItem) => setGuideModal(item), []);

  return {
    t,
    rankTabPanelId,
    rankTabIdPrefix,
    travelerRankTopGridId,
    guideRankTopGridId,
    meParam,
    timeRange,
    setTimeRange,
    activeBoard,
    setBoard,
    listTravelers,
    listGuides,
    isLoading,
    isRefreshing,
    fetchError,
    apiDataConnected,
    devPreviewActive,
    livePollActive: headerLivePollActive,
    prizePool,
    retryFetch,
    travelerListRef,
    guideListRef,
    topTravelers,
    topGuides,
    listTravelersFrom11,
    listGuidesFrom11,
    totalPagesTraveler,
    totalPagesGuide,
    paginatedTravelers,
    paginatedGuides,
    pageTraveler,
    setPageTraveler,
    pageGuide,
    setPageGuide,
    highlightTravelerId,
    highlightGuideId,
    urlProviderHighlight,
    urlAcquisitionHighlight,
    shareTravelerPath,
    shareGuidePath,
    scrollToTravelerRank,
    scrollToGuideRank,
    failedAvatarIds,
    addFailedAvatar,
    recordModal,
    setRecordModal,
    guideModal,
    setGuideModal,
    openRecordModal,
    openGuideModal,
    providerBoard,
    acquisitionBoard,
    itineraryBoard,
    highlightItineraryId,
    scrollToItineraryRank,
    guideSort,
    setGuideSort,
    guideSortGroupId: `${rankTabIdPrefix}-guide-sort`,
    warmBoard,
  };
}
