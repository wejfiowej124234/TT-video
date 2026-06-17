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

      <GovernanceParamsL5Panel className="mt-6">
        <div className={GOV_PARAMS_L5.sectionHeading}>{t("governance_params_overview_foundation_title")}</div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full max-w-xl rounded-[var(--radius-sm)] bg-slate-900/70 animate-pulse" aria-hidden />
          <div className="h-4 w-5/6 max-w-lg rounded-[var(--radius-sm)] bg-slate-900/60 animate-pulse" aria-hidden />
        </div>
      </GovernanceParamsL5Panel>

      <p className="sr-only" role="status" aria-live="polite" aria-busy="true">
        {t("governance_params_title")} · {t("governance_params_dual_track_summary")}
      </p>
    </GovernanceParamsL5Shell>
  );
}
