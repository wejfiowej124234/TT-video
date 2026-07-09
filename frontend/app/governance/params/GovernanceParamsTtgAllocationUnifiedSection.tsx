"use client";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";
import {
  GOVERNANCE_PUBLIC_SALE_ROUNDS,
  GOVERNANCE_PUBLIC_SALE_TOTAL,
  GOVERNANCE_TTG_SUPPLY_ROWS,
  PROTOCOL_SSOT_DOC_ID,
  TTG_TOTAL_SUPPLY,
  formatTtgUnits,
} from "@/lib/governance/governanceParamsTokenomicsModel";
import { GovernanceParamsSectionBlock } from "./GovernanceParamsSectionBlock";
import { GovernanceParamsL5ReadonlyTable } from "./GovernanceParamsL5ReadonlyTable";

export function GovernanceParamsTtgAllocationUnifiedSection({
  t,
  locale,
  className = "",
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  className?: string;
}) {
  const vars = { supply: formatTtgUnits(TTG_TOTAL_SUPPLY, locale), doc: PROTOCOL_SSOT_DOC_ID };

  return (
    <section className={className} id="gov-params-ttg-supply" data-tt-governance-params-ttg-supply-unified="1">
      <GovernanceParamsSectionBlock
        kicker={t("governance_params_ttg_supply_kicker")}
        title={t("governance_params_ttg_supply_unified_title")}
        lead={t("governance_params_ttg_supply_unified_lead", vars)}
      >
        <div className={GOV_PARAMS_LAYOUT.callout} role="note">
          {t("governance_params_ttg_supply_unified_notice")}
        </div>

        <GovernanceParamsL5ReadonlyTable
          className="mt-4"
          caption={t("governance_params_ttg_supply_table_caption")}
          columns={[
            { key: "category", label: t("governance_params_ttg_supply_col_category") },
            { key: "share", label: t("governance_params_ttg_supply_col_share"), align: "right" },
            { key: "ttg", label: t("governance_params_ttg_supply_col_ttg"), align: "right" },
            { key: "note", label: t("governance_params_ttg_supply_col_note") },
          ]}
          rows={[
            ...GOVERNANCE_TTG_SUPPLY_ROWS.map((row) => ({
              key: row.id,
              cells: [
                t(row.labelKey),
                `${row.sharePct}%`,
                formatTtgUnits(row.ttgUnits, locale),
                t(row.hintKey),
              ],
            })),
            {
              key: "total",
              cells: [
                t("governance_params_ttg_supply_total_row"),
                "100%",
                formatTtgUnits(TTG_TOTAL_SUPPLY, locale),
                t("governance_params_ttg_supply_total_hint"),
              ],
              emphasis: true,
            },
          ]}
        />

        <GovernanceParamsSectionBlock
          className={`${GOV_PARAMS_LAYOUT.blockDivider} !mt-6`}
          title={t("governance_params_ttg_public_nested_title")}
          lead={t("governance_params_ttg_public_nested_lead")}
        >
          <GovernanceParamsL5ReadonlyTable
            caption={t("governance_params_treasury_policy_public_rounds_caption")}
            columns={[
              { key: "round", label: t("governance_params_treasury_policy_col_round") },
              { key: "ttg", label: t("governance_params_treasury_policy_col_ttg"), align: "right" },
              { key: "supply", label: t("governance_params_treasury_policy_col_of_supply"), align: "right" },
            ]}
            rows={[
              ...GOVERNANCE_PUBLIC_SALE_ROUNDS.map((row) => ({
                key: row.id,
                cells: [t(row.labelKey), formatTtgUnits(row.ttgUnits, locale), `${row.ofSupplyPct}%`],
              })),
              {
                key: "public_total",
                cells: [
                  t("governance_params_ttg_public_nested_total"),
                  formatTtgUnits(GOVERNANCE_PUBLIC_SALE_TOTAL.ttgUnits, locale),
                  `${GOVERNANCE_PUBLIC_SALE_TOTAL.ofSupplyPct}%`,
                ],
                emphasis: true,
              },
            ]}
          />
        </GovernanceParamsSectionBlock>

        <p className={`mt-4 ${GOV_PARAMS_LAYOUT.callout}`}>{t("governance_params_ttg_holder_disclaimer")}</p>
        <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`}>{t("governance_params_ttg_supply_doc_ref", vars)}</p>
      </GovernanceParamsSectionBlock>
    </section>
  );
}
