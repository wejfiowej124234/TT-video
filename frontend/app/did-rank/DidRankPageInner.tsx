"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import DidRankHeader from "@/components/did-rank/DidRankHeader";
import DidRankFetchErrorBanner from "@/components/did-rank/DidRankFetchErrorBanner";
import DidRankPrizePoolSection from "@/components/did-rank/DidRankPrizePoolSection";
import DidRankPrizePoolSkeleton from "@/components/did-rank/DidRankPrizePoolSkeleton";
import DidRankHeaderSkeleton from "@/components/did-rank/DidRankHeaderSkeleton";
import { DidRankRouteAmbientDecor } from "@/components/did-rank/DidRankRouteAmbientDecor";
import { DidRankPreboardEnter } from "@/components/did-rank/DidRankPreboardEnter";
import { DidRankBoardShell } from "@/components/did-rank/DidRankBoardShell";
import DidRankTop10JsonLd from "@/components/did-rank/DidRankTop10JsonLd";
import {
  TT_MARKETING_DID_RANK_PAGE_INNER,
  TT_MARKETING_DID_RANK_PREBOARD_SHELL,
  TT_MARKETING_DID_RANK_PREBOARD_STACK,
} from "@/lib/marketingUi";
import { darkRoutePageShellClass, resolveDidRankBackdropSurface } from "@/lib/marketingDarkPremiumBg";
import type { DidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData";
import { useDidRankPage } from "./useDidRankPage";
import { warmDidRankPeriodData } from "@/lib/didRankPeriodPrefetch";

const DidRankRecordModal = dynamic(
  () => import("@/components/did-rank/DidRankRecordModal"),
  { ssr: false },
);
const DidRankGuideModal = dynamic(
  () => import("@/components/did-rank/DidRankGuideModal"),
  { ssr: false },
);
const TravelerRankBlock = dynamic(() => import("@/components/did-rank/TravelerRankBlock"), {
  loading: () => null,
});
const GuideRankBlock = dynamic(() => import("@/components/did-rank/GuideRankBlock"), {
  loading: () => null,
});
const ProviderRankBlock = dynamic(() => import("@/components/did-rank/ProviderRankBlock"), {
  loading: () => null,
});
const AcquisitionRankBlock = dynamic(() => import("@/components/did-rank/AcquisitionRankBlock"), {
  loading: () => null,
});
const DidRankItineraryRankBlock = dynamic(
  () => import("@/components/did-rank/DidRankItineraryRankBlock"),
  { loading: () => null },
);
const DidRankPageFooter = dynamic(() => import("@/components/did-rank/DidRankPageFooter"), {
  loading: () => null,
});

/** 30 DID排行榜 · Web3 赛博朋克；风格以文档 30 §4 为准 */
export function DidRankPageInner({
  initialSnapshot = null,
}: {
  initialSnapshot?: DidRankPageInitialSnapshot | null;
}) {
  const vm = useDidRankPage({ initialSnapshot });
  const didRankSurface = resolveDidRankBackdropSurface();

  const activePanel = useMemo(() => {
    switch (vm.activeBoard) {
      case "traveler":
        return (
          <TravelerRankBlock
            listRef={vm.travelerListRef}
            listTravelers={vm.listTravelers}
            topTravelers={vm.topTravelers}
            listTravelersFrom11={vm.listTravelersFrom11}
            paginatedTravelers={vm.paginatedTravelers}
            totalPagesTraveler={vm.totalPagesTraveler}
            pageTraveler={vm.pageTraveler}
            setPageTraveler={vm.setPageTraveler}
            highlightTravelerId={vm.highlightTravelerId}
            shareRankPath={vm.shareTravelerPath}
            scrollToTravelerRank={vm.scrollToTravelerRank}
            onOpenRecord={vm.openRecordModal}
            failedAvatarIds={vm.failedAvatarIds}
            addFailedAvatar={vm.addFailedAvatar}
            t={vm.t}
            rankTopGridId={vm.travelerRankTopGridId}
            period={vm.timeRange}
            isRefreshing={vm.isRefreshing}
          />
        );
      case "guide":
        return (
          <GuideRankBlock
            listRef={vm.guideListRef}
            listGuides={vm.listGuides}
            topGuides={vm.topGuides}
            listGuidesFrom11={vm.listGuidesFrom11}
            paginatedGuides={vm.paginatedGuides}
            totalPagesGuide={vm.totalPagesGuide}
            pageGuide={vm.pageGuide}
            setPageGuide={vm.setPageGuide}
            highlightGuideId={vm.highlightGuideId}
            shareRankPath={vm.shareGuidePath}
            scrollToGuideRank={vm.scrollToGuideRank}
            onOpenGuide={vm.openGuideModal}
            failedAvatarIds={vm.failedAvatarIds}
            addFailedAvatar={vm.addFailedAvatar}
            t={vm.t}
            rankTopGridId={vm.guideRankTopGridId}
            period={vm.timeRange}
            isRefreshing={vm.isRefreshing}
            guideSort={vm.guideSort}
            setGuideSort={vm.setGuideSort}
            guideSortGroupId={vm.guideSortGroupId}
          />
        );
      case "itinerary":
        return (
          <DidRankItineraryRankBlock
            period={vm.timeRange}
            t={vm.t}
            boardData={vm.itineraryBoard}
            highlightItineraryId={vm.highlightItineraryId}
            livePollLifted
          />
        );
      case "provider":
        return (
          <ProviderRankBlock
            period={vm.timeRange}
            t={vm.t}
            meParam={vm.meParam}
            highlightUserId={vm.urlProviderHighlight}
            boardData={vm.providerBoard}
            livePollLifted
          />
        );
      case "acquisition":
        return (
          <AcquisitionRankBlock
            period={vm.timeRange}
            t={vm.t}
            meParam={vm.meParam}
            highlightUserId={vm.urlAcquisitionHighlight}
            boardData={vm.acquisitionBoard}
            livePollLifted
          />
        );
      default:
        return null;
    }
  }, [
    vm.activeBoard,
    vm.travelerListRef,
    vm.listTravelers,
    vm.topTravelers,
    vm.listTravelersFrom11,
    vm.paginatedTravelers,
    vm.totalPagesTraveler,
    vm.pageTraveler,
    vm.setPageTraveler,
    vm.highlightTravelerId,
    vm.shareTravelerPath,
    vm.scrollToTravelerRank,
    vm.openRecordModal,
    vm.failedAvatarIds,
    vm.addFailedAvatar,
    vm.t,
    vm.travelerRankTopGridId,
    vm.timeRange,
    vm.isRefreshing,
    vm.guideListRef,
    vm.listGuides,
    vm.topGuides,
    vm.listGuidesFrom11,
    vm.paginatedGuides,
    vm.totalPagesGuide,
    vm.pageGuide,
    vm.setPageGuide,
    vm.highlightGuideId,
    vm.shareGuidePath,
    vm.scrollToGuideRank,
    vm.openGuideModal,
    vm.guideRankTopGridId,
    vm.guideSort,
    vm.setGuideSort,
    vm.guideSortGroupId,
    vm.meParam,
    vm.urlProviderHighlight,
    vm.providerBoard,
    vm.urlAcquisitionHighlight,
    vm.acquisitionBoard,
    vm.itineraryBoard,
  ]);

  return (
    <main
      className={darkRoutePageShellClass(didRankSurface)}
      data-tt-did-rank-dark-surface={didRankSurface}
      aria-label={vm.t("didRank_title")}
      data-tt-did-rank-page="1"
      data-tt-did-rank-phase1-frozen="1"
      data-tt-ui-generation="v2"
      data-tt-marketing-dark-route-shell="1"
    >
      <DidRankRouteAmbientDecor />

      <div className={TT_MARKETING_DID_RANK_PAGE_INNER}>
        <div className={TT_MARKETING_DID_RANK_PREBOARD_STACK}>
          <DidRankFetchErrorBanner fetchError={vm.fetchError} onRetry={vm.retryFetch} t={vm.t} />
          <div className={TT_MARKETING_DID_RANK_PREBOARD_SHELL}>
            {vm.isLoading && !vm.isRefreshing ? (
              <>
                <DidRankPrizePoolSkeleton t={vm.t} omitBottomMargin />
                <DidRankHeaderSkeleton
                  t={vm.t}
                  timeRange={vm.timeRange}
                  setTimeRange={vm.setTimeRange}
                  showMeHint={!vm.meParam}
                  rankTabPanelId={vm.rankTabPanelId}
                  rankTabIdPrefix={vm.rankTabIdPrefix}
                />
              </>
            ) : (
              <DidRankPreboardEnter>
                <DidRankPrizePoolSection
                  t={vm.t}
                  period={vm.timeRange}
                  omitBottomMargin
                  monthlyAmount={vm.prizePool.amount}
                  illustrative={vm.prizePool.illustrative}
                  apiConnected={vm.prizePool.apiConnected}
                  poolNote={vm.prizePool.note}
                  poolSource={vm.prizePool.source}
                />
                <DidRankHeader
                  t={vm.t}
                  timeRange={vm.timeRange}
                  setTimeRange={vm.setTimeRange}
                  showMeHint={!vm.meParam}
                  apiDataConnected={vm.apiDataConnected && !vm.fetchError}
                  devPreviewActive={vm.devPreviewActive}
                  livePollActive={vm.livePollActive}
                  rankTabPanelId={vm.rankTabPanelId}
                  rankTabIdPrefix={vm.rankTabIdPrefix}
                  onWarmPeriod={warmDidRankPeriodData}
                />
              </DidRankPreboardEnter>
            )}
          </div>
        </div>

        {(vm.isLoading || vm.isRefreshing) && (
          <p className="sr-only" role="status" aria-live="polite">
            {vm.isRefreshing ? vm.t("didRank_refreshing") : vm.t("didRank_loading")}
          </p>
        )}
        <DidRankBoardShell
          rankTabPanelId={vm.rankTabPanelId}
          rankTabIdPrefix={vm.rankTabIdPrefix}
          timeRange={vm.timeRange}
          activeBoard={vm.activeBoard}
          onSelectBoard={vm.setBoard}
          onWarmBoard={vm.warmBoard}
          isLoading={vm.isLoading}
          isRefreshing={vm.isRefreshing}
          t={vm.t}
          activePanel={activePanel}
        />

        <AnimatePresence>
          {vm.recordModal ? (
            <DidRankRecordModal
              key={`record-${vm.recordModal.id}`}
              item={vm.recordModal}
              period={vm.timeRange}
              onClose={() => vm.setRecordModal(null)}
              t={vm.t}
            />
          ) : null}
          {vm.guideModal ? (
            <DidRankGuideModal
              key={`guide-${vm.guideModal.id}`}
              item={vm.guideModal}
              period={vm.timeRange}
              guideSort={vm.guideSort}
              onClose={() => vm.setGuideModal(null)}
              t={vm.t}
            />
          ) : null}
        </AnimatePresence>

        <DidRankTop10JsonLd
          isLoading={vm.isLoading}
          listTravelers={vm.listTravelers}
          listGuides={vm.listGuides}
          t={vm.t}
        />
        <DidRankPageFooter t={vm.t} />
      </div>
    </main>
  );
}
