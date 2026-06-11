"use client";

import { useEffect, useState } from "react";
import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";
import { DID_RANK_MAIN_BOARD_API_MAX } from "@/lib/didRankConstants";

type TFunc = (key: string) => string;

/** §8.4 SEO：游客/向导榜各前 10 ItemList（客户端注入 JSON-LD） */
export default function DidRankTop10JsonLd({
  isLoading,
  listTravelers,
  listGuides,
  t,
}: {
  isLoading: boolean;
  listTravelers: TravelerRankItem[];
  listGuides: GuideRankItem[];
  t: TFunc;
}) {
  const [deferSeo, setDeferSeo] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setDeferSeo(false);
      return;
    }
    const run = () => setDeferSeo(true);
    if (typeof window === "undefined") return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(run, 120);
    return () => globalThis.clearTimeout(timer);
  }, [isLoading]);

  if (!deferSeo) return null;

  return (
    <>
      {!isLoading && listTravelers.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `${t("didRank_travelerRank")} ${t("didRank_top10")}`,
              numberOfItems: Math.min(DID_RANK_MAIN_BOARD_API_MAX, listTravelers.length),
              itemListElement: listTravelers.slice(0, DID_RANK_MAIN_BOARD_API_MAX).map((item) => ({
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
              numberOfItems: Math.min(DID_RANK_MAIN_BOARD_API_MAX, listGuides.length),
              itemListElement: listGuides.slice(0, DID_RANK_MAIN_BOARD_API_MAX).map((item) => ({
                "@type": "ListItem",
                position: item.rank,
                name: item.nickname,
              })),
            }),
          }}
        />
      )}
    </>
  );
}
