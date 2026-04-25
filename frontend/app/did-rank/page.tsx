"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useState, useCallback, useEffect, useLayoutEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";
import {
  extractDidRankList,
  normalizeDidRankTravelerRow,
  normalizeDidRankGuideRow,
} from "@/lib/didRankResponseNormalize";
import { getDidRankTravelers, getDidRankGuides } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  parsePeriodParam,
  parseDidRankBoardParam,
  getTotalPages,
  getPaginatedSlice,
  type DidRankBoardTab,
  type Period,
} from "@/lib/didRankUtils";
import DidRankSkeleton from "@/components/did-rank/DidRankSkeleton";
import DidRankHeader from "@/components/did-rank/DidRankHeader";
import DidRankFetchErrorBanner from "@/components/did-rank/DidRankFetchErrorBanner";
import DidRankPrizePoolSection from "@/components/did-rank/DidRankPrizePoolSection";
import DidRankPrizePoolSkeleton from "@/components/did-rank/DidRankPrizePoolSkeleton";
import DidRankHeaderSkeleton from "@/components/did-rank/DidRankHeaderSkeleton";
import TravelerRankBlock from "@/components/did-rank/TravelerRankBlock";
import GuideRankBlock from "@/components/did-rank/GuideRankBlock";
import ProviderRankBlock from "@/components/did-rank/ProviderRankBlock";
import AcquisitionRankBlock from "@/components/did-rank/AcquisitionRankBlock";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { DidRankRouteSuspense } from "@/components/did-rank/DidRankRouteSuspense";
import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const DidRankRecordModal = dynamic(
  () => import("@/components/did-rank/DidRankRecordModal"),
  { ssr: false }
);
const DidRankGuideModal = dynamic(
  () => import("@/components/did-rank/DidRankGuideModal"),
  { ssr: false }
);

/** 按 period 缓存列表数据（向导榜固定综合加权 sort=weighted），切换回来时立即展示、再后台刷新 */
type PeriodCache = { travelers: TravelerRankItem[]; guides: GuideRankItem[] };

function didRankCacheKey(period: Period): string {
  return period;
}

const PAGE_SIZE = 20;

const DID_RANK_BOARD_ORDER: DidRankBoardTab[] = ["traveler", "guide", "provider", "acquisition"];

function usePreviousDidRankBoard(value: DidRankBoardTab): DidRankBoardTab | undefined {
  const ref = useRef<DidRankBoardTab | undefined>(undefined);
  const prev = ref.current;
  ref.current = value;
  return prev;
}

function didRankFlipTransition(reduced: boolean) {
  return reduced
    ? { duration: 0.01, ease: "linear" as const }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };
}

function didRankPageVariants(reduced: boolean) {
  if (reduced) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    enter: (dir: number) => ({
      x: dir * 72,
      opacity: 0,
      rotateY: dir * -18,
      filter: "blur(10px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      x: -dir * 56,
      opacity: 0,
      rotateY: dir * 14,
      filter: "blur(10px)",
    }),
  };
}

/** 同会话内每个「周期 × 榜单类型」空态曝光只上报一次（dev Strict Mode 复挂载不致重复刷屏） */
const didRankEmptyStateImpressionKeys = new Set<string>();

