"use client";

import { type FormEvent, useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";

export type GuideDashboardStatsProps = {
  t: (k: string) => string;
  statsLoading: boolean;
  statsError: boolean;
  onRetry: () => void;
  ordersGuided: number;
  completedCount: number;
  totalEarned: number;
  avgScore: number | null;
  reviewsWritten: number;
};

function StatTile({
  value,
  label,
  valueClass,
}: {
  value: string;
  label: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center">
      <p className={`text-h4 font-bold font-mono tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-meta text-slate-300 mt-0.5">{label}</p>
    </div>
  );
}

/** 05 / 90：向导侧统计摘要，字段与 `GET /api/v1/me/stats` guide 分支一致 */
export default function GuideDashboardStats({
  t,
  statsLoading,
  statsError,
  onRetry,
  ordersGuided,
  completedCount,
  totalEarned,
  avgScore,
  reviewsWritten,
}: GuideDashboardStatsProps) {
  const titleId = useId();
  const dash = t("ui_em_dash");
  const earnedDisplay = Number.isInteger(totalEarned) ? String(totalEarned) : totalEarned.toFixed(2);
  const avgDisplay = avgScore == null ? dash : avgScore.toFixed(1);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6 shadow-scifi-panel-md"
      aria-labelledby={titleId}
      aria-busy={statsLoading ? true : undefined}
    >
      <h2 id={titleId} className="text-body font-semibold text-cyan-200 mb-3">
        {t("guide_dashboard_stats_title")}
      </h2>
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 text-center"
            >
              <div className="min-h-[44px] h-11 min-w-[44px] w-12 mx-auto bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-16 mx-auto mt-2 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-800/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-slate-300">{t("guide_dashboard_stats_load_fail")}</p>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onRetry();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${FOCUS_RING}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatTile
            value={String(ordersGuided)}
            label={t("guide_dashboard_stat_orders_guided")}
            valueClass="text-cyan-300 drop-shadow-scifi-cyan-muted"
          />
          <StatTile
            value={String(completedCount)}
            label={t("guide_dashboard_stat_completed")}
            valueClass="text-success/95 drop-shadow-stat-success"
          />
          <StatTile
            value={earnedDisplay}
            label={`${t("guide_dashboard_stat_earned")}${t("ui_currency_suffix_usdt")}`}
            valueClass="text-fuchsia-300 drop-shadow-scifi-fuchsia-soft"
          />
          <StatTile
            value={avgDisplay}
            label={t("guide_dashboard_stat_avg_rating")}
            valueClass="text-warning/95 drop-shadow-stat-warning"
          />
          <StatTile
            value={String(reviewsWritten)}
            label={t("guide_dashboard_stat_reviews_written")}
            valueClass="text-slate-200 drop-shadow-stat-slate"
          />
        </div>
      )}
    </section>
  );
}
