"use client";

import type { LocaleTranslateFn } from "@/lib/i18n";
import { GOV_PARAMS_L5, GOV_PARAMS_TABLE } from "@/lib/governance/governanceParamsPageL5";
import type { CountryRow84 } from "@/lib/governanceParams84Readonly";
import {
  formatPhase1StewardStakeTtg,
  resolvePhase1CountryDisplay,
  resolvePhase1CountryProtocolStake,
} from "@/lib/governance/governanceParamsCountryDisplay";
import { GovernanceParamsCountriesTableLegend } from "./GovernanceParamsCountriesTableLegend";

export function GovernanceParamsPhase1CountriesTables({
  t,
  locale,
  dash,
  rows,
  fundraiseTotalWan,
  protocolTableCaptionId,
  fundraiseTableCaptionId,
}: {
  t: LocaleTranslateFn;
  locale: string;
  dash: string;
  rows: CountryRow84[];
  fundraiseTotalWan: number;
  protocolTableCaptionId: string;
  fundraiseTableCaptionId: string;
}) {
  return (
    <div className="mt-4 space-y-4" data-tt-governance-params-phase1-split-tables="1">
      <GovernanceParamsCountriesTableLegend t={t} />
      <div className="overflow-x-auto" data-tt-governance-params-countries-mobile="1">
        <table className="w-full min-w-[640px] text-left text-small">
          <caption id={protocolTableCaptionId} className="sr-only">
            {t("governance_params_phase1_protocol_table_title")}
          </caption>
          <thead>
            <tr className={GOV_PARAMS_TABLE.headRow}>
              <th className="px-3 py-2">{t("governance_params_col_country")}</th>
              <th className="px-3 py-2">{t("governance_params_col_cap_pts")}</th>
              <th className="px-3 py-2">{t("governance_params_col_open_pts")}</th>
              <th className="px-3 py-2">{t("governance_params_col_steward_stake_ttg")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const display = resolvePhase1CountryDisplay(row, locale);
              const stake = resolvePhase1CountryProtocolStake(row);
              return (
                <tr key={row.name_zh} className={GOV_PARAMS_TABLE.bodyRow}>
                  <td className="px-3 py-2">{display.name}</td>
                  <td className={`px-3 py-2 ${GOV_PARAMS_TABLE.mono}`}>{row.national_pool_cap_fee_points}</td>
                  <td className={`px-3 py-2 ${GOV_PARAMS_TABLE.mono}`}>{row.phase1_open_fee_points}</td>
                  <td className={`px-3 py-2 ${GOV_PARAMS_TABLE.mono}`}>
                    {stake ? formatPhase1StewardStakeTtg(stake.stewardStakeTtgUnits, locale) : dash}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <details className={`${GOV_PARAMS_L5.accordion} mt-4`} data-tt-governance-params-fundraise-planning="1">
        <summary className={GOV_PARAMS_L5.accordionSummary}>{t("governance_params_phase1_fundraise_planning_toggle")}</summary>
        <div className="border-t border-white/10 px-1 pb-2 pt-3">
          <p className={`mb-3 px-3 ${GOV_PARAMS_L5.mutedNote}`}>{t("governance_params_phase1_fundraise_planning_lead")}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-small">
              <caption id={fundraiseTableCaptionId} className="sr-only">
                {t("governance_params_phase1_fundraise_table_title")}
              </caption>
              <thead>
                <tr className={GOV_PARAMS_TABLE.headRow}>
                  <th className="px-3 py-2">{t("governance_params_col_country")}</th>
                  <th className="px-3 py-2">{t("governance_params_col_target_wan")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const display = resolvePhase1CountryDisplay(row, locale);
                  return (
                    <tr key={`fundraise-${row.name_zh}`} className={GOV_PARAMS_TABLE.bodyRow}>
                      <td className="px-3 py-2">{display.name}</td>
                      <td className={`px-3 py-2 ${GOV_PARAMS_TABLE.mono}`}>{row.fundraise_target_cny_wan}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={GOV_PARAMS_TABLE.bodyRow}>
                  <td className="px-3 py-2 font-semibold">{t("governance_params_phase1_fundraise_total_row_label")}</td>
                  <td
                    className={`px-3 py-2 font-semibold ${GOV_PARAMS_TABLE.mono}`}
                    data-tt-governance-params-fundraise-total="1"
                  >
                    {fundraiseTotalWan}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className={`mt-3 px-3 ${GOV_PARAMS_L5.metaNote}`} role="note">
            {t("governance_params_phase1_fundraise_planning_footnote", { total: fundraiseTotalWan })}
          </p>
        </div>
      </details>
    </div>
  );
}
