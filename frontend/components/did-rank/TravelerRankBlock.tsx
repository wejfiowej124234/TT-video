"use client";

import React, { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem } from "@/lib/didRankMockData";
import { isDidRankCommunityProfileId, type Period } from "@/lib/didRankUtils";
import { refTopThreeTier } from "@/lib/refTopThreeStyles";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  didRankMainPanelClass,
  didRankMainPanelDescClass,
  didRankMainPanelHeaderClass,
  didRankMainPanelTitleClass,
} from "@/components/did-rank/didRankPanelShell";

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
}: {
  item: TravelerRankItem;
  onOpenRecord: (item: TravelerRankItem) => void;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  onAvatarErrorId: string;
  t: TFunc;
  className?: string;
}) {
  const isTop3 = item.rank <= 3;
  const tier = refTopThreeTier(item.rank, "traveler");
  const ordersDisplay = formatTravelerCompletedOrdersDisplay(item, t);
  const hasRecord = (item.countries?.length ?? 0) > 0 || (item.cities?.length ?? 0) > 0;
  const showAvatar = item.avatar_url && !avatarFailed;
  const initial = (item.nickname && item.nickname.charAt(0)) || "?";
  return (
    <div
      className={`rounded-[var(--radius-md)] p-2 sm:p-3 text-center min-w-0 motion-sub transition-[transform,box-shadow,border-color] ${tier.shell} ${tier.hover} ${isTop3 ? "hover:-translate-y-1" : ""} ${className}`}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className={`text-h4 font-bold font-mono ${tier.rankText}`}>{item.rank}</span>
      </div>
      {showAvatar ? (
        <Image src={item.avatar_url!} alt={item.nickname} width={44} height={44} loading="lazy" onError={() => onAvatarError(onAvatarErrorId)} className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full mx-auto object-cover mb-1 ${tier.avatarRing}`} unoptimized />
      ) : (
        <div role="img" aria-label={item.nickname} className={`w-11 h-11 sm:w-12 sm:h-12 min-w-[2.75rem] min-h-[2.75rem] sm:min-w-[3rem] sm:min-h-[3rem] rounded-full flex items-center justify-center text-body font-semibold mx-auto mb-1 ${tier.avatarPlaceholder} ${tier.avatarRing}`}>{initial}</div>
      )}
      {isDidRankCommunityProfileId(item.id) ? (
        <Link
          href={`/community/user/${item.id}`}
          onClick={() =>
            trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "traveler" })
          }
          className={`${touchTargetLink44Classes} min-w-0 w-full text-meta font-medium text-slate-200 truncate hover:text-cyan-100 motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
        >
          {item.nickname}
        </Link>
      ) : (
        <p className="text-meta font-medium text-slate-200 truncate">{item.nickname}</p>
      )}
      <p className="text-body font-bold font-mono text-cyan-300 mt-0.5 drop-shadow-scifi-cyan">
        {t("didRank_travelerCompositeLabel")}{" "}
        <span className="tabular-nums">{ordersDisplay}</span>
        {t("didRank_completedOrdersUnit")}
      </p>
      <p className="text-meta text-slate-400">{item.countriesCount} {t("didRank_countriesShort")} · {item.citiesCount} {t("didRank_citiesShort")}</p>
      {hasRecord && (
        <form
          className="mt-1 inline-block w-full"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenRecord(item);
          }}
        >
          <button
            type="submit"
            className={`${touchTargetLink44Classes} rounded-sm px-1 text-meta text-cyan-300 hover:text-cyan-100 ${deepShellInlineLinkFocusClasses}`}
          >
            {t("didRank_record")} ▶
          </button>
        </form>
      )}
    </div>
  );
});

