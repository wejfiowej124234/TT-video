"use client";

import { type FormEvent, useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

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
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`${TT_WORKSPACE_L5.statTile} text-center`}>
      <p className={accent ? TT_WORKSPACE_L5.statValueAccent : TT_WORKSPACE_L5.statValue}>{value}</p>
      <p className={TT_WORKSPACE_L5.statLabel}>{label}</p>
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
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-labelledby={titleId}
      aria-busy={statsLoading ? true : undefined}
    >
      <h2 id={titleId} className={TT_WORKSPACE_L5.sectionTitle}>
        {t("guide_dashboard_stats_title")}
      </h2>
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${TT_WORKSPACE_L5.statTile} animate-pulse motion-reduce:animate-none`}>
              <div className="mx-auto h-11 w-12 rounded-[var(--radius-sm)] bg-ref-sun/10" />
              <div className="mx-auto mt-2 h-3 w-16 rounded-[var(--radius-sm)] bg-ref-sun/[0.06]" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-xl border border-ref-sun/20 bg-ref-sun/[0.04] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-slate-300">{t("guide_dashboard_stats_load_fail")}</p>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onRetry();
            }}
          >
            <button type="submit" aria-label={t("common_retry")} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatTile value={String(ordersGuided)} label={t("guide_dashboard_stat_orders_guided")} accent />
          <StatTile value={String(completedCount)} label={t("guide_dashboard_stat_completed")} />
          <StatTile
            value={earnedDisplay}
            label={`${t("guide_dashboard_stat_earned")}${t("ui_currency_suffix_usdt")}`}
            accent
          />
          <StatTile value={avgDisplay} label={t("guide_dashboard_stat_avg_rating")} />
          <StatTile value={String(reviewsWritten)} label={t("guide_dashboard_stat_reviews_written")} />
        </div>
      )}
    </section>
  );
}
