"use client";

import React, { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem } from "@/lib/didRankTypes";
import { isDidRankCommunityProfileId, type Period } from "@/lib/didRankUtils";
import type { DidRankTop10CardVariant } from "@/lib/refTopTenCardTier";
import {
  DID_RANK_AVATAR_PODIUM_BOX,
  DID_RANK_AVATAR_PODIUM_MEDIA,
  DID_RANK_AVATAR_PODIUM_PLACEHOLDER,
  DID_RANK_AVATAR_PODIUM_PX,
  DID_RANK_AVATAR_TOP10_ROW_MEDIA,
  DID_RANK_AVATAR_TOP10_ROW_PLACEHOLDER,
} from "@/lib/didRankAvatarClasses";
import { didRankColumnTheme } from "@/lib/didRankColumnTheme";
import {
  DID_RANK_METRIC_SCORE_PODIUM,
  DID_RANK_METRIC_SCORE_ROW,
  DID_RANK_PODIUM_CARD_MIN_H,
} from "@/lib/didRankMetricClasses";
import { refTopTenCardTier } from "@/lib/refTopTenCardTier";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  didRankMainPanelClass,
  didRankMainPanelDescClass,
  didRankMainPanelHeaderClass,
  didRankMainPanelTitleClass,
} from "@/components/did-rank/didRankPanelShell";
import { DidRankFullListFold } from "@/components/did-rank/DidRankFullListFold";
import { DidRankPeriodFade } from "@/components/did-rank/DidRankPeriodFade";
import { useDidRankFullListFold } from "@/components/did-rank/useDidRankFullListFold";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { DidRankPodiumCrown } from "@/components/did-rank/DidRankPodiumCrown";
import { DidRankCopyRankLink } from "@/components/did-rank/DidRankCopyRankLink";
import { DidRankFullListRowEnter } from "@/components/did-rank/DidRankFullListRowEnter";
import { DidRankTop10Grid } from "@/components/did-rank/DidRankTop10Grid";
import { useDidRankRefreshFlash } from "@/lib/useDidRankRefreshFlash";
import { TravelerRankBlockRow } from "@/components/did-rank/TravelerRankBlockRow";
import { TT_MARKETING_DID_RANK_PAGINATION_BTN, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

/** 仅当 API 返回有限数时展示数字；缺字段或非数用 em dash，避免与「真实 0 单」混淆。 */
function formatTravelerCompletedOrdersDisplay(item: TravelerRankItem, t: TFunc): string {
  const v = item.completed_orders;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return t("ui_em_dash");
}

const TravelerTopCard = React.memo(function TravelerTopCard({
  item,
  onOpenRecord,
  avatarFailed,
  onAvatarError,
  onAvatarErrorId,
  t,
  className = "",
  variant = "podium",
  isHighlight = false,
}: {
  item: TravelerRankItem;
  onOpenRecord: (item: TravelerRankItem) => void;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  onAvatarErrorId: string;
  t: TFunc;
  className?: string;
  variant?: DidRankTop10CardVariant;
  isHighlight?: boolean;
}) {
  const isPodium = variant === "podium";
  const isTop3 = item.rank <= 3;
  const columnTheme = didRankColumnTheme("traveler");
  const tier = refTopTenCardTier(item.rank, "traveler");
  const ordersDisplay = formatTravelerCompletedOrdersDisplay(item, t);
  const hasRecord = (item.countries?.length ?? 0) > 0 || (item.cities?.length ?? 0) > 0;
  const showAvatar = item.avatar_url && !avatarFailed;
  const initial = (item.nickname && item.nickname.charAt(0)) || "?";
  const shell = isPodium
    ? TT_MARKETING_DID_RANK_SURFACE.rankTop10Card
    : TT_MARKETING_DID_RANK_SURFACE.rankTop10RowCard;
  const highlightRing = isHighlight
    ? `${TT_MARKETING_DID_RANK_SURFACE.rankTop10Highlight} ${TT_MARKETING_DID_RANK_SURFACE.rankTop10HighlightOnce}`
    : "";

  const avatarNode = isPodium ? (
    <span className={`${DID_RANK_AVATAR_PODIUM_BOX} ${tier.avatarRing}`}>
      {showAvatar ? (
        <Image
          src={item.avatar_url!}
          alt={item.nickname}
          width={DID_RANK_AVATAR_PODIUM_PX}
          height={DID_RANK_AVATAR_PODIUM_PX}
          loading="lazy"
          onError={() => onAvatarError(onAvatarErrorId)}
          className={DID_RANK_AVATAR_PODIUM_MEDIA}
          unoptimized
        />
      ) : (
        <div
          role="img"
          aria-label={item.nickname}
          className={`${DID_RANK_AVATAR_PODIUM_PLACEHOLDER} ${tier.avatarPlaceholder}`}
        >
          {initial}
        </div>
      )}
    </span>
  ) : showAvatar ? (
    <Image
      src={item.avatar_url!}
      alt={item.nickname}
      width={44}
      height={44}
      loading="lazy"
      onError={() => onAvatarError(onAvatarErrorId)}
      className={`${DID_RANK_AVATAR_TOP10_ROW_MEDIA} ${tier.avatarRing}`}
      unoptimized
    />
  ) : (
    <div
      role="img"
      aria-label={item.nickname}
      className={`${DID_RANK_AVATAR_TOP10_ROW_PLACEHOLDER} ${tier.avatarPlaceholder} ${tier.avatarRing}`}
    >
      {initial}
    </div>
  );

  const nicknameNode = isDidRankCommunityProfileId(item.id) ? (
    <Link
      href={`/community/user/${item.id}`}
      onClick={() =>
        trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "traveler" })
      }
      className={`${touchTargetLink44Classes} min-w-0 w-full text-meta font-medium text-slate-200 truncate hover:text-ref-coral motion-sub rounded-sm ${deepShellInlineLinkFocusClasses} ${isPodium ? "" : "!justify-start"}`}
    >
      {item.nickname}
    </Link>
  ) : (
    <p className="text-meta font-medium text-slate-200 truncate">{item.nickname}</p>
  );

  const scoreLine = (
    <p
      className={`${columnTheme.metric} ${isPodium ? `${DID_RANK_METRIC_SCORE_PODIUM} text-body mt-0.5` : `${DID_RANK_METRIC_SCORE_ROW}`}`}
    >
      {t("didRank_travelerCompositeLabel")}{" "}
      <span className="tabular-nums">{ordersDisplay}</span>
      {t("didRank_completedOrdersUnit")}
    </p>
  );

  const rankRow = (
    <div
      className={`flex items-center gap-1 ${isPodium ? "justify-center gap-1.5 mb-1 min-h-[2rem] w-full relative" : "shrink-0 sm:mb-1 sm:w-full sm:justify-center"}`}
    >
      {isPodium && item.rank === 1 ? (
        <span
          className="pointer-events-none absolute inset-x-0 top-1 text-center text-[2.5rem] sm:text-[2.75rem] font-black font-mono leading-none text-ink-950/22 select-none"
          aria-hidden
        >
          1
        </span>
      ) : null}
      <span className={`relative z-[1] ${isPodium ? "text-h4" : "text-body"} font-bold font-mono leading-none ${tier.rankText}`}>
        {item.rank}
      </span>
      <DidRankRankDeltaBadge delta={item.rank_delta} column="traveler" />
    </div>
  );

  if (!isPodium) {
    return (
      <div
        id={`traveler-top10-${item.id}`}
        className={`${shell} transition-[background-color,box-shadow] ${tier.shell} ${tier.hover} ${highlightRing} ${className}`}
      >
        <div className="flex w-full items-center gap-2.5 sm:flex-col sm:items-center sm:gap-1 sm:text-center">
          <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-center">
            {rankRow}
            {avatarNode}
          </div>
          <div className="min-w-0 flex-1 sm:flex-none sm:w-full">
            {nicknameNode}
            {scoreLine}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`traveler-top10-${item.id}`}
      className={`${shell} text-center transition-[border-color,background-color] ${tier.shell} ${tier.hover} ${highlightRing} ${isTop3 ? "hover:border-ref-sun/28" : ""} ${DID_RANK_PODIUM_CARD_MIN_H} ${className}`}
    >
      {rankRow}
      {item.rank === 1 ? <DidRankPodiumCrown className="mx-auto mb-0.5" /> : null}
      {avatarNode}
      {nicknameNode}
      {scoreLine}
      <p className="text-meta text-slate-400">
        {item.countriesCount} {t("didRank_countriesShort")} · {item.citiesCount} {t("didRank_citiesShort")}
      </p>
      {hasRecord && (
        <form
          className="mt-auto pt-1.5 w-full border-t border-ref-sun/10"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenRecord(item);
          }}
        >
          <button type="submit" className={TT_MARKETING_DID_RANK_SURFACE.rankPodiumRecordBtn}>
            {t("didRank_record")} <span aria-hidden>▶</span>
          </button>
        </form>
      )}
    </div>
  );
});

