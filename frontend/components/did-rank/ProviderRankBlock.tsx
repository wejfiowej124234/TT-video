"use client";

import React, { useId, useRef } from "react";
import { trackDidRankEvent } from "@/lib/analytics";
import type { Period } from "@/lib/didRankUtils";
import { DidRankBoardPlaceholderEmpty } from "@/components/did-rank/DidRankBoardPlaceholderEmpty";
import DidRankFetchErrorBanner from "@/components/did-rank/DidRankFetchErrorBanner";
import type { useDidRankSecondaryBoard } from "@/components/did-rank/useDidRankSecondaryBoard";
import { useDidRankSecondaryDeepLink } from "@/components/did-rank/useDidRankSecondaryDeepLink";
import { DidRankCopyRankLink } from "@/components/did-rank/DidRankCopyRankLink";
import { buildDidRankSharePath } from "@/lib/didRankShareLink";
import {
  DidRankSecondaryRankListBody,
  useSecondaryRankTopGridId,
} from "@/components/did-rank/DidRankSecondaryRankListBody";
import {
  didRankMainPanelClass,
  didRankMainPanelDescClass,
  didRankMainPanelHeaderClass,
  didRankMainPanelTitleClass,
} from "@/components/did-rank/didRankPanelShell";

type TFunc = (key: string) => string;
type SecondaryBoardState = ReturnType<typeof useDidRankSecondaryBoard>;

export default function ProviderRankBlock({
  period,
  t,
  meParam = "",
  highlightUserId = null,
  livePollLifted = false,
  boardData,
}: {
  period: Period;
  t: TFunc;
  meParam?: string;
  highlightUserId?: string | null;
  livePollLifted?: boolean;
  boardData: SecondaryBoardState;
}) {
  const titleId = useId();
  const rankTopGridId = useSecondaryRankTopGridId();
  const scrollToMyRankRef = useRef<(() => void) | null>(null);
  const secondary = boardData;
  const rowHighlightId =
    highlightUserId ?? secondary.items.find((x) => x.is_me)?.id ?? null;
  const shareRankPath = rowHighlightId
    ? buildDidRankSharePath("provider", rowHighlightId, period)
    : null;

  useDidRankSecondaryDeepLink({
    board: "provider",
    meParam,
    period,
    items: secondary.items,
    isLoading: secondary.isLoading,
    scrollToMyRankRef,
  });

  return (
    <section className={didRankMainPanelClass} aria-labelledby={titleId}>
      <div className={didRankMainPanelHeaderClass}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 id={titleId} className={didRankMainPanelTitleClass}>
              {t("didRank_providerRank")}
            </h2>
            <p className={didRankMainPanelDescClass}>{t("didRank_providerRankDesc")}</p>
          </div>
          {rowHighlightId ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  scrollToMyRankRef.current?.();
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
                <DidRankCopyRankLink sharePath={shareRankPath} board="provider" t={t} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="p-3 sm:p-4" aria-busy={secondary.isLoading}>
        {secondary.isLoading ? (
          <p className="text-meta text-slate-400 mb-3" role="status">
            {t("didRank_secondaryBoardLoading")}
          </p>
        ) : null}
        {secondary.apiConnected ? (
          <p className="text-meta text-amber-200/85 mb-3" role="status">
            {t("didRank_secondaryBoardApiConnected")}
          </p>
        ) : null}
        {!livePollLifted && secondary.livePollActive ? (
          <p className="text-meta text-slate-500 mb-3" role="status">
            {t("didRank_livePollActive")}
          </p>
        ) : null}
        {secondary.note ? (
          <p className="text-meta text-slate-400 mb-3 max-w-xl">{secondary.note}</p>
        ) : null}
        {secondary.fetchError ? (
          <DidRankFetchErrorBanner
            fetchError="failed"
            onRetry={() => void secondary.refresh()}
            t={t}
            className="mb-3"
          />
        ) : null}
        {secondary.items.length === 0 && !secondary.isLoading && !secondary.fetchError ? (
          <DidRankBoardPlaceholderEmpty
            icon="🏪"
            message={t("didRank_emptyProvider")}
            roadmap={t("didRank_providerRoadmap")}
            accentClass="border-amber-500/22 bg-amber-500/10 text-amber-300"
            ctaHref="/market/provider"
            ctaLabel={t("market_segment_provider_cta_did")}
            onCtaClick={() => trackDidRankEvent("did_rank_empty_market_cta", { list: "provider", period })}
          />
        ) : (
          <DidRankSecondaryRankListBody
            board="provider"
            column="provider"
            period={period}
            items={secondary.items}
            highlightUserId={rowHighlightId}
            rankTopGridId={rankTopGridId}
            titleKey="didRank_providerRank"
            t={t}
            scrollToMyRankRef={scrollToMyRankRef}
          />
        )}
      </div>
    </section>
  );
}
