"use client";

import React, { useId, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import {
  getPaginatedSlice,
  getTotalPages,
  isDidRankCommunityProfileId,
  type Period,
} from "@/lib/didRankUtils";
import { didRankColumnTheme, type DidRankListColumn } from "@/lib/didRankColumnTheme";
import {
  DID_RANK_AVATAR_PODIUM_BOX,
  DID_RANK_AVATAR_PODIUM_MEDIA,
  DID_RANK_AVATAR_PODIUM_PLACEHOLDER,
  DID_RANK_AVATAR_PODIUM_PX,
  DID_RANK_AVATAR_TOP10_ROW_MEDIA,
  DID_RANK_AVATAR_TOP10_ROW_PLACEHOLDER,
} from "@/lib/didRankAvatarClasses";
import { DID_RANK_PODIUM_CARD_MIN_H } from "@/lib/didRankMetricClasses";
import { refTopTenCardTier } from "@/lib/refTopTenCardTier";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { DidRankFullListFold } from "@/components/did-rank/DidRankFullListFold";
import { DidRankPeriodFade } from "@/components/did-rank/DidRankPeriodFade";
import { useDidRankFullListFold } from "@/components/did-rank/useDidRankFullListFold";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { DidRankPodiumCrown } from "@/components/did-rank/DidRankPodiumCrown";
import { DidRankFullListRowEnter } from "@/components/did-rank/DidRankFullListRowEnter";
import { DidRankTop10Grid } from "@/components/did-rank/DidRankTop10Grid";
import { useDidRankRefreshFlash } from "@/lib/useDidRankRefreshFlash";
import { DidRankSecondaryRankBlockRow } from "@/components/did-rank/DidRankSecondaryRankBlockRow";
import type { DidRankSecondaryRow } from "@/components/did-rank/useDidRankSecondaryBoard";
import { TT_MARKETING_DID_RANK_PAGINATION_BTN, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";
import type { DidRankTop10CardVariant } from "@/lib/refTopTenCardTier";

const PAGE_SIZE = 20;

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

function metricLine(item: DidRankSecondaryRow, t: TFunc): string {
  const f =
    typeof item.completed_fulfillment_orders === "number"
      ? String(item.completed_fulfillment_orders)
      : t("ui_em_dash");
  const l =
    typeof item.published_listings === "number" ? String(item.published_listings) : t("ui_em_dash");
  return `${t("didRank_secondaryFulfillmentOrders")} ${f} · ${t("didRank_secondaryPublishedListings")} ${l}`;
}

function SecondaryTopCard({
  item,
  board,
  column,
  avatarFailed,
  onAvatarError,
  t,
  className = "",
  variant = "podium",
  isHighlight = false,
}: {
  item: DidRankSecondaryRow;
  board: "provider" | "acquisition";
  column: DidRankListColumn;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  t: TFunc;
  className?: string;
  variant?: DidRankTop10CardVariant;
  isHighlight?: boolean;
}) {
  const isPodium = variant === "podium";
  const tier = refTopTenCardTier(item.rank, column);
  const theme = didRankColumnTheme(column);
  const shell = isPodium
    ? TT_MARKETING_DID_RANK_SURFACE.rankTop10Card
    : TT_MARKETING_DID_RANK_SURFACE.rankTop10RowCard;
  const highlightRing = isHighlight
    ? `${TT_MARKETING_DID_RANK_SURFACE.rankTop10Highlight} ${TT_MARKETING_DID_RANK_SURFACE.rankTop10HighlightOnce}`
    : "";
  const showAvatar = item.avatar_url && !avatarFailed;
  const initial = item.nickname.charAt(0) || "?";

  const nickname = isDidRankCommunityProfileId(item.id) ? (
    <Link
      href={`/community/user/${item.id}`}
      onClick={() =>
        trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: board })
      }
      className={`${touchTargetLink44Classes} min-w-0 text-meta font-medium text-slate-200 truncate hover:text-ref-coral motion-sub rounded-sm ${deepShellInlineLinkFocusClasses} ${isPodium ? "" : "!justify-start"}`}
    >
      {item.nickname}
    </Link>
  ) : (
    <p className="text-meta font-medium text-slate-200 truncate">{item.nickname}</p>
  );

  const rankRow = (
    <div className={`flex items-center gap-1 ${isPodium ? "justify-center mb-1" : "shrink-0"}`}>
      <span className={`font-bold font-mono ${tier.rankText}`}>{item.rank}</span>
      <DidRankRankDeltaBadge delta={item.rank_delta} column={column} />
    </div>
  );

  const avatar = isPodium ? (
    <span className={`${DID_RANK_AVATAR_PODIUM_BOX} ${tier.avatarRing}`}>
      {showAvatar ? (
        <Image
          src={item.avatar_url!}
          alt={item.nickname}
          width={DID_RANK_AVATAR_PODIUM_PX}
          height={DID_RANK_AVATAR_PODIUM_PX}
          loading="lazy"
          onError={() => onAvatarError(item.id)}
          className={DID_RANK_AVATAR_PODIUM_MEDIA}
          unoptimized
        />
      ) : (
        <div className={`${DID_RANK_AVATAR_PODIUM_PLACEHOLDER} ${tier.avatarPlaceholder}`}>{initial}</div>
      )}
    </span>
  ) : showAvatar ? (
    <Image
      src={item.avatar_url!}
      alt={item.nickname}
      width={40}
      height={40}
      loading="lazy"
      onError={() => onAvatarError(item.id)}
      className={`${DID_RANK_AVATAR_TOP10_ROW_MEDIA} ${tier.avatarRing}`}
      unoptimized
    />
  ) : (
    <div className={`${DID_RANK_AVATAR_TOP10_ROW_PLACEHOLDER} ${tier.avatarPlaceholder} ${tier.avatarRing}`}>
      {initial}
    </div>
  );

  const score = <p className={`${theme.metric} text-meta tabular-nums`}>{metricLine(item, t)}</p>;

  if (!isPodium) {
    return (
      <div
        id={`${board}-top10-${item.id}`}
        className={`${shell} ${tier.shell} ${tier.hover} ${highlightRing} ${className}`}
      >
        <div className="flex items-center gap-2 sm:flex-col sm:text-center">
          {rankRow}
          {avatar}
          <div className="min-w-0 flex-1">{nickname}</div>
          {score}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`${board}-top10-${item.id}`}
      className={`${shell} text-center ${tier.shell} ${tier.hover} ${highlightRing} ${DID_RANK_PODIUM_CARD_MIN_H} ${className}`}
    >
      {rankRow}
      {item.rank === 1 ? <DidRankPodiumCrown className="mx-auto mb-0.5" /> : null}
      {avatar}
      {nickname}
      {score}
    </div>
  );
}

