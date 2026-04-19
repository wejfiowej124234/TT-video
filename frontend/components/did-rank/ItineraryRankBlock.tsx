"use client";

import React, { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackDidRankEvent } from "@/lib/analytics";
import type { ItineraryRankItem } from "@/lib/didRankMockData";
import { isDidRankCommunityProfileId, type Period } from "@/lib/didRankUtils";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type TFunc = (key: string) => string;

/** 创作者行：有合法社区 UUID 时昵称链与 GuideTopCard 同口径（无整卡 `role=button` 嵌套）。 */
function ItineraryCreatorLine({
  item,
  creatorLabel,
  t,
  mutedClass,
  linkClass,
}: {
  item: ItineraryRankItem;
  creatorLabel: string;
  t: TFunc;
  mutedClass: string;
  linkClass: string;
}) {
  const cid = item.creatorCommunityUserId;
  const showProfile = typeof cid === "string" && isDidRankCommunityProfileId(cid);
  return (
    <p className={`text-meta mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 ${mutedClass}`}>
      <span className="shrink-0">
        {t("didRank_creator")}: {creatorLabel} ·
      </span>
      {showProfile ? (
        <Link
          href={`/community/user/${cid}`}
          onClick={() =>
            trackDidRankEvent("did_rank_community_profile_open", {
              userId: cid,
              role: item.creatorType,
            })
          }
          className={`${touchTargetLink44Classes} !justify-start min-w-0 max-w-full shrink truncate font-medium hover:text-fuchsia-300 motion-sub rounded-sm ${linkClass} ${deepShellInlineLinkFocusClasses}`}
        >
          {item.creatorName}
        </Link>
      ) : (
        <span className="min-w-0 truncate">{item.creatorName}</span>
      )}
    </p>
  );
}

/** Top3 行程卡：1 青绿 · 2 珊瑚 · 3 日出金（与旅行者/向导领奖台一致） */
const ITIN_TOP3_STYLE: Record<
  1 | 2 | 3,
  { card: string; rank: string; stats: string; btn: string; myBadge: string }
> = {
  1: {
    card:
      "rounded-[var(--radius-md)] border-2 border-ref-cyan/58 bg-slate-900/42 backdrop-blur-md p-2 sm:p-3 min-w-0 motion-sub transition-transform hover:-translate-y-1 shadow-[0_0_28px_-6px_rgba(35,206,217,0.38)] hover:border-ref-cyan hover:shadow-[0_0_36px_-4px_rgba(35,206,217,0.48)]",
    rank: "text-h4 font-bold font-mono text-ref-cyan drop-shadow-[0_0_8px_rgba(35,206,217,0.45)]",
    stats: "text-meta text-ref-cyan/90",
    btn: "mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border-2 border-ref-cyan/48 bg-ref-cyan/12 px-2 py-1.5 text-meta font-medium text-ref-cyan hover:bg-ref-cyan/22 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    myBadge: "rounded border border-ref-cyan/50 bg-ref-cyan/15 px-1.5 py-0.5 text-meta font-medium text-ref-cyan",
  },
  2: {
    card:
      "rounded-[var(--radius-md)] border-2 border-ref-coral/52 bg-slate-900/42 backdrop-blur-md p-2 sm:p-3 min-w-0 motion-sub transition-transform hover:-translate-y-1 shadow-[0_0_26px_-6px_rgba(252,164,124,0.32)] hover:border-ref-coral hover:shadow-[0_0_32px_-4px_rgba(252,164,124,0.42)]",
    rank: "text-h4 font-bold font-mono text-ref-coral drop-shadow-[0_0_8px_rgba(252,164,124,0.4)]",
    stats: "text-meta text-ref-coral/90",
    btn: "mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border-2 border-ref-coral/45 bg-ref-coral/12 px-2 py-1.5 text-meta font-medium text-ref-coral hover:bg-ref-coral/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-coral/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    myBadge: "rounded border border-ref-coral/45 bg-ref-coral/12 px-1.5 py-0.5 text-meta font-medium text-ref-coral",
  },
  3: {
    card:
      "rounded-[var(--radius-md)] border-2 border-ref-sun/50 bg-slate-900/42 backdrop-blur-md p-2 sm:p-3 min-w-0 motion-sub transition-transform hover:-translate-y-1 shadow-[0_0_24px_-6px_rgba(249,215,121,0.28)] hover:border-ref-sun hover:shadow-[0_0_30px_-4px_rgba(249,215,121,0.38)]",
    rank: "text-h4 font-bold font-mono text-ref-sun drop-shadow-[0_0_8px_rgba(249,215,121,0.35)]",
    stats: "text-meta text-ref-sun",
    btn: "mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border-2 border-ref-sun/45 bg-ref-sun/10 px-2 py-1.5 text-meta font-medium text-ref-sun hover:bg-ref-sun/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    myBadge: "rounded border border-ref-sun/45 bg-ref-sun/12 px-1.5 py-0.5 text-meta font-medium text-ref-sun",
  },
};

