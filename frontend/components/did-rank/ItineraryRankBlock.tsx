"use client";

import React, { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackDidRankEvent } from "@/lib/analytics";
import type { ItineraryRankItem } from "@/lib/didRankTypes";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { didRankColumnTheme } from "@/lib/didRankColumnTheme";
import { isDidRankCommunityProfileId, type Period } from "@/lib/didRankUtils";
import { ITIN_TOP3_STYLE } from "@/components/did-rank/itineraryRankBlockTop3Styles";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_MARKET_PRIMARY,
  TT_MARKETING_DID_RANK_SECTION_TITLE,
  TT_MARKETING_DID_RANK_SURFACE,
} from "@/lib/marketingUi";

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
          className={`${touchTargetLink44Classes} !justify-start min-w-0 max-w-full shrink truncate font-medium hover:text-ref-coral motion-sub rounded-sm ${linkClass} ${deepShellInlineLinkFocusClasses}`}
        >
          {item.creatorName}
        </Link>
      ) : (
        <span className="min-w-0 truncate">{item.creatorName}</span>
      )}
    </p>
  );
}


const ItineraryTopCard = React.memo(function ItineraryTopCard({
  item,
  t,
  isHighlight = false,
}: {
  item: ItineraryRankItem;
  t: TFunc;
  isHighlight?: boolean;
}) {
  const isTop3 = item.rank <= 3;
  const creatorLabel = item.creatorType === "guide" ? t("didRank_creatorGuide") : t("didRank_creatorTraveler");
  const highlightRing = isHighlight
    ? `ring-2 ${didRankColumnTheme("itinerary").listRowHighlightRing}`
    : "";

  if (isTop3) {
    const st = ITIN_TOP3_STYLE[item.rank as 1 | 2 | 3] ?? ITIN_TOP3_STYLE[1];
    return (
      <div className={`${st.card} ${highlightRing}`} data-did-rank-itinerary-id={item.id}>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className={`${st.rank} inline-flex items-center gap-1`}>
            {item.rank}
            <DidRankRankDeltaBadge delta={item.rank_delta} column="itinerary" />
          </span>
          {item.is_me && (
            <span className={st.myBadge}>{t("didRank_myRank")}</span>
          )}
        </div>
        <div className="relative h-16 sm:h-20 rounded-[var(--radius-md)] bg-ink-800/60 flex items-center justify-center mb-2 text-meta text-slate-400 overflow-hidden ring-1 ring-ref-sun/12">
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
    <div
      className={`${TT_MARKETING_DID_RANK_SURFACE.rankCard} ${highlightRing}`}
      data-did-rank-itinerary-id={item.id}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-small font-semibold font-mono text-slate-300 inline-flex items-center gap-1">
          {item.rank}
          <DidRankRankDeltaBadge delta={item.rank_delta} column="itinerary" />
        </span>
        {item.is_me && (
          <span className={TT_MARKETING_DID_RANK_SURFACE.myRankBadge}>{t("didRank_myRank")}</span>
        )}
      </div>
      <div className="relative h-16 sm:h-20 rounded-[var(--radius-md)] bg-ink-800/60 flex items-center justify-center mb-2 text-meta text-slate-400 overflow-hidden ring-1 ring-ref-sun/12">
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
        className={`mt-2 ${TT_MARKETING_DID_RANK_SURFACE.ghostBtn}`}
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
  highlightItineraryId?: string | null;
}

/** 行程排行榜区块：最佳行程由旅行者/向导创建，按使用次数、评价等排名，前 10 奖励创作者治理币；无接口时仅展示空状态 */
export default function ItineraryRankBlock({
  listItineraries,
  period,
  t,
  highlightItineraryId = null,
}: ItineraryRankBlockProps) {
  const top10 = listItineraries.slice(0, 10);
  const titleId = useId();
  return (
    <section
      className={TT_MARKETING_DID_RANK_SURFACE.rankSectionShell}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={`text-body ${TT_MARKETING_DID_RANK_SECTION_TITLE}`}>
        {t("didRank_itineraryRank")}
      </h2>
      <p className="text-meta text-slate-300 mt-0.5">{t("didRank_itineraryRankDesc")}</p>
      <p className="text-meta text-amber-400/80 mt-1">{t("didRank_itineraryCreatorReward")}</p>
      {top10.length === 0 ? (
        <div
          className={`${TT_MARKETING_DID_RANK_SURFACE.emptyPanel} mt-4`}
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
              <ItineraryTopCard
                item={item}
                t={t}
                isHighlight={highlightItineraryId != null && item.id === highlightItineraryId}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
