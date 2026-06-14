"use client";

import { type FormEvent, useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideBillingPeriodCardProps = {
  t: (k: string) => string;
  statsLoading: boolean;
  statsError: boolean;
  onRetry: () => void;
  billingPeriodUtc: string | null;
  periodExpectedEarnings: number;
  periodSettledOrdersCount: number;
};

/** B-078：`GET /api/v1/me/stats` guide 分支 `billing_period_utc` / `period_*` 工作台单卡 */
export default function GuideBillingPeriodCard({
  t,
  statsLoading,
  statsError,
  onRetry,
  billingPeriodUtc,
  periodExpectedEarnings,
  periodSettledOrdersCount,
}: GuideBillingPeriodCardProps) {
  const titleId = useId();
  const dash = t("ui_em_dash");
  const periodLabel = billingPeriodUtc?.trim() ? billingPeriodUtc : dash;
  const title = t("guide_billing_period_title").replace("{{period}}", periodLabel);
  const expectedDisplay = Number.isInteger(periodExpectedEarnings)
    ? String(periodExpectedEarnings)
    : periodExpectedEarnings.toFixed(2);

  return (
    <section
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-labelledby={titleId}
      aria-busy={statsLoading ? true : undefined}
    >
      <h2 id={titleId} className={TT_WORKSPACE_L5.sectionTitle}>
        {title}
      </h2>
      <p className={`${TT_WORKSPACE_L5.sectionSubtitle} mb-3`}>{t("guide_billing_period_hint")}</p>
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2].map((i) => (
            <div key={i} className={`${TT_WORKSPACE_L5.statTile} animate-pulse motion-reduce:animate-none`}>
              <div className="mx-auto sm:mx-0 h-11 w-24 rounded-[var(--radius-sm)] bg-ref-sun/10" />
              <div className="mx-auto sm:mx-0 mt-2 h-3 w-28 rounded-[var(--radius-sm)] bg-ref-sun/[0.06]" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-xl border border-ref-sun/20 bg-ref-sun/[0.04] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-slate-300">{t("guide_billing_period_load_fail")}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValueAccent}>
              {expectedDisplay}
              <span className="text-small font-sans font-medium text-slate-400 ml-1">
                {t("ui_currency_suffix_usdt")}
              </span>
            </p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("guide_billing_period_expected")}</p>
          </div>
          <div className={TT_WORKSPACE_L5.statTile}>
            <p className={TT_WORKSPACE_L5.statValue}>{String(periodSettledOrdersCount)}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("guide_billing_period_settled")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
