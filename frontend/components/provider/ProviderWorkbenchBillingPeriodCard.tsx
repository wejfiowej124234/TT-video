"use client";

import { type FormEvent, useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type ProviderWorkbenchBillingPeriodCardProps = {
  t: (k: string, vars?: Record<string, string | number>) => string;
  statsLoading: boolean;
  statsError: boolean;
  onRetry: () => void;
  billingPeriodUtc: string | null;
  ordersMerchantTotal: number;
  merchantInProgressCount: number;
  periodExpectedEarnings: number;
  periodSettledOrdersCount: number;
};

export default function ProviderWorkbenchBillingPeriodCard({
  t,
  statsLoading,
  statsError,
  onRetry,
  billingPeriodUtc,
  ordersMerchantTotal,
  merchantInProgressCount,
  periodExpectedEarnings,
  periodSettledOrdersCount,
}: ProviderWorkbenchBillingPeriodCardProps) {
  const titleId = useId();
  const dash = t("ui_em_dash");
  const periodLabel = billingPeriodUtc?.trim() ? billingPeriodUtc : dash;
  const title = t("provider_workbench_billing_period_title", { period: periodLabel });
  const expectedDisplay = Number.isInteger(periodExpectedEarnings)
    ? String(periodExpectedEarnings)
    : periodExpectedEarnings.toFixed(2);

  return (
    <section
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-labelledby={titleId}
      aria-busy={statsLoading ? true : undefined}
      data-tt-provider-workbench-stats="1"
    >
      <h2 id={titleId} className={TT_WORKSPACE_L5.sectionTitle}>
        {title}
      </h2>
      <p className={`${TT_WORKSPACE_L5.sectionSubtitle} mb-3`}>{t("provider_workbench_stats_subtitle")}</p>

      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${TT_WORKSPACE_L5.statTile} animate-pulse motion-reduce:animate-none`}>
              <div className="mx-auto sm:mx-0 h-11 w-24 rounded-[var(--radius-sm)] bg-ref-sun/10" />
              <div className="mx-auto sm:mx-0 mt-2 h-3 w-28 rounded-[var(--radius-sm)] bg-ref-sun/[0.06]" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-xl border border-ref-sun/20 bg-ref-sun/[0.04] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-slate-300">{t("provider_workbench_stats_load_fail")}</p>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onRetry();
            }}
          >
            <button type="submit" className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValue}>{ordersMerchantTotal}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("provider_workbench_stats_orders_total")}</p>
          </div>
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={`${TT_WORKSPACE_L5.statValueAccent} text-ref-cyan`}>{merchantInProgressCount}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("provider_workbench_stats_in_progress")}</p>
          </div>
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValueAccent}>{expectedDisplay}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("provider_workbench_stats_period_earnings")}</p>
          </div>
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValue}>{periodSettledOrdersCount}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("provider_workbench_stats_period_settled")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