const ItineraryTopCard = React.memo(function ItineraryTopCard({
  item,
  t,
}: {
  item: ItineraryRankItem;
  t: TFunc;
}) {
  const isTop3 = item.rank <= 3;
  const creatorLabel = item.creatorType === "guide" ? t("didRank_creatorGuide") : t("didRank_creatorTraveler");

  if (isTop3) {
    const st = ITIN_TOP3_STYLE[item.rank as 1 | 2 | 3] ?? ITIN_TOP3_STYLE[1];
    return (
      <div className={st.card}>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className={st.rank}>{item.rank}</span>
          {item.is_me && (
            <span className={st.myBadge}>{t("didRank_myRank")}</span>
          )}
        </div>
        <div className="relative h-16 sm:h-20 rounded-[var(--radius-md)] bg-slate-700/50 flex items-center justify-center mb-2 text-meta text-slate-400 overflow-hidden">
          {item.coverImage ? (
            <Image src={item.coverImage} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 200px" unoptimized />
          ) : (
            <span className="truncate px-1">{item.destination || item.title}</span>
          )}
        </div>
        <p className="text-meta font-medium text-slate-200 truncate" title={item.title}>{item.title}</p>
        <ItineraryCreatorLine
          item={item}
          creatorLabel={creatorLabel}
          t={t}
          mutedClass="text-slate-300"
          linkClass="text-slate-200"
        />
        <div className={`flex flex-wrap gap-x-2 gap-y-0.5 mt-1 ${st.stats}`}>
          <span>{item.useCount} {t("didRank_itineraryUseCount")}</span>
          <span>{item.rating.toFixed(1)} {t("didRank_itineraryRating")}</span>
          <span>{item.reviewCount} {t("didRank_itineraryReviews")}</span>
        </div>
        <Link
          href="/market"
          className={st.btn}
        >
          {t("didRank_viewItinerary")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-slate-900/45 backdrop-blur-md p-2 sm:p-3 min-w-0 motion-sub ring-1 ring-ref-teal/10 hover:border-ref-cyan/25 hover:bg-slate-900/55">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-small font-semibold font-mono text-slate-300">{item.rank}</span>
        {item.is_me && (
          <span className="rounded border border-slate-500 bg-slate-700/80 px-1.5 py-0.5 text-meta font-medium text-amber-200/95">{t("didRank_myRank")}</span>
        )}
      </div>
      <div className="relative h-16 sm:h-20 rounded-[var(--radius-md)] bg-slate-700/50 flex items-center justify-center mb-2 text-meta text-slate-400 overflow-hidden">
        {item.coverImage ? (
          <Image src={item.coverImage} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 200px" unoptimized />
        ) : (
          <span className="truncate px-1">{item.destination || item.title}</span>
        )}
      </div>
      <p className="text-meta font-medium text-slate-300 truncate" title={item.title}>{item.title}</p>
      <ItineraryCreatorLine
        item={item}
        creatorLabel={creatorLabel}
        t={t}
        mutedClass="text-slate-400"
        linkClass="text-slate-300"
      />
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-meta text-slate-300">
        <span>{item.useCount} {t("didRank_itineraryUseCount")}</span>
        <span>{item.rating.toFixed(1)} {t("didRank_itineraryRating")}</span>
        <span>{item.reviewCount} {t("didRank_itineraryReviews")}</span>
      </div>
      <Link
        href="/market"
        className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-slate-500 bg-slate-700/50 px-2 py-1.5 text-meta font-medium text-slate-300 hover:bg-slate-600/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        {t("didRank_viewItinerary")}
      </Link>
    </div>
  );
});

export interface ItineraryRankBlockProps {
  listItineraries: ItineraryRankItem[];
  period: Period;
  t: TFunc;
}

/** 行程排行榜区块：最佳行程由旅行者/向导创建，按使用次数、评价等排名，前 10 奖励创作者治理币；无接口时仅展示空状态 */
export default function ItineraryRankBlock({ listItineraries, period, t }: ItineraryRankBlockProps) {
  const top10 = listItineraries.slice(0, 10);
  const titleId = useId();
  return (
    <section
      className="rounded-[var(--radius-lg)] border border-amber-500/35 bg-slate-900/58 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mt-8 shadow-[0_0_32px_-8px_rgba(251,191,36,0.12),0_0_28px_-6px_rgba(252,164,124,0.08)] ring-1 ring-ref-sun/15"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body font-bold bg-gradient-to-r from-ref-sun via-amber-400 to-fuchsia-400 bg-clip-text text-transparent">
        {t("didRank_itineraryRank")}
      </h2>
      <p className="text-meta text-slate-300 mt-0.5">{t("didRank_itineraryRankDesc")}</p>
      <p className="text-meta text-amber-400/80 mt-1">{t("didRank_itineraryCreatorReward")}</p>
      {top10.length === 0 ? (
        <div
          className="rounded-[var(--radius-md)] border border-white/10 bg-slate-900/35 backdrop-blur-md py-12 px-4 text-center text-slate-300 ring-1 ring-ref-sun/15 mt-4"
          role="status"
        >
          <p className="text-small">{t("didRank_emptyItinerary")}</p>
          <Link
            href="/market"
            onClick={() =>
              trackDidRankEvent("did_rank_empty_market_cta", { list: "itinerary", period })
            }
            className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-amber-300 hover:text-amber-100 motion-sub ${deepShellInlineLinkFocusClasses}`}
          >
            {t("didRank_emptyMarketCta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mt-4" role="list">
          {top10.map((item) => (
            <div key={item.id} role="listitem" aria-posinset={item.rank} aria-setsize={top10.length}>
              <ItineraryTopCard item={item} t={t} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
