"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

export function GovernanceParamsFundRailsSummary({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  const rails = [
    {
      id: "funding",
      titleKey: "governance_params_overview_fund_rail_funding_title",
      bodyKey: "governance_params_overview_fund_rail_funding_body",
    },
    {
      id: "revenue",
      titleKey: "governance_params_overview_fund_rail_revenue_title",
      bodyKey: "governance_params_overview_fund_rail_revenue_body",
    },
  ] as const;

  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 ${className}`.trim()}
      data-tt-governance-params-fund-rails="1"
      aria-label={t("governance_params_overview_fund_rails_aria")}
    >
      {rails.map((rail) => (
        <div key={rail.id} className={GOV_PARAMS_LAYOUT.railCard} data-tt-governance-params-fund-rail={rail.id}>
          <p className={GOV_PARAMS_LAYOUT.blockKicker}>{t(rail.titleKey)}</p>
          <p className={`mt-2 text-small leading-relaxed text-slate-200`}>{t(rail.bodyKey)}</p>
        </div>
      ))}
    </div>
  );
}
