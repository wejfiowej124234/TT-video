"use client";

import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import {
  GOVERNANCE_TREASURY_POLICY_OPTIONS,
  governanceFreezeLocaleVars,
} from "@/lib/governance/governanceParamsTokenomicsModel";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsL5OptionGrid } from "./GovernanceParamsL5ReadonlyTable";

export function GovernanceParamsTreasuryPolicySection({
  t,
  locale,
  className = "",
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  className?: string;
}) {
  const freezeVars = governanceFreezeLocaleVars(locale);

  return (
    <section className={className} id="gov-params-treasury-policy" data-tt-governance-params-treasury-policy="1">
      <GovernanceParamsSectionBlock
        kicker={t("governance_params_treasury_policy_kicker")}
        title={t("governance_params_treasury_policy_title_short")}
        lead={t("governance_params_treasury_policy_lead_short_v2")}
      >
        <div className={`${GOV_PARAMS_LAYOUT.railCard}`}>
          <p className="text-small font-semibold text-slate-100">{t("governance_params_treasury_policy_cap_heading")}</p>
          <p className={`mt-1.5 text-small leading-relaxed text-slate-300`}>
            {t("governance_params_treasury_policy_cap_body_short", freezeVars)}
          </p>
        </div>

        <p className={`mt-4 ${GOV_PARAMS_L5.mutedNote}`}>{t("governance_params_treasury_policy_recommended_path")}</p>
      </GovernanceParamsSectionBlock>

      <GovernanceParamsSectionBlock
        className={GOV_PARAMS_LAYOUT.blockDivider}
        title={t("governance_params_treasury_policy_options_heading_short")}
        lead={t("governance_params_treasury_policy_options_lead_v2")}
      >
        <GovernanceParamsL5OptionGrid
          items={GOVERNANCE_TREASURY_POLICY_OPTIONS.map((opt, i) => ({
            id: opt.id,
            title: `${String.fromCharCode(65 + i)} · ${t(opt.labelKey)}`,
            hint: t(opt.hintKey),
          }))}
        />
        <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_treasury_policy_seat_exit_note_short")}</p>
        <p className={`mt-2 ${GOV_PARAMS_L5.mutedNote}`}>{t("governance_params_treasury_policy_scope_note_short")}</p>
        <p className={`mt-2 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_treasury_policy_public_rounds_pointer")}</p>
      </GovernanceParamsSectionBlock>
    </section>
  );
}
