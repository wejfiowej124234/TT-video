"use client";

import { useId } from "react";

/** 奖金池：每月奖励前 10 名治理币 · 30 §4 赛博风；从 did-rank/page 拆出 */
export default function DidRankPrizePoolSection({
  t,
  omitBottomMargin = false,
}: {
  t: (key: string) => string;
  /** 与 Header 同列 `flex gap` 时置 true，免与外层 `gap` 叠 `mb` */
  omitBottomMargin?: boolean;
}) {
  const titleId = useId();
  const mb = omitBottomMargin ? "" : " mb-4 sm:mb-6";
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-cyan-400/30 bg-slate-900/65 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5${mb} shadow-[0_0_36px_-10px_rgba(35,206,217,0.12),0_0_32px_-8px_rgba(217,70,239,0.08)] ring-1 ring-fuchsia-400/20 motion-sub`}
      aria-labelledby={titleId}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-body font-bold bg-gradient-to-r from-ref-cyan via-fuchsia-400 to-ref-sun bg-clip-text text-transparent">
            🏆 {t("didRank_prizePool")}
          </h2>
          <p className="text-meta text-slate-300 mt-0.5">{t("didRank_prizePoolDesc")}</p>
        </div>
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <div className="rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 px-4 py-2 sm:px-5 sm:py-2.5">
            <p className="text-meta text-amber-400/90">{t("didRank_prizePoolMonthly")}</p>
            <p className="text-h3 font-bold font-mono text-amber-300 mt-0.5 drop-shadow-rank-gold-soft">
              100,000 <span className="text-body font-semibold text-amber-400/90">{t("didRank_governanceToken")}</span>
            </p>
          </div>
          <p className="text-meta text-slate-400 max-w-xs">{t("didRank_prizeTop10")}</p>
        </div>
      </div>
    </section>
  );
}
