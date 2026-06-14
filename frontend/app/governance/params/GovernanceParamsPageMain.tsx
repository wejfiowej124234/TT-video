"use client";

import Link from "next/link";
import { Suspense, useId } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { GovernanceParamsL5Shell } from "@/components/governance/GovernanceParamsL5Shell";
import { GovernanceProposalsPageHeader } from "@/components/governance/GovernanceProposalsPageHeader";
import { resolvePhase1CountryDisplay } from "@/lib/governance/governanceParamsCountryDisplay";
import { PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS, protocolReferenceHasSubstance } from "@/lib/governanceParams84Readonly";
import {
  GOV_PARAMS_L5,
  GOV_PARAMS_TABLE,
  GovernanceParamsL5Panel,
} from "@/lib/governance/governanceParamsPageL5";
import {
  GovernanceParamsChecksumDetails,
  GovernanceParamsPercentBar,
  GovernanceParamsRetryButton,
  GovernanceParamsSectionNav,
  GovernanceParamsTechnicalDetails,
} from "@/lib/governance/governanceParamsPageL5Ui";
import { GovernanceParamsPageFooterNav } from "./GovernanceParamsPageFooterNav";
import { GovernanceParamsParticipatePanel } from "./GovernanceParamsParticipatePanel";
import { GovernanceParamsQueryProvider } from "./GovernanceParamsQueryProvider";
import { GovernanceParamsStewardBackLink } from "./GovernanceParamsStewardBackLink";
import { CHECKSUM_I18N_KEY } from "./governanceParamsPageModel";
import { useGovernanceParamsPage } from "./useGovernanceParamsPage";

/** 13-1 表 1：/governance/params；C-GOV-011 · 84 文档镜像只读 · L5 冻结。 */
export function GovernanceParamsPageMain() {
  return (
    <Suspense fallback={null}>
      <GovernanceParamsQueryProvider>
        <GovernanceParamsPageMainBody />
      </GovernanceParamsQueryProvider>
    </Suspense>
  );
}

