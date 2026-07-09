"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

export function GovernanceParamsTreasuryUsdcCallout({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <div
      className={`${GOV_PARAMS_LAYOUT.callout} border-ref-sun/25 ${className}`.trim()}
      data-tt-governance-params-treasury-usdc-callout="1"
      role="note"
    >
      <p className="text-small font-semibold text-ref-sun/95">{t("governance_params_treasury_usdc_callout_title")}</p>
      <p className="mt-2 text-small leading-relaxed text-slate-200">{t("governance_params_treasury_usdc_callout_body")}</p>
      <p className="mt-2 text-meta leading-relaxed text-slate-400">{t("governance_params_treasury_usdc_callout_flow")}</p>
    </div>
  );
}
