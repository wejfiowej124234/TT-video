"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Period } from "@/lib/didRankUtils";
import { DidRankPrizePoolAmount } from "@/components/did-rank/DidRankPrizePoolAmount";
import { TT_MARKETING_DID_RANK_SECTION_TITLE, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

const ease = [0.22, 1, 0.36, 1] as const;

/** 奖金池：每月奖励前 10 名治理币 · L5 入场 + count-up */
export default function DidRankPrizePoolSection({
  t,
  period = "all",
  omitBottomMargin = false,
  monthlyAmount,
  illustrative = true,
  apiConnected = false,
  poolNote = null,
  poolSource,
}: {
  t: (key: string) => string;
  period?: Period;
  omitBottomMargin?: boolean;
  monthlyAmount: number;
  illustrative?: boolean;
  apiConnected?: boolean;
  poolNote?: string | null;
  poolSource?: string;
}) {
  const titleId = useId();
  const mb = omitBottomMargin ? "" : " mb-4 sm:mb-6";
  const reduceMotion = useReducedMotion();
  const s = TT_MARKETING_DID_RANK_SURFACE;
  return (
    <motion.section
      key={period}
      className={`${s.prizePoolShell}${mb}`}
      aria-labelledby={titleId}
      data-tt-did-rank-prize-pool-illustrative={illustrative ? "1" : "0"}
      data-tt-did-rank-prize-pool-api-connected={apiConnected ? "1" : "0"}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.4, ease }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id={titleId} className={`text-body ${TT_MARKETING_DID_RANK_SECTION_TITLE}`}>
            {t("didRank_prizePool")}
          </h2>
          <p className="text-meta text-slate-300 mt-0.5">{t("didRank_prizePoolDesc")}</p>
          {illustrative ? (
            <p className="text-meta text-ref-sun/75 mt-1" role="status">
              {t("didRank_prizePoolIllustrative")}
            </p>
          ) : apiConnected ? (
            <p className="text-meta text-cyan-200/80 mt-1" role="status">
              {poolSource === "governance_pool_db"
                ? t("didRank_prizePoolFromGovernanceDb")
                : t("didRank_prizePoolApiLive")}
            </p>
          ) : null}
          {poolNote ? (
            <p className="text-meta text-slate-400 mt-1 max-w-xl">{poolNote}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <div className={s.prizePoolMetric}>
            <span className={s.prizePoolMetricBorderGlow} aria-hidden />
            <span className={s.prizePoolMetricShimmer} aria-hidden data-tt-did-rank-prize-shimmer="1" />
            <p className="relative z-[1] text-meta text-ref-sun/90">{t("didRank_prizePoolMonthly")}</p>
            <p className={`relative z-[1] text-h3 font-bold font-mono text-ref-sun mt-0.5 ${s.rankCardTextCrisp}`}>
              <DidRankPrizePoolAmount amount={monthlyAmount} replayKey={period} />{" "}
              <span className="text-body font-semibold text-ref-coral/95">{t("didRank_governanceToken")}</span>
            </p>
          </div>
          <p className="text-meta text-slate-400 max-w-xs">{t("didRank_prizeTop10")}</p>
        </div>
      </div>
    </motion.section>
  );
}