export function DidRankSecondaryRankListBody({
  board,
  column,
  period,
  items,
  isRefreshing,
  highlightUserId,
  rankTopGridId,
  titleKey,
  t,
  scrollToMyRankRef,
}: {
  board: "provider" | "acquisition";
  column: DidRankListColumn;
  period: Period;
  items: DidRankSecondaryRow[];
  isRefreshing?: boolean;
  highlightUserId: string | null;
  rankTopGridId: string;
  titleKey: string;
  t: TFunc;
  scrollToMyRankRef: React.MutableRefObject<(() => void) | null>;
}) {
  const [page, setPage] = useState(1);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<string>>(new Set());
  const refreshFlashKey = useDidRankRefreshFlash(isRefreshing ?? false);
  const top10 = useMemo(() => items.slice(0, 10), [items]);
  const listFrom11 = useMemo(() => items.slice(10), [items]);
  const totalPages = useMemo(() => getTotalPages(listFrom11.length, PAGE_SIZE), [listFrom11.length]);
  const paginated = useMemo(() => getPaginatedSlice(listFrom11, page, PAGE_SIZE), [listFrom11, page]);
  const restFold = useDidRankFullListFold(listFrom11, highlightUserId, period);
  const endRank = items.length > 0 ? items[items.length - 1]!.rank : 10;
  const theme = didRankColumnTheme(column);

  useEffect(() => {
    setPage(1);
  }, [period, board]);

  React.useEffect(() => {
    scrollToMyRankRef.current = () => {
      if (!highlightUserId) return;
      trackDidRankEvent("did_rank_go_to_my_rank", { type: board });
      const idx = items.findIndex((x) => x.id === highlightUserId);
      if (idx < 0) return;
      if (idx >= 10) {
        restFold.expand();
        setPage(Math.floor((idx - 10) / PAGE_SIZE) + 1);
      } else {
        setPage(1);
      }
      const id = idx < 10 ? `${board}-top10-${highlightUserId}` : `${board}-row-${highlightUserId}`;
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };
  }, [board, highlightUserId, items, restFold, scrollToMyRankRef]);

  if (items.length === 0) return null;

  return (
    <DidRankPeriodFade period={period} isRefreshing={isRefreshing}>
      <DidRankTop10Grid
        items={top10}
        gridId={rankTopGridId}
        layoutGroupId={`did-rank-${board}-top10`}
        staggerKey={period}
        refreshFlashKey={refreshFlashKey}
        stageTintClass={theme.top10StageTint}
        podiumLabel={t("didRank_podiumBandLabel")}
        rowBandLabel={t("didRank_ranks4to10BandLabel")}
        renderCard={(item, cardVariant) => (
          <SecondaryTopCard
            item={item}
            board={board}
            column={column}
            avatarFailed={failedAvatarIds.has(item.id)}
            onAvatarError={(id) => setFailedAvatarIds((p) => new Set(p).add(id))}
            t={t}
            variant={cardVariant}
            isHighlight={item.id === highlightUserId}
          />
        )}
      />
      {items.length > 10 || listFrom11.length > 0 ? (
        <DidRankFullListFold
          restCount={listFrom11.length}
          endRank={endRank}
          expanded={restFold.expanded}
          onToggle={() => {
            const next = !restFold.expanded;
            restFold.setExpanded(next);
            trackDidRankEvent("did_rank_full_list_fold", { list: board, period, expanded: next });
          }}
          t={t}
          listPanelRingClass={theme.listPanelRing}
          ariaLabel={t("didRank_fullList11_100")}
          header={
            <>
              <span className="text-right tabular-nums">#</span>
              <span className="truncate">{t("me_nickname")}</span>
              <span className="text-right truncate col-span-2">{t("didRank_secondaryMetricsHeader")}</span>
            </>
          }
          footer={
            totalPages > 1 ? (
              <nav
                aria-label={`${t(titleKey)} ${t("didRank_fullList11_100")}`}
                className={TT_MARKETING_DID_RANK_SURFACE.listNavFooter}
              >
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                >
                  <button type="submit" disabled={page <= 1} className={TT_MARKETING_DID_RANK_PAGINATION_BTN}>
                    {t("didRank_prevPage")}
                  </button>
                </form>
                <span aria-current="page">
                  {page} / {totalPages}
                </span>
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                >
                  <button
                    type="submit"
                    disabled={page >= totalPages}
                    className={TT_MARKETING_DID_RANK_PAGINATION_BTN}
                  >
                    {t("didRank_nextPage")}
                  </button>
                </form>
              </nav>
            ) : undefined
          }
        >
          {paginated.map((row, rowIndex) => (
            <DidRankFullListRowEnter
              key={row.id}
              rowIndex={rowIndex}
              enterKey={restFold.expanded ? `${restFold.enterGeneration}-${page}` : ""}
            >
              <DidRankSecondaryRankBlockRow
                item={row}
                board={board}
                column={column}
                listSize={listFrom11.length}
                rowIndex={rowIndex}
                isHighlight={row.id === highlightUserId}
                t={t}
              />
            </DidRankFullListRowEnter>
          ))}
        </DidRankFullListFold>
      ) : null}
    </DidRankPeriodFade>
  );
}

export function useSecondaryRankTopGridId(): string {
  return useId();
}
