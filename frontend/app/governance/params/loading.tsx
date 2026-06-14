"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { GovernanceParamsL5Shell } from "@/components/governance/GovernanceParamsL5Shell";
import { GOV_PARAMS_L5, GovernanceParamsL5Panel } from "@/lib/governance/governanceParamsPageL5";

/** 与 GovernanceParamsPageMain 壳一致的路由级 loading。 */
export default function GovernanceParamsLoading() {
  const { t } = useTranslation();
  return (
    <GovernanceParamsL5Shell ariaLabelledBy="governance-params-loading-title">
      <div
        id="governance-params-loading-title"
        className="min-h-[44px] h-11 w-64 max-w-full rounded-[var(--radius-sm)] bg-slate-800/80 animate-pulse"
        aria-hidden
      />
      <div className="mt-4 h-4 w-full max-w-2xl rounded-[var(--radius-sm)] bg-slate-900/70 animate-pulse" aria-hidden />
      <div className="mt-2 h-3 w-48 rounded-[var(--radius-sm)] bg-slate-900/60 animate-pulse" aria-hidden />

      <GovernanceParamsL5Panel className="mt-6">
        <div className={GOV_PARAMS_L5.sectionHeading}>{t("governance_params_diff_section")}</div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-3/4 max-w-md rounded-[var(--radius-sm)] bg-slate-900/70 animate-pulse" aria-hidden />
          <div className="h-4 w-2/3 max-w-sm rounded-[var(--radius-sm)] bg-slate-900/60 animate-pulse" aria-hidden />
        </div>
      </GovernanceParamsL5Panel>

      <GovernanceParamsL5Panel className="mt-6" aria-hidden>
        <div className="mb-3 min-h-[44px] h-11 w-56 rounded-[var(--radius-sm)] bg-slate-800/80 animate-pulse" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} className="h-3 w-full max-w-xl rounded-[var(--radius-sm)] bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      </GovernanceParamsL5Panel>

      <p className="sr-only" role="status" aria-live="polite" aria-busy="true">
        {t("governance_params_title")}
      </p>
    </GovernanceParamsL5Shell>
  );
}
