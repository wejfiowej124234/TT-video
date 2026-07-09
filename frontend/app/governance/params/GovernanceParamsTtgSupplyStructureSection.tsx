"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import { GOVERNANCE_TTG_SUPPLY_ROWS } from "@/lib/governance/governanceParamsTokenomicsModel";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsL5ReadonlyTable } from "./GovernanceParamsL5ReadonlyTable";

export function GovernanceParamsTtgSupplyStructureSection({
  t,
  locale: _locale,
  className = "",
}: {
  t: (key: string) => string;
  locale: string;
  className?: string;
}) {
  return (
    <section className={className} id="gov-params-ttg-supply" data-tt-governance-params-ttg-supply="1">
      <GovernanceParamsSectionBlock
        kicker={t("governance_params_ttg_supply_kicker")}
        title={t("governance_params_ttg_supply_section_title_short")}
        lead={t("governance_params_ttg_supply_lead_short")}
      >
        <GovernanceParamsL5ReadonlyTable
          caption={t("governance_params_ttg_supply_table_caption")}
          columns={[
            { key: "category", label: t("governance_params_ttg_supply_col_category") },
            { key: "share", label: t("governance_params_ttg_supply_col_share"), align: "right" },
          ]}
          rows={[
            ...GOVERNANCE_TTG_SUPPLY_ROWS.map((row) => ({
              key: row.id,
              cells: [t(row.labelKey), `${row.sharePct}%`],
            })),
            {
              key: "total",
              cells: [t("governance_params_ttg_supply_total_row"), "100%"],
            },
          ]}
        />
        <p className={`${GOV_PARAMS_LAYOUT.callout} mt-3`}>{t("governance_params_ttg_holder_disclaimer")}</p>
      </GovernanceParamsSectionBlock>
    </section>
  );
}
