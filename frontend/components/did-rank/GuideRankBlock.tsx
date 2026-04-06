"use client";

import React, { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { GuideRankItem } from "@/lib/didRankMockData";
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

const GuideTopCard = React.memo(function GuideTopCard({
  item,
  onOpenGuide,
  avatarFailed,
  onAvatarError,
  onAvatarErrorId,
  t,
  className = "",
}: {
  item: GuideRankItem;
  onOpenGuide: (item: GuideRankItem) => void;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  onAvatarErrorId: string;
  t: TFunc;
  className?: string;
}) {
  const isTop3 = item.rank <= 3;
  const tier = refTopThreeTier(item.rank, "traveler");
  const showAvatar = item.avatar_url && !avatarFailed;
  const initial = (item.nickname && item.nickname.charAt(0)) || "?";
  const isCommunityProfile = isDidRankCommunityProfileId(item.id);
  const avg = item.avgReceivedReviewScore;
  const hasFiniteAvg = typeof avg === "number" && Number.isFinite(avg);
  const composite = hasFiniteAvg ? `${avg.toFixed(1)}/5` : t("ui_em_dash");
  return (
    <div
      role={isCommunityProfile ? undefined : "button"}
      tabIndex={isCommunityProfile ? undefined : 0}
      aria-label={isCommunityProfile ? undefined : `${item.nickname} — ${t("didRank_viewGuide")}`}
      onClick={() => onOpenGuide(item)}
      onKeyDown={
        isCommunityProfile
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenGuide(item);
              }
            }
      }
      className={`rounded-[var(--radius-md)] p-2 sm:p-3 text-center min-w-0 motion-sub transition-[transform,box-shadow,border-color] w-full cursor-pointer ${tier.shell} ${tier.hover} ${isTop3 ? "hover:-translate-y-1" : ""} ${className}`}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className={`text-h4 font-bold font-mono ${tier.rankText}`}>{item.rank}</span>
      </div>
      {showAvatar ? (
        <Image src={item.avatar_url!} alt={item.nickname} width={44} height={44} loading="lazy" onError={() => onAvatarError(onAvatarErrorId)} className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full mx-auto object-cover mb-1 ${tier.avatarRing}`} unoptimized />
      ) : (
        <div role="img" aria-label={item.nickname} className={`w-11 h-11 sm:w-12 sm:h-12 min-w-[2.75rem] min-h-[2.75rem] sm:min-w-[3rem] sm:min-h-[3rem] rounded-full flex items-center justify-center text-body font-semibold mx-auto mb-1 ${tier.avatarPlaceholder} ${tier.avatarRing}`}>{initial}</div>
      )}
      {isCommunityProfile ? (
        <Link
          href={`/community/user/${item.id}`}
          onClick={(e) => {
            e.stopPropagation();
            trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
          }}
          className={`${touchTargetLink44Classes} !justify-start min-w-0 w-full text-meta font-medium text-slate-200 truncate hover:text-cyan-200 motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
        >
          {item.nickname}
        </Link>
      ) : (
        <p className="text-meta font-medium text-slate-200 truncate">{item.nickname}</p>
      )}
      <p className="text-body font-bold font-mono text-cyan-300 mt-0.5 drop-shadow-scifi-cyan">
        {t("didRank_guideCompositeLabel")} {composite}
      </p>
      <p className="text-meta text-slate-400">
        {item.receptionCount} {t("didRank_receptions")}
        {item.city ? ` · ${item.city}` : ""}
      </p>
      {isCommunityProfile ? (
        <form
          className="mt-0.5 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenGuide(item);
          }}
        >
          <button
            type="submit"
            className={`w-full ${touchTargetLink44Classes} text-meta font-medium text-cyan-300 hover:text-cyan-100 motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
          >
            {t("didRank_viewGuide")}
          </button>
        </form>
      ) : (
        <p className="text-meta text-cyan-300 mt-0.5">{t("didRank_viewGuide")}</p>
      )}
    </div>
  );
});

const GuideRow = React.memo(function GuideRow({ item, listSize, isHighlight, onOpenGuide, avatarFailed, onAvatarError, onAvatarErrorId, t }: { item: GuideRankItem; listSize: number; isHighlight: boolean; onOpenGuide: (item: GuideRankItem) => void; avatarFailed: boolean; onAvatarError: (id: string) => void; onAvatarErrorId: string; t: TFunc }) {
  const showAvatar = item.avatar_url && !avatarFailed;
  const avg = item.avgReceivedReviewScore;
  const hasFiniteAvg = typeof avg === "number" && Number.isFinite(avg);
  const scoreShort = hasFiniteAvg ? avg.toFixed(1) : t("ui_em_dash");
  return (
    <div
      id={`guide-row-${item.id}`}
      role="listitem"
      aria-posinset={item.rank}
      aria-setsize={listSize}
      tabIndex={0}
      aria-label={`${item.nickname} — ${t("didRank_viewGuide")}`}
      onClick={() => onOpenGuide(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenGuide(item);
        }
      }}
      className={`w-full flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 border-b border-white/[0.06] last:border-b-0 motion-sub backdrop-blur-[2px] text-left cursor-pointer hover:bg-white/[0.04] hover:shadow-[inset_0_0_24px_-8px_rgba(35,206,217,0.08)] ${isHighlight ? "ring-1 ring-cyan-400/50 bg-cyan-500/10" : ""}`}
    >
      <span className="w-5 sm:w-6 text-right text-meta font-mono font-medium text-slate-300 shrink-0">{item.rank}</span>
      {showAvatar ? (
        <Image
          src={item.avatar_url!}
          alt={item.nickname}
          width={44}
          height={44}
          loading="lazy"
          onError={() => onAvatarError(onAvatarErrorId)}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full object-cover shrink-0 ring-1 ring-cyan-400/25"
          sizes="44px"
          unoptimized
        />
      ) : (
        <div
          role="img"
          aria-label={item.nickname}
          className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-meta font-semibold text-cyan-300"
        >
          {(item.nickname && item.nickname.charAt(0)) || "?"}
        </div>
      )}
      <div className="min-w-0 flex-1 flex flex-col gap-0.5 justify-center">
        {isDidRankCommunityProfileId(item.id) ? (
          <Link
            href={`/community/user/${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
            }}
            className={`${touchTargetLink44Classes} !justify-start text-small font-medium text-slate-200 truncate min-w-0 hover:text-cyan-200 text-left motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
          >
            {item.nickname}
          </Link>
        ) : (
          <span className="text-small font-medium text-slate-200 truncate min-w-0">{item.nickname}</span>
        )}
        <span className="text-meta text-slate-500 truncate">
          {item.receptionCount}{" "}
          {t("didRank_receptions")}
          {item.city ? ` · ${item.city}` : ""}
        </span>
      </div>
      <span className="text-small font-bold font-mono text-cyan-300 shrink-0 tabular-nums" title={t("didRank_guideCompositeLabel")}>
        {hasFiniteAvg ? `${scoreShort}/5` : scoreShort}
      </span>
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
  scrollToGuideRank: () => void;
  onOpenGuide: (item: GuideRankItem) => void;
  failedAvatarIds: Set<string>;
  addFailedAvatar: (id: string) => void;
  t: TFunc;
  /** 前 10 网格锚点，供「跳到我的排名」滚动；由页面 `useId()` 传入 */
  rankTopGridId: string;
  period: Period;
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
  scrollToGuideRank,
  onOpenGuide,
  failedAvatarIds,
  addFailedAvatar,
  t,
  rankTopGridId,
  period,
}: GuideRankBlockProps) {
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
            <h2 id={titleId} className={didRankMainPanelTitleClass}>{t("didRank_guideRank")}</h2>
            <p className={didRankMainPanelDescClass}>{t("didRank_guideRankDesc")}</p>
          </div>
          {highlightGuideId && (
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                scrollToGuideRank();
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
        {listGuides.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-slate-900/35 backdrop-blur-md py-12 px-4 text-center text-slate-300 ring-1 ring-white/5" role="status">
            <p className="text-small">{t("didRank_emptyGuide")}</p>
            <Link
              href="/market"
              onClick={() =>
                trackDidRankEvent("did_rank_empty_market_cta", { list: "guide", period })
              }
              className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-cyan-300 hover:text-cyan-100 motion-sub ${deepShellInlineLinkFocusClasses}`}
            >
              {t("didRank_emptyMarketCta")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-meta text-slate-300 mb-2 sm:mb-3 font-medium">🏆 {t("didRank_top10")}</p>
            <div id={rankTopGridId} className="mb-4 sm:mb-6">
              {topGuides.length < 3 ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  {topGuides.map((guide) => (
                    <GuideTopCard key={guide.id} item={guide} onOpenGuide={onOpenGuide} avatarFailed={failedAvatarIds.has(guide.id)} onAvatarError={addFailedAvatar} onAvatarErrorId={guide.id} t={t} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="hidden sm:block">
                    <div className="relative px-1 pt-2 pb-8">
                      <div
                        className="pointer-events-none absolute bottom-5 left-[6%] right-[6%] h-5 rounded-[100%] bg-gradient-to-r from-ref-cyan/32 via-ref-coral/28 to-ref-sun/28 blur-lg opacity-90"
                        aria-hidden
                      />
                      <div className="relative flex items-end justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
                        <GuideTopCard
                          className="w-full max-w-[11rem] flex-1"
                          item={topGuides[1]}
                          onOpenGuide={onOpenGuide}
                          avatarFailed={failedAvatarIds.has(topGuides[1].id)}
                          onAvatarError={addFailedAvatar}
                          onAvatarErrorId={topGuides[1].id}
                          t={t}
                        />
                        <GuideTopCard
                          className="w-full max-w-[13rem] flex-[1.12] z-10 sm:scale-[1.07] sm:-translate-y-2 shadow-[0_0_40px_-6px_rgba(35,206,217,0.48)]"
                          item={topGuides[0]}
                          onOpenGuide={onOpenGuide}
                          avatarFailed={failedAvatarIds.has(topGuides[0].id)}
                          onAvatarError={addFailedAvatar}
                          onAvatarErrorId={topGuides[0].id}
                          t={t}
                        />
                        <GuideTopCard
                          className="w-full max-w-[11rem] flex-1"
                          item={topGuides[2]}
                          onOpenGuide={onOpenGuide}
                          avatarFailed={failedAvatarIds.has(topGuides[2].id)}
                          onAvatarError={addFailedAvatar}
                          onAvatarErrorId={topGuides[2].id}
                          t={t}
                        />
                      </div>
                    </div>
                    {topGuides.length > 3 && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                        {topGuides.slice(3).map((guide) => (
                          <GuideTopCard key={guide.id} item={guide} onOpenGuide={onOpenGuide} avatarFailed={failedAvatarIds.has(guide.id)} onAvatarError={addFailedAvatar} onAvatarErrorId={guide.id} t={t} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:hidden">
                    {topGuides.map((guide) => (
                      <GuideTopCard key={guide.id} item={guide} onOpenGuide={onOpenGuide} avatarFailed={failedAvatarIds.has(guide.id)} onAvatarError={addFailedAvatar} onAvatarErrorId={guide.id} t={t} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-meta text-slate-300 mb-2 font-medium">📋 {t("didRank_fullList11_100")}</p>
            {listGuidesFrom11.length === 0 ? (
              <p className="text-meta text-slate-400 py-4 text-center">{t("didRank_noRank11_100")}</p>
            ) : (
              <div className="flex flex-col rounded-[var(--radius-md)] border border-white/10 bg-slate-900/30 backdrop-blur-md ring-1 ring-white/5">
                <div className="overflow-y-auto max-h-[400px] sm:max-h-[480px]" role="region" aria-label={t("didRank_fullList11_100")}>
                  <div role="list">
                    {paginatedGuides.map((g) => (
                      <GuideRow key={g.id} item={g} listSize={listGuidesFrom11.length} isHighlight={g.id === highlightGuideId} onOpenGuide={onOpenGuide} avatarFailed={failedAvatarIds.has(g.id)} onAvatarError={addFailedAvatar} onAvatarErrorId={g.id} t={t} />
                    ))}
                  </div>
                </div>
                {totalPagesGuide > 1 && (
                  <nav aria-label={t("didRank_guideRank") + " " + t("didRank_fullList11_100")} className="shrink-0 flex items-center justify-between gap-2 px-2 py-2 border-t border-white/10 text-meta text-slate-300 bg-slate-950/50 backdrop-blur-sm">
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setPageGuide((p) => Math.max(1, p - 1));
                      }}
                    >
                      <button type="submit" disabled={pageGuide <= 1} className="rounded border border-cyan-500/30 px-2 py-1 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/10">
                        {t("didRank_prevPage")}
                      </button>
                    </form>
                    <span aria-current="page">{pageGuide} / {totalPagesGuide}</span>
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setPageGuide((p) => Math.min(totalPagesGuide, p + 1));
                      }}
                    >
                      <button type="submit" disabled={pageGuide >= totalPagesGuide} className="rounded border border-cyan-500/30 px-2 py-1 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/10">
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
