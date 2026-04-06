"use client";

import { type FormEvent, useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";

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
      className="rounded-[var(--radius-md)] border border-fuchsia-500/30 bg-slate-900/70 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6 shadow-scifi-panel-md"
      aria-labelledby={titleId}
      aria-busy={statsLoading ? true : undefined}
    >
      <h2 id={titleId} className="text-body font-semibold text-fuchsia-200 mb-1">
        {title}
      </h2>
      <p className="text-meta text-slate-400 mb-3">{t("guide_billing_period_hint")}</p>
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] border border-fuchsia-500/15 bg-slate-800/60 px-3 py-3"
            >
              <div className="min-h-[44px] h-11 min-w-[44px] w-24 mx-auto sm:mx-0 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-28 mx-auto sm:mx-0 mt-2 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-800/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-slate-300">{t("guide_billing_period_load_fail")}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-[var(--radius-md)] border border-fuchsia-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center sm:text-left">
            <p className="text-h4 font-bold font-mono tabular-nums text-fuchsia-300 drop-shadow-scifi-fuchsia-soft">
              {expectedDisplay}
              <span className="text-small font-sans font-medium text-slate-400 ml-1">
                {t("ui_currency_suffix_usdt")}
              </span>
            </p>
            <p className="text-meta text-slate-300 mt-0.5">{t("guide_billing_period_expected")}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3 text-center sm:text-left">
            <p className="text-h4 font-bold font-mono tabular-nums text-cyan-300 drop-shadow-scifi-cyan-muted">
              {String(periodSettledOrdersCount)}
            </p>
            <p className="text-meta text-slate-300 mt-0.5">{t("guide_billing_period_settled")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
