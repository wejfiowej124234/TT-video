"use client";

import Link from "next/link";
import { useId } from "react";
import { marketCyanInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { FOCUS_RING } from "./constants";

export interface MeStatsSectionProps {
  t: (k: string) => string;
  statsLoading: boolean;
  statsError: boolean;
  loadStats: () => void;
  ordersTotal: number | null;
  reviewsCount: number | null;
  totalSpent: number | null;
}

export default function MeStatsSection({
  t,
  statsLoading,
  statsError,
  loadStats,
  ordersTotal,
  reviewsCount,
  totalSpent,
}: MeStatsSectionProps) {
  const titleId = useId();
  return (
    <section
      className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6 shadow-scifi-panel-md motion-sub hover:border-cyan-500/50"
      aria-labelledby={titleId}
      aria-busy={statsLoading ? true : undefined}
    >
      <h2 id={titleId} className="text-body font-semibold text-cyan-200 mb-3">
        {t("me_stats")}
      </h2>
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center">
              <div className="h-6 w-12 mx-auto bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-3 w-14 mx-auto mt-2 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-800/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-slate-300">{t("me_statsLoadFail")}</p>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              loadStats();
            }}
          >
            <button
              type="submit"
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${FOCUS_RING}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center">
              <p className="text-h4 font-bold font-mono text-cyan-300 drop-shadow-scifi-cyan">
                {ordersTotal === null ? t("ui_em_dash") : ordersTotal}
              </p>
              <p className="text-meta text-slate-300 mt-0.5">{t("me_ordersTotal")}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center">
              <p className="text-h4 font-bold font-mono text-cyan-300 drop-shadow-scifi-cyan">
                {reviewsCount === null ? t("ui_em_dash") : reviewsCount}
              </p>
              <p className="text-meta text-slate-300 mt-0.5">{t("me_reviewsCount")}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-fuchsia-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center">
              <p className="text-h4 font-bold font-mono text-fuchsia-300 drop-shadow-scifi-fuchsia">
                {totalSpent === null
                  ? t("ui_em_dash")
                  : Number.isInteger(totalSpent)
                    ? totalSpent
                    : totalSpent.toFixed(2)}
              </p>
              <p className="text-meta text-slate-300 mt-0.5">
                {t("me_totalSpent")}
                {t("ui_currency_suffix_usdt")}
              </p>
            </div>
          </div>
          {ordersTotal !== null &&
            reviewsCount !== null &&
            totalSpent !== null &&
            ordersTotal === 0 &&
            reviewsCount === 0 &&
            totalSpent === 0 && (
            <p className="text-meta text-slate-400 mt-3">
              {t("me_emptyStatsHint")}{" "}
              <Link
                href="/market"
                className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline motion-sub ${marketCyanInlineLinkFocusClasses}`}
              >
                {t("me_market_cta")}
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