function GovernanceParamsPageMainBody() {
  const pageTitleId = useId();
  const diffSectionId = useId();
  const feeSplitSectionId = useId();
  const countriesSectionId = useId();
  const diffTableCaptionId = useId();
  const countriesTableCaptionId = useId();
  const {
    t,
    locale,
    dash,
    loading,
    error,
    data,
    pending,
    pendingErr,
    l1,
    gsplit,
    diffRows,
    allMatch,
    pendingSource,
    retryAll,
    retryPending,
  } = useGovernanceParamsPage();

  const showSectionNav = !loading && !error && data && protocolReferenceHasSubstance(data);

  return (
    <GovernanceParamsL5Shell ariaLabelledBy={pageTitleId}>
      <GovernanceParamsStewardBackLink t={t} />

      <GovernanceProposalsPageHeader
        pageTitleId={pageTitleId}
        kicker={t("governance_params_l5_kicker")}
        title={t("governance_params_title")}
        lead={t("governance_params_lead")}
      />

      <GovernanceParamsParticipatePanel t={t} className="mt-4" />

      <GovernanceParamsL5Panel className="mt-4">
        <p className={GOV_PARAMS_L5.sectionHeading}>{t("governance_params_data_scope_title")}</p>
        <ul className={`mt-3 list-disc space-y-2 pl-5 ${GOV_PARAMS_L5.cardHint}`} role="list">
          <li>{t("governance_params_data_scope_bullet_customer")}</li>
          <li>{t("governance_params_data_scope_bullet_not_wallet")}</li>
        </ul>
        <div
          role="note"
          data-testid="governance-params-p553-data-scope"
          aria-label={t("governance_params_data_scope_title")}
          className="sr-only"
        >
          {t("governance_params_data_scope_bullet_customer")}
        </div>
      </GovernanceParamsL5Panel>

      <p className={`mt-4 ${GOV_PARAMS_L5.noticeSoft}`} role="note" data-tt-governance-params-page-notice="1">
        {t("governance_params_page_notice")}
      </p>

      <GovernanceParamsTechnicalDetails t={t} className="mt-4">
        <p className={`${GOV_PARAMS_L5.mutedNote} mb-3`}>{t("governance_params_doc_notice")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("governance_params_data_scope_bullet_api")}</li>
          <li>{t("governance_params_data_scope_bullet_not_sigma")}</li>
          <li>{t("governance_params_data_scope_bullet_not_pool")}</li>
        </ul>
        {data?.doc_ref ? (
          <p className={`mt-3 font-mono ${GOV_PARAMS_L5.metaNote}`}>
            {data.doc_ref} · v{data.doc_version ?? dash}
          </p>
        ) : null}
        {pendingSource ? (
          <p className={`mt-2 ${GOV_PARAMS_L5.metaNote}`}>
            {t("governance_params_diff_source_hint", { source: pendingSource })}
          </p>
        ) : null}
        {data?.note ? (
          <p className={`mt-3 ${GOV_PARAMS_L5.metaNote}`} role="note">
            {data.note}
          </p>
        ) : null}
      </GovernanceParamsTechnicalDetails>

      {showSectionNav ? <GovernanceParamsSectionNav t={t} className="mt-6" /> : null}

      {loading ? (
        <GovernanceParamsL5Panel className="mt-6">
          <h2 id={diffSectionId} className={GOV_PARAMS_L5.sectionHeading}>
            {t("governance_params_diff_section")}
          </h2>
          <div className={`mt-4 ${GOV_PARAMS_L5.loadingPanel}`}>
            <LoadingText />
          </div>
        </GovernanceParamsL5Panel>
      ) : null}

      {error ? (
        <GovernanceParamsL5Panel className="mt-6">
          <h2 id={diffSectionId} className={GOV_PARAMS_L5.sectionHeading}>
            {t("governance_params_diff_section")}
          </h2>
          <div className="mt-4 space-y-3">
            <ApiErrorAlert message={error} />
            <GovernanceParamsRetryButton label={t("governance_params_retry_load")} onClick={retryAll} />
          </div>
        </GovernanceParamsL5Panel>
      ) : null}

      {!loading && !error && data && !protocolReferenceHasSubstance(data) && (
        <GovernanceParamsL5Panel className="mt-6">
          <h2 id={diffSectionId} className={GOV_PARAMS_L5.sectionHeading}>
            {t("governance_params_diff_section")}
          </h2>
          <p className={`mt-3 ${GOV_PARAMS_L5.filterEmptyPanel}`} role="alert">
            {t("governance_params_body_incomplete")}
          </p>
          <GovernanceParamsRetryButton label={t("governance_params_retry_load")} onClick={retryAll} className="mt-3" />
        </GovernanceParamsL5Panel>
      )}

      {!loading && !error && data && protocolReferenceHasSubstance(data) && (
        <>
          <div id="gov-params-diff">
            <GovernanceParamsL5Panel className="mt-6">
              <h2 id={diffSectionId} className={GOV_PARAMS_L5.sectionHeading}>
                {t("governance_params_diff_section")}
              </h2>
              <p className={`mt-2 ${GOV_PARAMS_L5.metaNote}`}>{t("governance_params_diff_section_lead")}</p>
              {pendingErr ? (
                <div className="mt-4 space-y-3" role="alert">
                  <ApiErrorAlert message={pendingErr} />
                  <GovernanceParamsRetryButton label={t("governance_params_retry_pending")} onClick={retryPending} />
                </div>
              ) : pending === undefined ? (
                <p
                  className={`mt-4 ${GOV_PARAMS_L5.metaNote} animate-pulse motion-reduce:animate-none`}
                  role="status"
                  aria-live="polite"
                >
                  {t("governance_params_diff_pending_loading")}
                </p>
              ) : diffRows == null ? (
                <div className="mt-4 space-y-3" role="alert">
                  <p className={GOV_PARAMS_L5.filterEmptyPanel}>{t("governance_params_body_incomplete")}</p>
                  <GovernanceParamsRetryButton label={t("governance_params_retry_load")} onClick={retryAll} />
                </div>
              ) : (
                <>
                  <p
                    className={`mt-3 text-small font-medium ${
                      allMatch ? GOV_PARAMS_L5.cardHint : "text-ref-sun/95"
                    }`}
                    role="status"
                  >
                    {allMatch ? t("governance_params_diff_all_match") : t("governance_params_diff_some_mismatch")}
                  </p>
                  {allMatch ? (
                    <p className={`mt-3 ${GOV_PARAMS_L5.noticeSoft}`} role="status">
                      {t("governance_params_match_customer_ok")}
                    </p>
                  ) : (
                    <p className="mt-3">
                      <Link href="/governance/proposals" className={GOV_PARAMS_L5.cardCta}>
                        {t("governance_params_mismatch_cta_proposals")}
                      </Link>
                    </p>
                  )}
                  <div className="mt-4 overflow-x-auto">
                    <table
                      className="w-full min-w-[520px] border-collapse text-left text-small"
                      aria-labelledby={diffTableCaptionId}
                    >
                      <caption id={diffTableCaptionId} className="sr-only">
                        {t("governance_params_diff_section")}
                      </caption>
                      <thead>
                        <tr className={GOV_PARAMS_TABLE.headRow}>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            {t("governance_params_diff_col_metric")}
                          </th>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            {t("governance_params_diff_col_current")}
                          </th>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            {t("governance_params_diff_col_pending")}
                          </th>
                          <th scope="col" className="py-2 font-medium">
                            {t("governance_params_diff_col_match")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffRows.map((row) => {
                          const match = row.cur === row.pen;
                          const bump = !match ? GOV_PARAMS_TABLE.bumpCell : "";
                          return (
                            <tr key={row.id} className={GOV_PARAMS_TABLE.bodyRow}>
                              <th scope="row" className={`py-2 pr-3 text-left font-normal ${bump}`}>
                                {t(row.labelKey)}
                              </th>
                              <td className={`py-2 pr-3 ${GOV_PARAMS_TABLE.mono} ${bump}`}>{row.cur}%</td>
                              <td className={`py-2 pr-3 ${GOV_PARAMS_TABLE.mono} ${bump}`}>{row.pen}%</td>
                              <td className={`py-2 ${bump}`}>
                                {match ? t("governance_params_diff_match_yes") : t("governance_params_diff_match_no")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </GovernanceParamsL5Panel>
          </div>

          <div id="gov-params-fee-split">
            <GovernanceParamsL5Panel className="mt-6">
              <h2 id={feeSplitSectionId} className={GOV_PARAMS_L5.sectionHeading}>
                {t("governance_params_fee_split")}
              </h2>
              <p className={`mt-2 ${GOV_PARAMS_L5.metaNote}`}>{t("governance_params_fee_split_lead")}</p>
              {l1 ? (
                <div className="mt-5 space-y-4">
                  <GovernanceParamsPercentBar
                    label={t("governance_params_layer1_country")}
                    value={l1.country_bucket}
                  />
                  <GovernanceParamsPercentBar label={t("governance_params_layer1_global")} value={l1.global_pool} />
                </div>
              ) : null}
              {gsplit ? (
                <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                  <p className={GOV_PARAMS_L5.mutedNote}>{t("governance_params_fee_split_global_lead")}</p>
                  <GovernanceParamsPercentBar
                    label={`TTG ${t("governance_params_stakers")}`}
                    value={gsplit.ttg_stakers}
                  />
                  <GovernanceParamsPercentBar label={t("governance_params_reserve")} value={gsplit.reserve} />
                  <GovernanceParamsPercentBar label={t("governance_params_operations")} value={gsplit.operations} />
                </div>
              ) : null}
            </GovernanceParamsL5Panel>
          </div>

          <div id="gov-params-countries">
            <GovernanceParamsL5Panel className="mt-6">
              <h2 id={countriesSectionId} className={GOV_PARAMS_L5.sectionHeading}>
                {t("governance_params_phase1_countries")}
              </h2>
              <p className={`mt-2 ${GOV_PARAMS_L5.metaNote}`}>{t("governance_params_phase1_lead")}</p>
              <div className="mt-4 overflow-x-auto">
                <table
                  className="w-full min-w-[640px] border-collapse text-left text-small"
                  aria-labelledby={countriesTableCaptionId}
                >
                  <caption id={countriesTableCaptionId} className="sr-only">
                    {t("governance_params_phase1_countries")}
                  </caption>
                  <thead>
                    <tr className={GOV_PARAMS_TABLE.headRow}>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t("governance_params_col_country")}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t("governance_params_col_tier")}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t("governance_params_col_cap_pts")}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t("governance_params_col_open_pts")}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t("governance_params_col_target_wan")}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t("governance_params_col_cap_wan")}
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        {t("governance_params_col_notes")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.phase1_countries ?? []).map((row) => {
                      const display = resolvePhase1CountryDisplay(row, locale);
                      return (
                        <tr key={row.name_zh} className={GOV_PARAMS_TABLE.bodyRow}>
                          <th scope="row" className="py-2 pr-3 text-left font-normal">
                            {display.name}
                          </th>
                          <td className="py-2 pr-3">{row.tier}</td>
                          <td className={`py-2 pr-3 ${GOV_PARAMS_TABLE.mono}`}>{row.national_pool_cap_fee_points}</td>
                          <td className={`py-2 pr-3 ${GOV_PARAMS_TABLE.mono}`}>{row.phase1_open_fee_points}</td>
                          <td className={`py-2 pr-3 ${GOV_PARAMS_TABLE.mono}`}>{row.fundraise_target_cny_wan}</td>
                          <td className={`py-2 pr-3 ${GOV_PARAMS_TABLE.mono}`}>{row.fundraise_cap_cny_wan}</td>
                          <td className={`py-2 ${GOV_PARAMS_L5.metaNote}`}>{display.notes ?? dash}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.checksums ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className={GOV_PARAMS_L5.cardHint}>{t("governance_params_phase1_checksum_lead")}</p>
                  <GovernanceParamsChecksumDetails t={t} className="mt-3">
                    <dl className="space-y-2 text-small">
                      {PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS.map((key) => {
                        const raw = data.checksums![key];
                        if (raw === undefined) return null;
                        return (
                          <div
                            key={key}
                            className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline"
                          >
                            <dt className={GOV_PARAMS_L5.metaNote}>{t(CHECKSUM_I18N_KEY[key])}</dt>
                            <dd className={`${GOV_PARAMS_TABLE.mono} text-right sm:text-left`}>{String(raw)}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  </GovernanceParamsChecksumDetails>
                </div>
              ) : null}
            </GovernanceParamsL5Panel>
          </div>
        </>
      )}

      <GovernanceParamsPageFooterNav t={t} />
    </GovernanceParamsL5Shell>
  );
}
