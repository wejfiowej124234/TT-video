"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import { GOVERNANCE_TTG_GLOBAL_USAGE_ROWS } from "@/lib/governance/governanceParamsTokenomicsModel";
import { GovernanceParamsPercentBar } from "@/lib/governance/governanceParamsPageL5Ui";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsL5ReadonlyTable } from "./GovernanceParamsL5ReadonlyTable";

export function GovernanceParamsTtgBeyondCountriesSection({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <section className={className} id="gov-params-ttg-global-usage" data-tt-governance-params-ttg-global-usage="1">
      <GovernanceParamsSectionBlock
        kicker={t("governance_params_ttg_global_usage_kicker")}
        title={t("governance_params_ttg_global_usage_section_title_short")}
        lead={t("governance_params_ttg_global_usage_lead_short")}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {GOVERNANCE_TTG_GLOBAL_USAGE_ROWS.map((row) => (
            <GovernanceParamsPercentBar key={row.id} label={t(row.labelKey)} value={row.sharePct} />
          ))}
        </div>

        <GovernanceParamsL5ReadonlyTable
          className="mt-4"
          caption={t("governance_params_ttg_global_usage_table_caption")}
          columns={[
            { key: "purpose", label: t("governance_params_ttg_global_usage_col_purpose") },
            { key: "share", label: t("governance_params_ttg_global_usage_col_share"), align: "right" },
            { key: "note", label: t("governance_params_ttg_global_usage_col_note") },
          ]}
          rows={[
            ...GOVERNANCE_TTG_GLOBAL_USAGE_ROWS.map((row) => ({
              key: row.id,
              cells: [t(row.labelKey), `${row.sharePct}%`, t(row.hintKey)],
            })),
            {
              key: "total",
              cells: [
                t("governance_params_ttg_global_usage_total_row"),
                "100%",
                t("governance_params_ttg_global_usage_total_hint"),
              ],
            },
          ]}
        />
        <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_ttg_global_usage_notice_short")}</p>
      </GovernanceParamsSectionBlock>
    </section>
  );
}
