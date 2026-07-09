"use client";

import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import {
  GOVERNANCE_FREEZE_TABLE_ROWS,
  GOVERNANCE_TOKENOMICS_FREEZE_DATE,
  GOVERNANCE_TOKENOMICS_FREEZE_DOC_ID,
  governanceFreezeLocaleVars,
} from "@/lib/governance/governanceParamsTokenomicsModel";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsL5ReadonlyTable } from "./GovernanceParamsL5ReadonlyTable";

export function GovernanceParamsGovFreezeRulesSection({
  t,
  locale,
  className = "",
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  className?: string;
}) {
  const vars = governanceFreezeLocaleVars(locale);

  return (
    <section
      className={className}
      id="gov-params-tokenomics-freeze"
      data-tt-governance-params-tokenomics-freeze="1"
    >
      <GovernanceParamsSectionBlock
        kicker={t("governance_params_governance_rules_kicker")}
        title={t("governance_params_governance_rules_title")}
        lead={t("governance_params_governance_rules_lead")}
      >
        <p className={GOV_PARAMS_L5.mutedNote}>
          {t("governance_params_tokenomics_freeze_id_note", {
            id: GOVERNANCE_TOKENOMICS_FREEZE_DOC_ID,
            date: GOVERNANCE_TOKENOMICS_FREEZE_DATE,
          })}
        </p>
        <GovernanceParamsL5ReadonlyTable
          caption={t("governance_params_tokenomics_freeze_table_caption")}
          columns={[
            { key: "rule", label: t("governance_params_tokenomics_freeze_col_rule") },
            { key: "title", label: t("governance_params_tokenomics_freeze_col_title") },
            { key: "value", label: t("governance_params_tokenomics_freeze_col_value") },
          ]}
          rows={GOVERNANCE_FREEZE_TABLE_ROWS.map((row) => ({
            key: row.id,
            cells: [row.id.replace("_", "-"), t(row.titleKey), t(row.valueKey, vars)],
          }))}
        />
        <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_tokenomics_freeze_scope_note_short")}</p>
      </GovernanceParamsSectionBlock>
    </section>
  );
}
