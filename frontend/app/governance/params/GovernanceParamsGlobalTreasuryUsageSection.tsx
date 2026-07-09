"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import { GovernanceParamsPercentBar } from "@/lib/governance/governanceParamsPageL5Ui";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsTreasuryUsdcCallout } from "./GovernanceParamsTreasuryUsdcCallout";

export function GovernanceParamsGlobalTreasuryUsageSection({
  t,
  className = "",
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
}) {
  const priorities = [
    { n: 1, labelKey: "governance_params_treasury_priority_ops", hintKey: "governance_params_treasury_priority_ops_hint" },
    { n: 2, labelKey: "governance_params_treasury_priority_security", hintKey: "governance_params_treasury_priority_security_hint" },
    { n: 3, labelKey: "governance_params_treasury_priority_ecosystem", hintKey: "governance_params_treasury_priority_ecosystem_hint" },
    { n: 4, labelKey: "governance_params_treasury_priority_remainder", hintKey: "governance_params_treasury_priority_remainder_hint_v2" },
  ] as const;

  return (
    <div className={className} id="gov-params-global-treasury" data-tt-governance-params-global-treasury="1">
      <GovernanceParamsTreasuryUsdcCallout t={t} className="mb-5" />

      <GovernanceParamsSectionBlock
        kicker={t("governance_params_treasury_block_kicker")}
        title={t("governance_params_treasury_section_short_title")}
        lead={t("governance_params_treasury_lead_short")}
      >
        <p className="text-small font-medium text-slate-300">{t("governance_params_treasury_example_heading")}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <GovernanceParamsPercentBar label={t("governance_params_treasury_example_steward")} value={45} />
          <GovernanceParamsPercentBar label={t("governance_params_treasury_example_treasury")} value={55} />
        </div>

        <div className={`mt-4 ${GOV_PARAMS_LAYOUT.railCard}`}>
          <p className={GOV_PARAMS_LAYOUT.blockKicker}>
            {t("governance_params_treasury_flow_kicker")} · {t("governance_params_treasury_flow_title")}
          </p>
          <p className={`mt-2 text-small leading-relaxed text-slate-300`}>{t("governance_params_treasury_flow_body_short")}</p>
        </div>
      </GovernanceParamsSectionBlock>

      <GovernanceParamsSectionBlock
        className={GOV_PARAMS_LAYOUT.blockDivider}
        kicker={t("governance_params_treasury_priorities_kicker")}
        title={t("governance_params_treasury_priorities_heading_short")}
        lead={t("governance_params_treasury_priorities_lead")}
      >
        <ol className="grid gap-2 sm:grid-cols-2">
          {priorities.map((p) => (
            <li
              key={p.n}
              className="rounded-[var(--radius-md)] border border-white/10 bg-slate-950/40 px-3.5 py-3"
              data-tt-governance-params-treasury-priority={p.n}
            >
              <p className="text-small font-semibold text-slate-100">
                {t("governance_params_treasury_priority_label", { n: p.n })} · {t(p.labelKey)}
              </p>
              <p className={`mt-1 text-meta leading-relaxed text-slate-400`}>{t(p.hintKey)}</p>
            </li>
          ))}
        </ol>
        <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_treasury_scope_note_short")}</p>
      </GovernanceParamsSectionBlock>
    </div>
  );
}
