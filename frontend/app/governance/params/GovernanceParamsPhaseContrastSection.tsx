"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import { GOVERNANCE_PHASE_CONTRAST_ROWS } from "@/lib/governance/governanceParamsTokenomicsModel";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsL5ReadonlyTable } from "./GovernanceParamsL5ReadonlyTable";

export function GovernanceParamsPhaseContrastSection({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <section className={className} data-tt-governance-params-phase-contrast="1">
      <GovernanceParamsSectionBlock
        kicker={t("governance_params_phase_contrast_kicker")}
        title={t("governance_params_phase_contrast_title")}
        lead={t("governance_params_phase_contrast_lead")}
      >
        <GovernanceParamsL5ReadonlyTable
          caption={t("governance_params_phase_contrast_table_caption")}
          columns={[
            { key: "name", label: t("governance_params_phase_contrast_col_name") },
            { key: "timing", label: t("governance_params_phase_contrast_col_timing") },
            { key: "is", label: t("governance_params_phase_contrast_col_is") },
            { key: "is_not", label: t("governance_params_phase_contrast_col_is_not") },
          ]}
          rows={GOVERNANCE_PHASE_CONTRAST_ROWS.map((row) => ({
            key: row.id,
            cells: [t(row.nameKey), t(row.timingKey), t(row.isKey), t(row.isNotKey)],
          }))}
        />
        <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_phase_contrast_footnote")}</p>
      </GovernanceParamsSectionBlock>
    </section>
  );
}
