"use client";

import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";
import { useGovernanceParamsQuery } from "./GovernanceParamsQueryProvider";

export function GovernanceParamsStewardContextPanel({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  const { fromStewardWorkbench } = useGovernanceParamsQuery();
  if (!fromStewardWorkbench) return null;

  return (
    <aside
      className={`rounded-[var(--radius-md)] border border-ref-sun/25 bg-ref-sun/[0.06] p-4 ${className}`.trim()}
      data-tt-governance-params-steward-context="1"
      role="note"
    >
      <p className={`${GOV_PARAMS_L5.cardHint} font-medium text-ref-sun/95`}>
        {t("governance_params_steward_context_title")}
      </p>
      <p className={`mt-1 ${GOV_PARAMS_L5.mutedNote}`}>{t("governance_params_steward_context_lead")}</p>
    </aside>
  );
}