const TravelerRow = React.memo(function TravelerRow({
  item,
  listSize,
  isHighlight,
  onOpenRecord,
  avatarFailed,
  onAvatarError,
  onAvatarErrorId,
  t,
}: {
  item: TravelerRankItem;
  listSize: number;
  isHighlight: boolean;
  onOpenRecord: (item: TravelerRankItem) => void;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  onAvatarErrorId: string;
  t: TFunc;
}) {
  const hasRecord = (item.countries?.length ?? 0) > 0 || (item.cities?.length ?? 0) > 0;
  const ordersDisplay = formatTravelerCompletedOrdersDisplay(item, t);
  const showAvatar = item.avatar_url && !avatarFailed;
  return (
    <div
      id={`traveler-row-${item.id}`}
      role="listitem"
      aria-posinset={item.rank}
      aria-setsize={listSize}
      className={`flex flex-wrap items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 border-b border-white/[0.06] last:border-b-0 motion-sub backdrop-blur-[2px] hover:bg-white/[0.04] hover:shadow-[inset_0_0_24px_-8px_rgba(35,206,217,0.08)] ${isHighlight ? "ring-1 ring-ref-cyan/50 bg-ref-cyan/10" : ""}`}
    >
      <span className="w-5 sm:w-6 text-right text-meta font-mono font-medium text-slate-300 shrink-0">{item.rank}</span>
      {showAvatar ? (
        <Image src={item.avatar_url!} alt={item.nickname} width={44} height={44} loading="lazy" onError={() => onAvatarError(onAvatarErrorId)} className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-cyan-400/20" />
      ) : (
        <div role="img" aria-label={item.nickname} className="w-11 h-11 min-w-[2.75rem] min-h-[2.75rem] rounded-full bg-cyan-500/20 flex items-center justify-center text-meta font-semibold text-cyan-300 shrink-0">{(item.nickname && item.nickname.charAt(0)) || "?"}</div>
      )}
      {isDidRankCommunityProfileId(item.id) ? (
        <Link
          href={`/community/user/${item.id}`}
          onClick={() =>
            trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "traveler" })
          }
          className={`${touchTargetLink44Classes} !justify-start text-small font-medium text-slate-200 truncate min-w-0 flex-1 hover:text-cyan-100 motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
        >
          {item.nickname}
        </Link>
      ) : (
        <span className="text-small font-medium text-slate-200 truncate min-w-0 flex-1">{item.nickname}</span>
      )}
      <span className="text-small font-bold font-mono text-cyan-300 shrink-0 tabular-nums">
        {t("didRank_compositeScoreShort")} {ordersDisplay}
      </span>
      <span className="text-meta text-slate-400 shrink-0 hidden sm:inline">{item.countriesCount}{t("didRank_countriesShort")} / {item.citiesCount}{t("didRank_citiesShort")}</span>
      {hasRecord && (
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenRecord(item);
          }}
        >
          <button
            type="submit"
            aria-label={t("didRank_record")}
            className={`shrink-0 ${touchTargetLink44Classes} rounded-sm text-meta text-cyan-300 hover:text-cyan-100 ${deepShellInlineLinkFocusClasses}`}
          >
            ▶
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
  scrollToTravelerRank: () => void;
  onOpenRecord: (item: TravelerRankItem) => void;
  failedAvatarIds: Set<string>;
  addFailedAvatar: (id: string) => void;
  t: TFunc;
  rankTopGridId: string;
  period: Period;
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
  scrollToTravelerRank,
  onOpenRecord,
  failedAvatarIds,
  addFailedAvatar,
  t,
  rankTopGridId,
  period,
}: TravelerRankBlockProps) {
  const titleId = useId();
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
          {highlightTravelerId && (
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                scrollToTravelerRank();
              }}
            >
              <button
                type="submit"
                className="rounded-[var(--radius-sm)] border border-cyan-400/45 bg-cyan-500/15 px-2 py-1 text-meta text-cyan-200 hover:text-cyan-50 hover:bg-cyan-500/25 motion-sub"
              >
                {t("didRank_goToMyRank")}
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="p-3 sm:p-4">
        {listTravelers.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-slate-900/35 backdrop-blur-md py-12 px-4 text-center text-slate-300 ring-1 ring-ref-cyan/10" role="status">
            <p className="text-small">{t("didRank_emptyTraveler")}</p>
            <Link
              href="/market"
              onClick={() =>
                trackDidRankEvent("did_rank_empty_market_cta", { list: "traveler", period })
              }
              className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-cyan-300 hover:text-cyan-100 motion-sub ${deepShellInlineLinkFocusClasses}`}
            >
              {t("didRank_emptyMarketCta")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-meta text-slate-300 mb-2 sm:mb-3 font-medium">🏆 {t("didRank_top10")}</p>
            <div id={rankTopGridId} className="mb-4 sm:mb-6 space-y-2.5 sm:space-y-3">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                {topTravelers.slice(0, 5).map((traveler) => (
                  <TravelerTopCard
                    key={traveler.id}
                    className="min-w-0"
                    item={traveler}
                    onOpenRecord={onOpenRecord}
                    avatarFailed={failedAvatarIds.has(traveler.id)}
                    onAvatarError={addFailedAvatar}
                    onAvatarErrorId={traveler.id}
                    t={t}
                  />
                ))}
              </div>
              {topTravelers.length > 5 ? (
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                  {topTravelers.slice(5, 10).map((traveler) => (
                    <TravelerTopCard
                      key={traveler.id}
                      className="min-w-0"
                      item={traveler}
                      onOpenRecord={onOpenRecord}
                      avatarFailed={failedAvatarIds.has(traveler.id)}
                      onAvatarError={addFailedAvatar}
                      onAvatarErrorId={traveler.id}
                      t={t}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-meta text-slate-300 mb-2 font-medium">📋 {t("didRank_fullList11_100")}</p>
            {listTravelersFrom11.length === 0 ? (
              <p className="text-meta text-slate-400 py-4 text-center">{t("didRank_noRank11_100")}</p>
            ) : (
              <div className="flex flex-col rounded-[var(--radius-md)] border border-white/10 bg-slate-900/30 backdrop-blur-md ring-1 ring-white/5">
                <div className="overflow-y-auto max-h-[400px] sm:max-h-[480px]" role="region" aria-label={t("didRank_fullList11_100")}>
                  <div role="list">
                    {paginatedTravelers.map((item) => (
                      <TravelerRow
                        key={item.id}
                        item={item}
                        listSize={listTravelersFrom11.length}
                        isHighlight={item.id === highlightTravelerId}
                        onOpenRecord={onOpenRecord}
                        avatarFailed={failedAvatarIds.has(item.id)}
                        onAvatarError={addFailedAvatar}
                        onAvatarErrorId={item.id}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
                {totalPagesTraveler > 1 && (
                  <nav aria-label={t("didRank_travelerRank") + " " + t("didRank_fullList11_100")} className="shrink-0 flex items-center justify-between gap-2 px-2 py-2 border-t border-white/10 text-meta text-slate-300 bg-slate-950/50 backdrop-blur-sm">
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setPageTraveler((p) => Math.max(1, p - 1));
                      }}
                    >
                      <button type="submit" disabled={pageTraveler <= 1} className="rounded border border-cyan-500/30 px-2 py-1 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/10">
                        {t("didRank_prevPage")}
                      </button>
                    </form>
                    <span aria-current="page">{pageTraveler} / {totalPagesTraveler}</span>
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setPageTraveler((p) => Math.min(totalPagesTraveler, p + 1));
                      }}
                    >
                      <button type="submit" disabled={pageTraveler >= totalPagesTraveler} className="rounded border border-cyan-500/30 px-2 py-1 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/10">
                        {t("didRank_nextPage")}
                      </button>
                    </form>
                  </nav>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