/** 30 DID排行榜 · Web3 赛博朋克；风格以文档 30 §4 为准 */
function DidRankPageInner() {
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
  const activeBoard = parseDidRankBoardParam(searchParams?.get("board") ?? null);
  const prevBoard = usePreviousDidRankBoard(activeBoard);
  const slideDir =
    prevBoard === undefined
      ? 1
      : DID_RANK_BOARD_ORDER.indexOf(activeBoard) >= DID_RANK_BOARD_ORDER.indexOf(prevBoard)
        ? 1
        : -1;
  const reduceMotion = useReducedMotion();
  const flipTransition = didRankFlipTransition(!!reduceMotion);
  const pageVariants = didRankPageVariants(!!reduceMotion);
  /** `?me=traveler-<用户UUID>` / `guide-<用户UUID>`；与列表项 `id`（用户 UUID）对齐 */
  const urlTravelerHighlight = meParam.startsWith("traveler-") ? meParam.slice("traveler-".length) : null;
  const urlGuideHighlight = meParam.startsWith("guide-") ? meParam.slice("guide-".length) : null;

  const [timeRange, setTimeRangeState] = useState<Period>(() => parsePeriodParam(periodParam || null, "all"));
  const [pageTraveler, setPageTraveler] = useState(1);
  const [pageGuide, setPageGuide] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recordModal, setRecordModal] = useState<TravelerRankItem | null>(null);
  const [guideModal, setGuideModal] = useState<GuideRankItem | null>(null);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  /** 三条 GET did-rank 均返回 200 且 body 解析成功 */
  const [apiDataConnected, setApiDataConnected] = useState(false);
  const [listTravelersState, setListTravelersState] = useState<TravelerRankItem[]>([]);
  const [listGuidesState, setListGuidesState] = useState<GuideRankItem[]>([]);

  const travelerListRef = useRef<HTMLDivElement>(null);
  const guideListRef = useRef<HTMLDivElement>(null);
  const cacheByPeriod = useRef<Partial<Record<string, PeriodCache>>>({});
  /** 忽略过期 Promise 回调，避免慢请求覆盖新 period 列表 */
  const rankFetchGen = useRef(0);

  // URL → state：地址栏 ?period= 变化时同步（如用户手动改 URL）
  useEffect(() => {
    setTimeRangeState(parsePeriodParam(periodParam || null, "all"));
  }, [periodParam]);

  // 数据：仅 DID 排行 API；失败时保留本 period 内存缓存或空列表（无本地 mock 注入）；切换 period 时先展示缓存再后台刷新
  const fetchRankData = useCallback(
    (period: Period, skipFullLoading = false) => {
      rankFetchGen.current += 1;
      const gen = rankFetchGen.current;
      const ck = didRankCacheKey(period);
      const fromCache = cacheByPeriod.current[ck];
      if (fromCache && skipFullLoading) {
        setListTravelersState(fromCache.travelers);
        setListGuidesState(fromCache.guides);
        setIsLoading(false);
        setIsRefreshing(true);
      } else if (!fromCache) {
        setIsLoading(true);
        setListTravelersState([]);
        setListGuidesState([]);
      }
      setFetchError(null);

      Promise.all([getDidRankTravelers(period), getDidRankGuides(period, "weighted")])
        .then(([tRaw, gRaw]) => {
          if (gen !== rankFetchGen.current) return;
          setApiDataConnected(tRaw != null && gRaw != null);
          const travelers = extractDidRankList(tRaw, "travelers")
            .map(normalizeDidRankTravelerRow)
            .filter((x): x is TravelerRankItem => x != null);
          const guides = extractDidRankList(gRaw, "guides")
            .map(normalizeDidRankGuideRow)
            .filter((x): x is GuideRankItem => x != null);
          cacheByPeriod.current[ck] = { travelers, guides };
          setListTravelersState(travelers);
          setListGuidesState(guides);
          setFetchError(null);
        })
        .catch((err) => {
          if (gen !== rankFetchGen.current) return;
          setApiDataConnected(false);
          if (typeof window !== "undefined") {
            console.error("DidRankPage fetchRankData:", err);
          }
          setFetchError(mapApiReadError(err, t, "didRank_loadError"));
          setListTravelersState(cacheByPeriod.current[ck]?.travelers ?? []);
          setListGuidesState(cacheByPeriod.current[ck]?.guides ?? []);
        })
        .finally(() => {
          if (gen !== rankFetchGen.current) return;
          setIsLoading(false);
          setIsRefreshing(false);
        });
    },
    [t],
  );

  useLayoutEffect(() => {
    const cached = cacheByPeriod.current[didRankCacheKey(timeRange)];
    fetchRankData(timeRange, !!cached);
  }, [timeRange, fetchRankData]);

  // §8.7 埋点：进入页（仅首屏一次）
  useEffect(() => {
    trackDidRankEvent("did_rank_view", { period: timeRange });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: fire once on mount

  // 空态曝光：列表拉取结束且对应榜为空时各报一次（含 period / list；向导榜含 guide_sort）
  useEffect(() => {
    if (isLoading || isRefreshing) return;
    const fire = (list: "traveler" | "guide", isEmpty: boolean) => {
      if (!isEmpty) return;
      const key = `${timeRange}:${list}`;
      if (didRankEmptyStateImpressionKeys.has(key)) return;
      didRankEmptyStateImpressionKeys.add(key);
      trackDidRankEvent("did_rank_empty_state", { list, period: timeRange });
    };
    fire("traveler", listTravelersState.length === 0);
    fire("guide", listGuidesState.length === 0);
  }, [isLoading, isRefreshing, timeRange, listTravelersState.length, listGuidesState.length]);

  const setBoard = useCallback(
    (next: DidRankBoardTab) => {
      if (next === activeBoard) return;
      const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
      if (next === "traveler") nextParams.delete("board");
      else nextParams.set("board", next);
      router.replace(`${pathname ?? "/did-rank"}?${nextParams.toString()}`, { scroll: false });
    },
    [activeBoard, router, pathname, searchParams],
  );

  const retryFetch = useCallback(() => {
    setFetchError(null);
    fetchRankData(timeRange, listTravelersState.length > 0);
  }, [timeRange, fetchRankData, listTravelersState.length]);

  // 切换时间范围：同步 URL、重置分页；同 period 不重复请求；useEffect 会随 timeRange 拉数
  const setTimeRange = useCallback(
    (range: Period) => {
      if (range === timeRange) return;
      setTimeRangeState(range);
      setPageTraveler(1);
      setPageGuide(1);
      trackDidRankEvent("did_rank_period_change", { period: range });
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("period", range);
      router.replace(`${pathname ?? "/did-rank"}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, timeRange]
  );

  const listTravelers = listTravelersState;
  const listGuides = listGuidesState;
  const highlightTravelerId = urlTravelerHighlight ?? listTravelers.find((x) => x.is_me)?.id ?? null;
  const highlightGuideId = urlGuideHighlight ?? listGuides.find((x) => x.is_me)?.id ?? null;
  const topTravelers = listTravelers.slice(0, 10);
  const topGuides = listGuides.slice(0, 10);
  // 下方列表只显示 11～100 名，不重复前 10
  const listTravelersFrom11 = listTravelers.slice(10);
  const listGuidesFrom11 = listGuides.slice(10);

  const totalPagesTraveler = getTotalPages(listTravelersFrom11.length, PAGE_SIZE);
  const totalPagesGuide = getTotalPages(listGuidesFrom11.length, PAGE_SIZE);
  const paginatedTravelers = getPaginatedSlice(listTravelersFrom11, pageTraveler, PAGE_SIZE);
  const paginatedGuides = getPaginatedSlice(listGuidesFrom11, pageGuide, PAGE_SIZE);

  const scrollToTravelerRank = useCallback(() => {
    if (!highlightTravelerId) return;
    trackDidRankEvent("did_rank_go_to_my_rank", { type: "traveler" });
    const idx = listTravelers.findIndex((x) => x.id === highlightTravelerId);
    if (idx >= 0) {
      if (idx < 10) {
        setPageTraveler(1);
        setTimeout(() => document.getElementById(travelerRankTopGridId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      } else {
        const page = Math.floor((idx - 10) / PAGE_SIZE) + 1;
        setPageTraveler(page);
        setTimeout(() => {
          document.getElementById(`traveler-row-${highlightTravelerId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [highlightTravelerId, listTravelers, travelerRankTopGridId]);

  const scrollToGuideRank = useCallback(() => {
    if (!highlightGuideId) return;
    trackDidRankEvent("did_rank_go_to_my_rank", { type: "guide" });
    const idx = listGuides.findIndex((x) => x.id === highlightGuideId);
    if (idx >= 0) {
      if (idx < 10) {
        setPageGuide(1);
        setTimeout(() => document.getElementById(guideRankTopGridId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      } else {
        const page = Math.floor((idx - 10) / PAGE_SIZE) + 1;
        setPageGuide(page);
        setTimeout(() => {
          document.getElementById(`guide-row-${highlightGuideId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [highlightGuideId, listGuides, guideRankTopGridId]);

  const addFailedAvatar = useCallback((id: string) => {
    setFailedAvatarIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const openRecordModal = useCallback((item: TravelerRankItem) => setRecordModal(item), []);
  const openGuideModal = useCallback((item: GuideRankItem) => setGuideModal(item), []);

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#14100d]" aria-label={t("didRank_title")}>
      <WarmRouteFieldBackdrop />
      <div
        className="fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.42] pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-scifi-gradient-static opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ref-cyan/8 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_50%_-15%,rgba(249,215,121,0.12),transparent_52%),radial-gradient(circle_at_85%_12%,rgba(252,164,124,0.14),transparent_42%),radial-gradient(circle_at_10%_80%,rgba(35,206,217,0.07),transparent_40%)]" />
        <div className="absolute inset-0 bg-ref-silhouette-vignette opacity-[0.55]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
        {/* 错误条与奖池/Header（骨架或真组件）同列 `gap`，与 649 首屏骨架并列时不抢叠层、不重 `mb-4` */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <DidRankFetchErrorBanner fetchError={fetchError} onRetry={retryFetch} t={t} />
          {isLoading && !isRefreshing ? (
            <>
              <DidRankPrizePoolSkeleton t={t} omitBottomMargin />
              <DidRankHeaderSkeleton
                t={t}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                showMeHint={!meParam}
                rankTabPanelId={rankTabPanelId}
                rankTabIdPrefix={rankTabIdPrefix}
              />
            </>
          ) : (
            <>
              <DidRankPrizePoolSection t={t} omitBottomMargin />
              <DidRankHeader
                t={t}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                showMeHint={!meParam}
                apiDataConnected={apiDataConnected && !fetchError}
                rankTabPanelId={rankTabPanelId}
                rankTabIdPrefix={rankTabIdPrefix}
              />
            </>
          )}
        </div>

        {(isLoading || isRefreshing) && (
          <p className="sr-only" role="status" aria-live="polite">{isRefreshing ? t("didRank_refreshing") : t("didRank_loading")}</p>
        )}
        {isRefreshing && (
          <div className="mb-2 rounded-[var(--radius-sm)] border border-ref-coral/25 bg-white/8 px-3 py-1.5 text-meta text-slate-200 flex items-center gap-2" role="status">
            <span className="inline-block w-4 h-4 border-2 border-ref-sun/80 border-t-transparent rounded-full animate-spin" aria-hidden />
            {t("didRank_refreshing")}
          </div>
        )}
        <div
          id={rankTabPanelId}
          role="presentation"
          aria-labelledby={`${rankTabIdPrefix}-${timeRange}`}
          className="rounded-[var(--radius-xl)] border border-white/18 bg-ink-900/55 backdrop-blur-md p-2 sm:p-3 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.07)] flex flex-col lg:flex-row gap-3 lg:gap-0 lg:items-stretch"
          aria-busy={isLoading || isRefreshing ? true : undefined}
        >
          <nav
            role="tablist"
            aria-label={t("didRank_boardNavAria")}
            className="flex flex-col gap-2 p-3 rounded-[var(--radius-lg)] border border-white/12 bg-gradient-to-b from-slate-900/92 to-slate-950/95 lg:w-[11.5rem] shrink-0 lg:rounded-r-none lg:border-r-2 lg:border-r-cyan-500/25 lg:shadow-[inset_-8px_0_20px_-10px_rgba(0,0,0,0.5)]"
          >
            {(
              [
                { id: "traveler" as const, labelKey: "didRank_travelerRankShort" },
                { id: "guide" as const, labelKey: "didRank_guideRankShort" },
                { id: "provider" as const, labelKey: "didRank_providerRankShort" },
                { id: "acquisition" as const, labelKey: "didRank_acquisitionRankShort" },
              ] as const
            ).map((b) => {
              const selected = activeBoard === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`did-rank-board-panel-${b.id}`}
                  id={`did-rank-board-tab-${b.id}`}
                  onClick={() => setBoard(b.id)}
                  className={`min-h-[48px] w-full rounded-[var(--radius-md)] border px-3 py-3 text-left text-small font-medium transition-[transform,background-color,border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 ${
                    selected
                      ? "border-cyan-400/55 bg-cyan-500/18 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22),0_0_20px_-8px_rgba(34,211,238,0.35)] lg:translate-x-1"
                      : "border-transparent bg-ink-800/35 text-slate-400 hover:border-white/12 hover:text-slate-200 hover:bg-ink-700/50"
                  }`}
                >
                  {t(b.labelKey)}
                </button>
              );
            })}
          </nav>

          <div
            className="flex-1 min-w-0 lg:pl-2 flex flex-col"
            style={reduceMotion ? undefined : { perspective: 1240 }}
          >
            <div className="relative flex-1 min-h-[min(520px,72vh)] overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-ink-800/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
              {isLoading && !isRefreshing ? (
                <div className="p-1 sm:p-2 h-full overflow-auto">
                  <DidRankSkeleton t={t} />
                </div>
              ) : (
                <AnimatePresence mode="wait" custom={slideDir}>
                  <motion.div
                    key={activeBoard}
                    role="tabpanel"
                    id={`did-rank-board-panel-${activeBoard}`}
                    aria-labelledby={`did-rank-board-tab-${activeBoard}`}
                    custom={slideDir}
                    variants={pageVariants}
                    initial={prevBoard === undefined ? false : "enter"}
                    animate="center"
                    exit="exit"
                    transition={flipTransition}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden p-1 sm:p-2"
                    style={{
                      transformStyle: reduceMotion ? undefined : "preserve-3d",
                      backfaceVisibility: reduceMotion ? undefined : "hidden",
                      willChange: reduceMotion ? undefined : "transform, opacity, filter",
                    }}
                  >
                    {activeBoard === "traveler" && (
                      <TravelerRankBlock
                        listRef={travelerListRef}
                        listTravelers={listTravelers}
                        topTravelers={topTravelers}
                        listTravelersFrom11={listTravelersFrom11}
                        paginatedTravelers={paginatedTravelers}
                        totalPagesTraveler={totalPagesTraveler}
                        pageTraveler={pageTraveler}
                        setPageTraveler={setPageTraveler}
                        highlightTravelerId={highlightTravelerId}
                        scrollToTravelerRank={scrollToTravelerRank}
                        onOpenRecord={openRecordModal}
                        failedAvatarIds={failedAvatarIds}
                        addFailedAvatar={addFailedAvatar}
                        t={t}
                        rankTopGridId={travelerRankTopGridId}
                        period={timeRange}
                      />
                    )}
                    {activeBoard === "guide" && (
                      <GuideRankBlock
                        listRef={guideListRef}
                        listGuides={listGuides}
                        topGuides={topGuides}
                        listGuidesFrom11={listGuidesFrom11}
                        paginatedGuides={paginatedGuides}
                        totalPagesGuide={totalPagesGuide}
                        pageGuide={pageGuide}
                        setPageGuide={setPageGuide}
                        highlightGuideId={highlightGuideId}
                        scrollToGuideRank={scrollToGuideRank}
                        onOpenGuide={openGuideModal}
                        failedAvatarIds={failedAvatarIds}
                        addFailedAvatar={addFailedAvatar}
                        t={t}
                        rankTopGridId={guideRankTopGridId}
                        period={timeRange}
                      />
                    )}
                    {activeBoard === "provider" && <ProviderRankBlock period={timeRange} t={t} />}
                    {activeBoard === "acquisition" && <AcquisitionRankBlock period={timeRange} t={t} />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {recordModal && (
          <DidRankRecordModal item={recordModal} period={timeRange} onClose={() => setRecordModal(null)} t={t} />
        )}
        {guideModal && (
          <DidRankGuideModal
            item={guideModal}
            period={timeRange}
            guideSort="weighted"
            onClose={() => setGuideModal(null)}
            t={t}
          />
        )}

        {/* §8.4 SEO：旅行者/向导榜各前 10 ItemList */}
        {!isLoading && listTravelers.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: `${t("didRank_travelerRank")} ${t("didRank_top10")}`,
                numberOfItems: Math.min(10, listTravelers.length),
                itemListElement: listTravelers.slice(0, 10).map((item) => ({
                  "@type": "ListItem",
                  position: item.rank,
                  name: item.nickname,
                })),
              }),
            }}
          />
        )}
        {!isLoading && listGuides.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: `${t("didRank_guideRank")} ${t("didRank_top10")}`,
                numberOfItems: Math.min(10, listGuides.length),
                itemListElement: listGuides.slice(0, 10).map((item) => ({
                  "@type": "ListItem",
                  position: item.rank,
                  name: item.nickname,
                })),
              }),
            }}
          />
        )}
        <footer className="mt-6 sm:mt-8 text-center space-y-3">
          <ProductCrossNav
            ariaLabelKey="did_rank_relatedNav_aria"
            showGuides
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
            linkClassName="inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline motion-sub motion-reduce:transition-none hover:drop-shadow-scifi-cyan-link focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 rounded-[var(--radius-sm)] px-0.5"
            separatorClassName="text-slate-500"
          />
          <div>
            <Link
              href="/"
              className={`${touchTargetLink44Classes} font-medium text-small text-cyan-300 hover:text-cyan-100 motion-sub motion-reduce:transition-none hover:drop-shadow-scifi-cyan-strong ${deepShellInlineLinkFocusClasses}`}
            >
              {t("didRank_back")}
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default function DidRankPage() {
  return (
    <DidRankRouteSuspense>
      <DidRankPageInner />
    </DidRankRouteSuspense>
  );
}
