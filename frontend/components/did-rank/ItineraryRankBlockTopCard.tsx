"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ItineraryRankItem } from "@/lib/didRankTypes";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { ItineraryRankTFunc } from "@/components/did-rank/itineraryRankBlockTypes";
import { ITIN_TOP3_STYLE } from "@/components/did-rank/itineraryRankBlockTop3Styles";
import { ItineraryRankBlockCreatorLine } from "@/components/did-rank/ItineraryRankBlockCreatorLine";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

export const ItineraryRankBlockTopCard = React.memo(function ItineraryRankBlockTopCard({
  item,
  t,
}: {
  item: ItineraryRankItem;
  t: ItineraryRankTFunc;
}) {
  const isTop3 = item.rank <= 3;
  const creatorLabel = item.creatorType === "guide" ? t("didRank_creatorGuide") : t("didRank_creatorTraveler");
  const coverRaw = (item.coverImage ?? "").trim();
  const coverSrc = coverRaw ? communityMediaAbsoluteUrlForRender(coverRaw) : "";

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
        <div className="relative h-16 sm:h-20 rounded-[var(--radius-md)] bg-ink-800/60 flex items-center justify-center mb-2 text-meta text-slate-400 overflow-hidden ring-1 ring-ref-sun/12">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 200px"
              unoptimized={communityMediaNextImageUnoptimized(coverSrc)}
            />
          ) : (
            <span className="truncate px-1">{item.destination || item.title}</span>
          )}
        </div>
        <p className="text-meta font-medium text-slate-200 truncate" title={item.title}>{item.title}</p>
        <ItineraryRankBlockCreatorLine
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
    <div className={TT_MARKETING_DID_RANK_SURFACE.rankTop3Card}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-small font-semibold font-mono text-slate-300">{item.rank}</span>
        {item.is_me && (
          <span className="rounded border border-ref-sun/32 bg-ref-sun/12 px-1.5 py-0.5 text-meta font-medium text-ref-sun/95">{t("didRank_myRank")}</span>
        )}
      </div>
      <div className="relative h-16 sm:h-20 rounded-[var(--radius-md)] bg-ink-800/60 flex items-center justify-center mb-2 text-meta text-slate-400 overflow-hidden ring-1 ring-ref-sun/12">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 200px"
            unoptimized={communityMediaNextImageUnoptimized(coverSrc)}
          />
        ) : (
          <span className="truncate px-1">{item.destination || item.title}</span>
        )}
      </div>
      <p className="text-meta font-medium text-slate-300 truncate" title={item.title}>{item.title}</p>
      <ItineraryRankBlockCreatorLine
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
