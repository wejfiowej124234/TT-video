"use client";

import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";

export function GovernanceParamsCountriesTableLegend({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <details className={`${GOV_PARAMS_L5.accordion} ${className}`.trim()} data-tt-governance-params-phase1-legend="1">
      <summary className={`${GOV_PARAMS_L5.accordionSummary} hover:bg-ref-sun/[0.06]`}>
        {t("governance_params_phase1_legend_title")}
      </summary>
      <ul className={`border-t border-white/10 px-4 pb-3 pt-2 list-disc space-y-1.5 pl-8 ${GOV_PARAMS_L5.mutedNote}`}>
        <li>{t("governance_params_col_cap_pts_hint")}</li>
        <li>{t("governance_params_phase1_legend_stake_amount")}</li>
        <li>{t("governance_params_phase1_fundraise_table_title")}</li>
      </ul>
    </details>
  );
}
