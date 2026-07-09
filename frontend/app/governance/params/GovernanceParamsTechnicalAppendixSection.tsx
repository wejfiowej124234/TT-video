"use client";

import type { ReactNode } from "react";
import { GOV_PARAMS_L5, GovernanceParamsL5Panel } from "@/lib/governance/governanceParamsPageL5";

export function GovernanceParamsTechnicalAppendixSection({
  t,
  className = "",
  children,
}: {
  t: (key: string) => string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div id="gov-params-fee-routing" className="scroll-mt-24" data-tt-governance-params-technical-appendix="1">
      <details className={`${GOV_PARAMS_L5.accordion} ${className}`.trim()} data-tt-governance-params-technical-appendix-details="1">
        <summary className={`${GOV_PARAMS_L5.accordionSummary} hover:bg-ref-sun/[0.06]`}>
          {t("governance_params_technical_appendix_toggle")}
        </summary>
        <div className="border-t border-white/10 px-4 pb-5 pt-4">
          <p className={`max-w-3xl ${GOV_PARAMS_L5.metaNote}`}>{t("governance_params_technical_appendix_lead_short")}</p>
          <div className="mt-4">{children}</div>
        </div>
      </details>
    </div>
  );
}
