"use client";

import React, { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { GuideRankItem } from "@/lib/didRankTypes";
import {
  isDidRankCommunityProfileId,
  type GuideLeaderboardSort,
  type Period,
} from "@/lib/didRankUtils";
import { DidRankGuideSortControls } from "@/components/did-rank/DidRankGuideSortControls";
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
import { GuideRankBlockRow } from "@/components/did-rank/GuideRankBlockRow";
import { TT_MARKETING_DID_RANK_PAGINATION_BTN, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

const GuideTopCard = React.memo(function GuideTopCard({
  item,
  onOpenGuide,
  avatarFailed,
  onAvatarError,
  onAvatarErrorId,
  t,
  className = "",
  variant = "podium",
  isHighlight = false,
}: {
  item: GuideRankItem;
  onOpenGuide: (item: GuideRankItem) => void;
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
  const columnTheme = didRankColumnTheme("guide");
  const tier = refTopTenCardTier(item.rank, "guide");
  const showAvatar = item.avatar_url && !avatarFailed;
  const initial = (item.nickname && item.nickname.charAt(0)) || "?";
  const isCommunityProfile = isDidRankCommunityProfileId(item.id);
  const avg = item.avgReceivedReviewScore;
  const hasFiniteAvg = typeof avg === "number" && Number.isFinite(avg);
  const composite = hasFiniteAvg ? `${avg.toFixed(1)}/5` : t("ui_em_dash");
  const shell = isPodium
    ? TT_MARKETING_DID_RANK_SURFACE.rankTop10Card
    : TT_MARKETING_DID_RANK_SURFACE.rankTop10RowCard;
  const highlightRing = isHighlight
    ? `${TT_MARKETING_DID_RANK_SURFACE.rankTop10Highlight} ${TT_MARKETING_DID_RANK_SURFACE.rankTop10HighlightOnce}`
    : "";

  const interactiveProps = isCommunityProfile
    ? {}
    : {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": `${item.nickname} — ${t("didRank_viewGuide")}`,
        onClick: () => onOpenGuide(item),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenGuide(item);
          }
        },
      };

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

  const scoreLine = (
    <p
      className={`${columnTheme.metric} ${isPodium ? `${DID_RANK_METRIC_SCORE_PODIUM} text-body mt-0.5` : `${DID_RANK_METRIC_SCORE_ROW}`}`}
    >
      <span className={columnTheme.metricMuted} aria-hidden>
        ★{" "}
      </span>
      {composite}
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
      <DidRankRankDeltaBadge delta={item.rank_delta} column="guide" />
    </div>
  );

  const body = (
    <>
      {isPodium ? (
        <>
          {rankRow}
          {item.rank === 1 ? <DidRankPodiumCrown className="mx-auto mb-0.5" /> : null}
          {avatarNode}
        </>
      ) : (
        <div className="flex w-full items-center gap-2.5 sm:flex-col sm:items-center sm:gap-1 sm:text-center">
          <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-center">
            {rankRow}
            {avatarNode}
          </div>
          <div className="min-w-0 flex-1 sm:flex-none sm:w-full">
            {isCommunityProfile ? (
              <Link
                href={`/community/user/${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
                }}
                className={`${touchTargetLink44Classes} !justify-start min-w-0 w-full text-meta font-medium text-slate-200 truncate hover:text-ref-coral motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
              >
                {item.nickname}
              </Link>
            ) : (
              <p className="text-meta font-medium text-slate-200 truncate">{item.nickname}</p>
            )}
            {scoreLine}
          </div>
        </div>
      )}
      {isPodium && (
        <>
          {isCommunityProfile ? (
            <Link
              href={`/community/user/${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
              }}
              className={`${touchTargetLink44Classes} min-w-0 w-full text-meta font-medium text-slate-200 truncate hover:text-ref-coral motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
            >
              {item.nickname}
            </Link>
          ) : (
            <p className="text-meta font-medium text-slate-200 truncate">{item.nickname}</p>
          )}
          {scoreLine}
          <p className="text-meta text-slate-400 tabular-nums">
            {item.receptionCount} {t("didRank_receptions")}
            {item.city ? ` · ${item.city}` : ""}
          </p>
          <div className="mt-auto pt-1.5 w-full border-t border-ref-sun/10">
            {isCommunityProfile ? (
              <form
                className="w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenGuide(item);
                }}
              >
                <button type="submit" className={TT_MARKETING_DID_RANK_SURFACE.rankPodiumGuideBtn}>
                  {t("didRank_viewGuide")} <span aria-hidden>▶</span>
                </button>
              </form>
            ) : (
              <p className={`${TT_MARKETING_DID_RANK_SURFACE.rankPodiumGuideBtn} flex items-center justify-center`}>
                {t("didRank_viewGuide")} <span aria-hidden>▶</span>
              </p>
            )}
          </div>
        </>
      )}
    </>
  );

  const top10Id = `guide-top10-${item.id}`;

  if (!isPodium) {
    return (
      <div
        id={top10Id}
        {...interactiveProps}
        className={`${shell} transition-[background-color,box-shadow] w-full ${isCommunityProfile ? "" : "cursor-pointer"} ${tier.shell} ${tier.hover} ${highlightRing} ${className}`}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      id={top10Id}
      {...interactiveProps}
      className={`${shell} text-center transition-[border-color,background-color] w-full ${isCommunityProfile ? "" : "cursor-pointer"} ${tier.shell} ${tier.hover} ${highlightRing} ${isTop3 ? "hover:border-fuchsia-400/28" : ""} ${DID_RANK_PODIUM_CARD_MIN_H} ${className}`}
    >
      {body}
    </div>
  );
});

export interface GuideRankBlockProps {
  listRef: React.RefObject<HTMLDivElement | null>;
  listGuides: GuideRankItem[];
  topGuides: GuideRankItem[];
  listGuidesFrom11: GuideRankItem[];
  paginatedGuides: GuideRankItem[];
  totalPagesGuide: number;
  pageGuide: number;
  setPageGuide: (fn: (p: number) => number) => void;
  highlightGuideId: string | null;
  shareRankPath: string | null;
  scrollToGuideRank: () => void;
  onOpenGuide: (item: GuideRankItem) => void;
  failedAvatarIds: Set<string>;
  addFailedAvatar: (id: string) => void;
  t: TFunc;
  /** 前 10 网格锚点，供「跳到我的排名」滚动；由页面 `useId()` 传入 */
  rankTopGridId: string;
  period: Period;
  isRefreshing?: boolean;
  guideSort: GuideLeaderboardSort;
  setGuideSort: (sort: GuideLeaderboardSort) => void;
  guideSortGroupId: string;
}

export default function GuideRankBlock({
  listRef,
  listGuides,
  topGuides,
  listGuidesFrom11,
  paginatedGuides,
  totalPagesGuide,
  pageGuide,
  setPageGuide,
  highlightGuideId,
  shareRankPath,
  scrollToGuideRank,
  onOpenGuide,
  failedAvatarIds,
  addFailedAvatar,
  t,
  rankTopGridId,
  period,
  isRefreshing = false,
  guideSort,
  setGuideSort,
  guideSortGroupId,
}: GuideRankBlockProps) {
  const titleId = useId();
  const restFold = useDidRankFullListFold(listGuidesFrom11, highlightGuideId, period);
  const refreshFlashKey = useDidRankRefreshFlash(isRefreshing);
  const endRank = listGuides.length > 0 ? listGuides[listGuides.length - 1]!.rank : 10;

  const handleScrollToMyRank = () => {
    const myRankInRest = highlightGuideId != null && listGuidesFrom11.some((x) => x.id === highlightGuideId);
    if (myRankInRest) {
      restFold.expand();
      window.setTimeout(() => scrollToGuideRank(), 220);
      return;
    }
    scrollToGuideRank();
  };

  const handleRestFoldToggle = () => {
    const next = !restFold.expanded;
    restFold.setExpanded(next);
    trackDidRankEvent("did_rank_full_list_fold", { list: "guide", period, expanded: next });
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
            <h2 id={titleId} className={didRankMainPanelTitleClass}>{t("didRank_guideRank")}</h2>
            <p className={didRankMainPanelDescClass}>{t("didRank_guideRankDesc")}</p>
          </div>
          {highlightGuideId ? (
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
              {shareRankPath ? <DidRankCopyRankLink sharePath={shareRankPath} board="guide" t={t} /> : null}
            </div>
          ) : null}
        </div>
        <DidRankGuideSortControls
          guideSort={guideSort}
          onSelectSort={setGuideSort}
          t={t}
          sortGroupId={guideSortGroupId}
        />
      </div>
      <div className="p-3 sm:p-4">
        {listGuides.length === 0 ? (
          <div className={TT_MARKETING_DID_RANK_SURFACE.emptyPanel} role="status">
            <p className="text-small">{t("didRank_emptyGuide")}</p>
            <Link
              href="/market"
              onClick={() =>
                trackDidRankEvent("did_rank_empty_market_cta", { list: "guide", period })
              }
              className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-ref-sun hover:text-ref-coral motion-sub ${deepShellInlineLinkFocusClasses}`}
            >
              {t("didRank_emptyMarketCta")}
            </Link>
          </div>
        ) : (
          <DidRankPeriodFade period={period} isRefreshing={isRefreshing}>
            <DidRankTop10Grid
              items={topGuides}
              gridId={rankTopGridId}
              layoutGroupId="did-rank-guide-top10"
              staggerKey={period}
              refreshFlashKey={refreshFlashKey}
              stageTintClass={didRankColumnTheme("guide").top10StageTint}
              podiumLabel={t("didRank_podiumBandLabel")}
              rowBandLabel={t("didRank_ranks4to10BandLabel")}
              renderCard={(guide, cardVariant) => (
                <GuideTopCard
                  className="min-w-0"
                  variant={cardVariant}
                  isHighlight={guide.id === highlightGuideId}
                  item={guide}
                  onOpenGuide={onOpenGuide}
                  avatarFailed={failedAvatarIds.has(guide.id)}
                  onAvatarError={addFailedAvatar}
                  onAvatarErrorId={guide.id}
                  t={t}
                />
              )}
            />
            {listGuides.length > 10 || listGuidesFrom11.length > 0 ? (
              <DidRankFullListFold
                restCount={listGuidesFrom11.length}
                endRank={endRank}
                expanded={restFold.expanded}
                onToggle={handleRestFoldToggle}
                t={t}
                listPanelRingClass={TT_MARKETING_DID_RANK_SURFACE.listPanelRingGuide}
                ariaLabel={t("didRank_fullList11_100")}
                restEmptyI18nKey="didRank_noRank11_100"
                foldHintI18nKey="didRank_fullListFoldHint"
                header={
                  <>
                    <span className="text-right tabular-nums">#</span>
                    <span className="truncate">{t("me_nickname")}</span>
                    <span className="text-right truncate">
                      <span className="text-ref-sun/90" aria-hidden>
                        ★{" "}
                      </span>
                      {t("didRank_guideCompositeLabel")}
                    </span>
                    <span className="hidden sm:block text-right truncate">{t("didRank_receptions")}</span>
                  </>
                }
                footer={
                  totalPagesGuide > 1 ? (
                    <nav
                      aria-label={`${t("didRank_guideRank")} ${t("didRank_fullList11_100")}`}
                      className={TT_MARKETING_DID_RANK_SURFACE.listNavFooter}
                    >
                      <form
                        className="inline"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setPageGuide((p) => Math.max(1, p - 1));
                        }}
                      >
                        <button type="submit" disabled={pageGuide <= 1} className={TT_MARKETING_DID_RANK_PAGINATION_BTN}>
                          {t("didRank_prevPage")}
                        </button>
                      </form>
                      <span aria-current="page">
                        {pageGuide} / {totalPagesGuide}
                      </span>
                      <form
                        className="inline"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setPageGuide((p) => Math.min(totalPagesGuide, p + 1));
                        }}
                      >
                        <button
                          type="submit"
                          disabled={pageGuide >= totalPagesGuide}
                          className={TT_MARKETING_DID_RANK_PAGINATION_BTN}
                        >
                          {t("didRank_nextPage")}
                        </button>
                      </form>
                    </nav>
                  ) : undefined
                }
              >
                {paginatedGuides.map((g, rowIndex) => (
                  <DidRankFullListRowEnter
                    key={g.id}
                    rowIndex={rowIndex}
                    enterKey={restFold.expanded ? `${restFold.enterGeneration}-${pageGuide}` : ""}
                  >
                    <GuideRankBlockRow
                      item={g}
                      listSize={listGuidesFrom11.length}
                      rowIndex={rowIndex}
                      isHighlight={g.id === highlightGuideId}
                      onOpenGuide={onOpenGuide}
                      avatarFailed={failedAvatarIds.has(g.id)}
                      onAvatarError={addFailedAvatar}
                      onAvatarErrorId={g.id}
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