export interface TravelerRankBlockProps {
  listRef: React.RefObject<HTMLDivElement | null>;
  listTravelers: TravelerRankItem[];
  topTravelers: TravelerRankItem[];
  listTravelersFrom11: TravelerRankItem[];
  paginatedTravelers: TravelerRankItem[];
  totalPagesTraveler: number;
  pageTraveler: number;
  setPageTraveler: (fn: (p: number) => number) => void;
  highlightTravelerId: string | null;
  shareRankPath: string | null;
  scrollToTravelerRank: () => void;
  onOpenRecord: (item: TravelerRankItem) => void;
  failedAvatarIds: Set<string>;
  addFailedAvatar: (id: string) => void;
  t: TFunc;
  rankTopGridId: string;
  period: Period;
  isRefreshing?: boolean;
}

export default function TravelerRankBlock({
  listRef,
  listTravelers,
  topTravelers,
  listTravelersFrom11,
  paginatedTravelers,
  totalPagesTraveler,
  pageTraveler,
  setPageTraveler,
  highlightTravelerId,
  shareRankPath,
  scrollToTravelerRank,
  onOpenRecord,
  failedAvatarIds,
  addFailedAvatar,
  t,
  rankTopGridId,
  period,
  isRefreshing = false,
}: TravelerRankBlockProps) {
  const titleId = useId();
  const restFold = useDidRankFullListFold(listTravelersFrom11, highlightTravelerId, period);
  const refreshFlashKey = useDidRankRefreshFlash(isRefreshing);
  const endRank = listTravelers.length > 0 ? listTravelers[listTravelers.length - 1]!.rank : 10;

  const handleScrollToMyRank = () => {
    const myRankInRest =
      highlightTravelerId != null && listTravelersFrom11.some((x) => x.id === highlightTravelerId);
    if (myRankInRest) {
      restFold.expand();
      window.setTimeout(() => scrollToTravelerRank(), 220);
      return;
    }
    scrollToTravelerRank();
  };

  const handleRestFoldToggle = () => {
    const next = !restFold.expanded;
    restFold.setExpanded(next);
    trackDidRankEvent("did_rank_full_list_fold", { list: "traveler", period, expanded: next });
  };

  return (
    <section
      ref={listRef as React.RefObject<HTMLElement> | undefined}
      className={didRankMainPanelClass}
      aria-labelledby={titleId}
    >
      <div className={didRankMainPanelHeaderClass}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 id={titleId} className={didRankMainPanelTitleClass}>{t("didRank_travelerRank")}</h2>
            <p className={didRankMainPanelDescClass}>{t("didRank_travelerRankDesc")}</p>
          </div>
          {highlightTravelerId ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScrollToMyRank();
                }}
              >
                <button
                  type="submit"
                  className="rounded-[var(--radius-sm)] border border-ref-sun/35 bg-ref-sun/12 px-2 py-1 text-meta text-ref-sun/90 hover:text-ref-sun hover:bg-ref-sun/20 motion-sub"
                >
                  {t("didRank_goToMyRank")}
                </button>
              </form>
              {shareRankPath ? (
                <DidRankCopyRankLink sharePath={shareRankPath} board="traveler" t={t} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="p-3 sm:p-4">
        {listTravelers.length === 0 ? (
          <div className={TT_MARKETING_DID_RANK_SURFACE.emptyPanel} role="status">
            <p className="text-small">{t("didRank_emptyTraveler")}</p>
            <Link
              href="/market"
              onClick={() =>
                trackDidRankEvent("did_rank_empty_market_cta", { list: "traveler", period })
              }
              className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-ref-sun hover:text-ref-coral motion-sub ${deepShellInlineLinkFocusClasses}`}
            >
              {t("didRank_emptyMarketCta")}
            </Link>
          </div>
        ) : (
          <DidRankPeriodFade period={period} isRefreshing={isRefreshing}>
            <DidRankTop10Grid
              items={topTravelers}
              gridId={rankTopGridId}
              layoutGroupId="did-rank-traveler-top10"
              staggerKey={period}
              refreshFlashKey={refreshFlashKey}
              stageTintClass={didRankColumnTheme("traveler").top10StageTint}
              podiumLabel={t("didRank_podiumBandLabel")}
              rowBandLabel={t("didRank_ranks4to10BandLabel")}
              renderCard={(traveler, cardVariant) => (
                <TravelerTopCard
                  className="min-w-0"
                  variant={cardVariant}
                  isHighlight={traveler.id === highlightTravelerId}
                  item={traveler}
                  onOpenRecord={onOpenRecord}
                  avatarFailed={failedAvatarIds.has(traveler.id)}
                  onAvatarError={addFailedAvatar}
                  onAvatarErrorId={traveler.id}
                  t={t}
                />
              )}
            />
            {listTravelers.length > 10 || listTravelersFrom11.length > 0 ? (
              <DidRankFullListFold
                restCount={listTravelersFrom11.length}
                endRank={endRank}
                expanded={restFold.expanded}
                onToggle={handleRestFoldToggle}
                t={t}
                ariaLabel={t("didRank_fullList11_100")}
                restEmptyI18nKey="didRank_noRank11_100"
                foldHintI18nKey="didRank_fullListFoldHint"
                listPanelRingClass={TT_MARKETING_DID_RANK_SURFACE.listPanelRingTraveler}
                header={
                  <>
                    <span className="text-right tabular-nums">#</span>
                    <span className="truncate">{t("me_nickname")}</span>
                    <span className="text-right tabular-nums">{t("didRank_compositeScoreShort")}</span>
                    <span className="hidden sm:block text-right truncate">
                      {t("didRank_countriesShort")}/{t("didRank_citiesShort")}
                    </span>
                  </>
                }
                footer={
                  totalPagesTraveler > 1 ? (
                    <nav
                      aria-label={`${t("didRank_travelerRank")} ${t("didRank_fullList11_100")}`}
                      className={TT_MARKETING_DID_RANK_SURFACE.listNavFooter}
                    >
                      <form
                        className="inline"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setPageTraveler((p) => Math.max(1, p - 1));
                        }}
                      >
                        <button type="submit" disabled={pageTraveler <= 1} className={TT_MARKETING_DID_RANK_PAGINATION_BTN}>
                          {t("didRank_prevPage")}
                        </button>
                      </form>
                      <span aria-current="page">
                        {pageTraveler} / {totalPagesTraveler}
                      </span>
                      <form
                        className="inline"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setPageTraveler((p) => Math.min(totalPagesTraveler, p + 1));
                        }}
                      >
                        <button
                          type="submit"
                          disabled={pageTraveler >= totalPagesTraveler}
                          className={TT_MARKETING_DID_RANK_PAGINATION_BTN}
                        >
                          {t("didRank_nextPage")}
                        </button>
                      </form>
                    </nav>
                  ) : undefined
                }
              >
                {paginatedTravelers.map((item, rowIndex) => (
                  <DidRankFullListRowEnter
                    key={item.id}
                    rowIndex={rowIndex}
                    enterKey={
                      restFold.expanded ? `${restFold.enterGeneration}-${pageTraveler}` : ""
                    }
                  >
                    <TravelerRankBlockRow
                      item={item}
                      listSize={listTravelersFrom11.length}
                      rowIndex={rowIndex}
                      isHighlight={item.id === highlightTravelerId}
                      onOpenRecord={onOpenRecord}
                      avatarFailed={failedAvatarIds.has(item.id)}
                      onAvatarError={addFailedAvatar}
                      onAvatarErrorId={item.id}
                      t={t}
                    />
                  </DidRankFullListRowEnter>
                ))}
              </DidRankFullListFold>
            ) : null}
          </DidRankPeriodFade>
        )}
      </div>
    </section>
  );
}
