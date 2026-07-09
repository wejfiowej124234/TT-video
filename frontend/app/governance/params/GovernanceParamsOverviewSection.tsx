"use client";

import { GOV_PARAMS_L5, GovernanceParamsL5Panel } from "@/lib/governance/governanceParamsPageL5";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import { GovernanceParamsFundRailsSummary } from "./GovernanceParamsFundRailsSummary";
import { GovernanceParamsPanelHeader } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsRulesAtAGlance } from "./GovernanceParamsRulesAtAGlance";
import { GovernanceParamsWeb3RuntimeStrip } from "./GovernanceParamsWeb3RuntimeStrip";

export function GovernanceParamsOverviewSection({
  t,
  className = "",
  mirrorBadge,
}: {
  t: (key: string) => string;
  className?: string;
  mirrorBadge?: string;
}) {
  return (
    <div id="gov-params-overview" className={`scroll-mt-24 ${className}`.trim()} data-tt-governance-params-overview="1">
      <GovernanceParamsL5Panel>
        <GovernanceParamsPanelHeader
          title={t("governance_params_overview_quick_read_title")}
          lead={t("governance_params_overview_quick_read_lead")}
          badge={mirrorBadge}
        />

        <div className={`${GOV_PARAMS_LAYOUT.blockGap} ${GOV_PARAMS_LAYOUT.callout}`} role="note">
          {t("governance_params_dual_track_summary")}
        </div>

        <GovernanceParamsFundRailsSummary t={t} className={GOV_PARAMS_LAYOUT.blockGap} />

        <GovernanceParamsRulesAtAGlance t={t} className={GOV_PARAMS_LAYOUT.blockDivider} />

        <GovernanceParamsWeb3RuntimeStrip t={t} />

        <div
          className={`${GOV_PARAMS_LAYOUT.blockGap} rounded-[var(--radius-md)] border border-white/8 bg-slate-950/30 px-4 py-3`}
          data-testid="governance-params-p553-data-scope"
          data-tt-governance-params-data-scope="1"
        >
          <p className={`text-small font-medium text-slate-200`}>{t("governance_params_data_scope_title")}</p>
          <p className={`mt-2 ${GOV_PARAMS_L5.mutedNote}`}>{t("governance_params_data_scope_bullet_customer")}</p>
        </div>
      </GovernanceParamsL5Panel>
    </div>
  );
}
