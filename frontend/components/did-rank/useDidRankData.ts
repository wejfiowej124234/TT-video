"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";
import {
  applyDidRankDevPreviewGuides,
  applyDidRankDevPreviewTravelers,
} from "@/lib/didRankDevPreview";
import { didRankDevPreviewEnabled } from "@/lib/didRankDevPreviewGate";
import {
  extractDidRankList,
  normalizeDidRankTravelerRow,
  normalizeDidRankGuideRow,
} from "@/lib/didRankResponseNormalize";
import { getDidRankTravelers, getDidRankGuides } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { GuideLeaderboardSort, Period } from "@/lib/didRankUtils";
import { attachDidRankRankDeltas } from "@/lib/didRankRankDelta";
import { useDidRankLivePoll } from "@/lib/useDidRankLivePoll";
import type { DidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData";

/** 按 period 缓存列表数据（向导榜固定综合加权 sort=weighted），与 `app/did-rank/useDidRankPage.ts` 编排同源 */
type PeriodCache = {
  travelers: TravelerRankItem[];
  guides: GuideRankItem[];
  devPreviewActive: boolean;
};

function didRankCacheKey(period: Period, guideSort: GuideLeaderboardSort): string {
  return `${period}:${guideSort}`;
}

/**
 * DID 排行榜页数据：仅 GET did-rank travelers/guides；period 切换、缓存、gen 防竞态、错误映射与 page 原逻辑一致。
 */
function withDevPreviewLists(travelers: TravelerRankItem[], guides: GuideRankItem[]) {
  if (!didRankDevPreviewEnabled()) {
    return { travelers, guides, devPreviewActive: false };
  }
  const tOut = applyDidRankDevPreviewTravelers(travelers);
  const gOut = applyDidRankDevPreviewGuides(guides);
  return {
    travelers: tOut,
    guides: gOut,
    devPreviewActive: tOut !== travelers || gOut !== guides,
  };
}

export function useDidRankData(
  timeRange: Period,
  guideSort: GuideLeaderboardSort,
  t: (key: string) => string,
  options?: { initialSnapshot?: DidRankPageInitialSnapshot | null },
): {
  listTravelers: TravelerRankItem[];
  listGuides: GuideRankItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  fetchError: string | null;
  apiDataConnected: boolean;
  /** ① 本地：已注入预览榜（API 不足 10 条） */
  devPreviewActive: boolean;
  livePollActive: boolean;
  retryFetch: () => void;
} {
  const initialSnapshot = options?.initialSnapshot ?? null;
  const deferInitialFetchRef = useRef(Boolean(initialSnapshot));
  const cacheByPeriod = useRef<Partial<Record<string, PeriodCache>>>(
    initialSnapshot
      ? {
          [didRankCacheKey(initialSnapshot.period, initialSnapshot.guideSort)]: {
            travelers: initialSnapshot.travelers,
            guides: initialSnapshot.guides,
            devPreviewActive: initialSnapshot.devPreviewActive,
          },
        }
      : {},
  );
  const rankFetchGen = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const initialForRange =
    initialSnapshot?.period === timeRange && initialSnapshot.guideSort === guideSort
      ? initialSnapshot
      : null;
  const cacheKey = didRankCacheKey(timeRange, guideSort);
  const cachedForRange = cacheByPeriod.current[cacheKey];

  const [isLoading, setIsLoading] = useState(() => !initialForRange && !cachedForRange);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [apiDataConnected, setApiDataConnected] = useState(() => Boolean(initialForRange));
  const [listTravelersState, setListTravelersState] = useState<TravelerRankItem[]>(
    () => initialForRange?.travelers ?? cachedForRange?.travelers ?? [],
  );
  const [listGuidesState, setListGuidesState] = useState<GuideRankItem[]>(
    () => initialForRange?.guides ?? cachedForRange?.guides ?? [],
  );
  const [devPreviewActive, setDevPreviewActive] = useState(
    () => initialForRange?.devPreviewActive ?? cachedForRange?.devPreviewActive ?? false,
  );

  const fetchRankData = useCallback(
    (period: Period, skipFullLoading = false, signal?: AbortSignal) => {
      rankFetchGen.current += 1;
      const gen = rankFetchGen.current;
      const ck = didRankCacheKey(period, guideSort);
      const fromCache = cacheByPeriod.current[ck];
      if (fromCache && skipFullLoading) {
        setListTravelersState(fromCache.travelers);
        setListGuidesState(fromCache.guides);
        setDevPreviewActive(fromCache.devPreviewActive);
        setIsLoading(false);
        setIsRefreshing(true);
      } else if (!fromCache) {
        setIsLoading(true);
        setListTravelersState([]);
        setListGuidesState([]);
      }
      setFetchError(null);

      const fetchOpts = signal ? { signal } : undefined;
      Promise.all([
        getDidRankTravelers(period, fetchOpts),
        getDidRankGuides(period, guideSort, fetchOpts),
      ])
        .then(([tRaw, gRaw]) => {
          if (gen !== rankFetchGen.current || signal?.aborted) return;
          setApiDataConnected(tRaw != null && gRaw != null);
          const apiTravelers = extractDidRankList(tRaw, "travelers")
            .map(normalizeDidRankTravelerRow)
            .filter((x): x is TravelerRankItem => x != null);
          const apiGuides = extractDidRankList(gRaw, "guides")
            .map(normalizeDidRankGuideRow)
            .filter((x): x is GuideRankItem => x != null);
          const previewed = withDevPreviewLists(apiTravelers, apiGuides);
          const travelers = previewed.travelers.some((r) => r.rank_delta != null)
            ? previewed.travelers
            : attachDidRankRankDeltas(previewed.travelers, `${period}:travelers`);
          const guides = previewed.guides.some((r) => r.rank_delta != null)
            ? previewed.guides
            : attachDidRankRankDeltas(previewed.guides, `${period}:${guideSort}`);
          cacheByPeriod.current[ck] = {
            travelers,
            guides,
            devPreviewActive: previewed.devPreviewActive,
          };
          setListTravelersState(travelers);
          setListGuidesState(guides);
          setDevPreviewActive(previewed.devPreviewActive);
          setFetchError(null);
        })
        .catch((err) => {
          if (gen !== rankFetchGen.current || signal?.aborted) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setApiDataConnected(false);
          if (typeof window !== "undefined") {
            console.error("useDidRankData fetchRankData:", err);
          }
          setFetchError(mapApiReadError(err, t, "didRank_loadError"));
          setListTravelersState(cacheByPeriod.current[ck]?.travelers ?? []);
          setListGuidesState(cacheByPeriod.current[ck]?.guides ?? []);
        })
        .finally(() => {
          if (gen !== rankFetchGen.current || signal?.aborted) return;
          setIsLoading(false);
          setIsRefreshing(false);
        });
    },
    [t, guideSort],
  );

  useLayoutEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const cached = cacheByPeriod.current[didRankCacheKey(timeRange, guideSort)];

    if (deferInitialFetchRef.current && initialSnapshot?.period === timeRange) {
      deferInitialFetchRef.current = false;
      const run = () => fetchRankData(timeRange, true, controller.signal);
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        const id = window.requestIdleCallback(run, { timeout: 2500 });
        return () => {
          window.cancelIdleCallback(id);
          controller.abort();
          if (abortRef.current === controller) abortRef.current = null;
        };
      }
      const timer = window.setTimeout(run, 800);
      return () => {
        window.clearTimeout(timer);
        controller.abort();
        if (abortRef.current === controller) abortRef.current = null;
      };
    }

    fetchRankData(timeRange, !!cached, controller.signal);
    return () => {
      controller.abort();
      if (abortRef.current === controller) abortRef.current = null;
    };
  }, [timeRange, guideSort, fetchRankData, initialSnapshot]);

  const retryFetch = useCallback(() => {
    setFetchError(null);
    fetchRankData(timeRange, listTravelersState.length > 0, abortRef.current?.signal);
  }, [timeRange, fetchRankData, listTravelersState.length]);

  const livePollActive = useDidRankLivePoll(
    () => fetchRankData(timeRange, true),
    apiDataConnected && !fetchError && !isLoading,
  );

  return {
    listTravelers: listTravelersState,
    listGuides: listGuidesState,
    isLoading,
    isRefreshing,
    fetchError,
    apiDataConnected,
    devPreviewActive,
    livePollActive,
    retryFetch,
  };
}
