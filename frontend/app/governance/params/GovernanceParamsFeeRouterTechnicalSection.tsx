"use client";



import Link from "next/link";

import ApiErrorAlert from "@/components/ApiErrorAlert";

import { GOV_PARAMS_L5, GOV_PARAMS_TABLE } from "@/lib/governance/governanceParamsPageL5";

import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

import { GovernanceParamsPercentBar, GovernanceParamsRetryButton } from "@/lib/governance/governanceParamsPageL5Ui";

import type { FeeMetricDiffRow, ProtocolRef84Mirror } from "@/lib/governanceParams84Readonly";



export function GovernanceParamsFeeRouterTechnicalSection({

  t,

  diffSectionId,

  feeSplitSectionId,

  diffTableCaptionId,

  l1,

  diffRows,

  allMatch,

  pending,

  pendingErr,

  pendingUnavailable = false,

  retryAll,

  retryPending,

}: {

  t: (key: string) => string;

  diffSectionId: string;

  feeSplitSectionId: string;

  diffTableCaptionId: string;

  l1?: { country_bucket: number; global_pool: number };

  diffRows: FeeMetricDiffRow[] | null;

  allMatch: boolean;

  pending: ProtocolRef84Mirror | null | undefined;

  pendingErr: string | null;

  pendingUnavailable?: boolean;

  retryAll: () => void;

  retryPending: () => void;

}) {

  return (

    <div className="space-y-6">

      <section id="gov-params-fee-split" className="scroll-mt-24" data-tt-governance-params-fee-split-track="d4555-a">

        <p className={GOV_PARAMS_LAYOUT.blockKicker}>{t("governance_params_fee_routing_technical_kicker")}</p>

        <h3 className={`mt-1 ${GOV_PARAMS_LAYOUT.blockTitle}`}>{t("governance_params_fee_split_lead_short")}</h3>

        <p className={GOV_PARAMS_LAYOUT.blockLead}>{t("governance_params_fee_split_technical_note")}</p>

        {l1 ? (

          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            <GovernanceParamsPercentBar label={t("governance_params_layer1_country")} value={l1.country_bucket} />

            <GovernanceParamsPercentBar label={t("governance_params_layer1_global")} value={l1.global_pool} />

          </div>

        ) : null}

      </section>



      <section id="gov-params-diff" className="scroll-mt-24 border-t border-white/10 pt-5">

        <h3 className={GOV_PARAMS_LAYOUT.blockTitle}>{t("governance_params_diff_section_short")}</h3>

        <p className={GOV_PARAMS_LAYOUT.blockLead}>{t("governance_params_diff_section_lead_short")}</p>

        {pending === undefined ? (

          <p className={`mt-3 ${GOV_PARAMS_L5.loadingPanel}`}>{t("governance_params_diff_pending_loading")}</p>

        ) : null}

        {pendingUnavailable ? (

          <p className={`mt-3 ${GOV_PARAMS_LAYOUT.footnote}`} role="status">

            {t("governance_params_diff_pending_mirror_note")}

          </p>

        ) : null}

        {!pendingUnavailable && pendingErr ? (

          <div className="mt-3 space-y-2">

            <ApiErrorAlert message={pendingErr} />

            <GovernanceParamsRetryButton label={t("governance_params_retry_pending")} onClick={retryPending} />

          </div>

        ) : null}

        {diffRows && diffRows.length > 0 ? (

          <div className={`mt-4 ${GOV_PARAMS_LAYOUT.tableWrap}`}>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[480px] text-left text-small">

                <caption id={diffTableCaptionId} className="sr-only">

                  {t("governance_params_diff_section")}

                </caption>

                <thead>

                  <tr className={GOV_PARAMS_TABLE.headRow}>

                    <th className="px-4 py-2.5">{t("governance_params_diff_col_metric")}</th>

                    <th className="px-4 py-2.5">{t("governance_params_diff_col_current")}</th>

                    <th className="px-4 py-2.5">{t("governance_params_diff_col_pending")}</th>

                  </tr>

                </thead>

                <tbody>

                  {diffRows.map((row) => (

                    <tr key={row.id} className={GOV_PARAMS_TABLE.bodyRow}>

                      <td className="px-4 py-2.5">{t(row.labelKey)}</td>

                      <td className={`px-4 py-2.5 ${GOV_PARAMS_TABLE.mono}`}>{row.cur}</td>

                      <td className={`px-4 py-2.5 ${GOV_PARAMS_TABLE.mono}`}>{row.pen}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        ) : null}

        {allMatch ? (

          <p className={`mt-3 ${GOV_PARAMS_L5.mutedNote}`} role="status">

            {t("governance_params_match_customer_ok")}

          </p>

        ) : !pendingUnavailable ? (

          <p className={`mt-3 ${GOV_PARAMS_L5.mutedNote}`}>

            <Link href="/governance/proposals" className={GOV_PARAMS_L5.inlineLink}>

              {t("governance_params_mismatch_cta_proposals")}

            </Link>

          </p>

        ) : null}

        {!allMatch && pending === null && !pendingErr && !pendingUnavailable ? (

          <GovernanceParamsRetryButton label={t("governance_params_retry_load")} onClick={retryAll} className="mt-3" />

        ) : null}

      </section>

    </div>

  );

}

