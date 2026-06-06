"use client";

import Link from "next/link";
import { useId } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS, protocolReferenceHasSubstance } from "@/lib/governanceParams84Readonly";
import { TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL , TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";
import { CHECKSUM_I18N_KEY } from "./governanceParamsPageModel";
import { useGovernanceParamsPage } from "./useGovernanceParamsPage";

/** 13-1 表 1：/governance/params；数据源自 84 文档镜像 API（非链上真值）。 */
export function GovernanceParamsPageMain() {
  const pageTitleId = useId();
  const diffSectionId = useId();
  const feeSplitSectionId = useId();
  const countriesSectionId = useId();
  const {
    t,
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
  } = useGovernanceParamsPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_4XL}`} data-tt-marketing-product-shell="1"
      aria-labelledby={pageTitleId}
      data-tt-governance-params-page="1"
    >
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_params_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_params_doc_notice")}</p>
      <div
        role="note"
        data-testid="governance-params-p553-data-scope"
        aria-label={t("governance_params_data_scope_title")}
        className="mt-4 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/80 p-4 text-small text-ink-800 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-100"
      >
        <p className="font-medium text-ink-900 dark:text-ink-50">{t("governance_params_data_scope_title")}</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>{t("governance_params_data_scope_bullet_api")}</li>
          <li>{t("governance_params_data_scope_bullet_not_sigma")}</li>
          <li>{t("governance_params_data_scope_bullet_not_pool")}</li>
        </ul>
      </div>
      <GovernanceTargetNotice className="mt-3" />
      {data?.doc_ref && (
        <p className="mt-1 font-mono text-meta text-ink-500">
          {data.doc_ref} · v{data.doc_version ?? dash}
        </p>
      )}
      {data?.note && <p className="mt-2 text-small text-warning dark:text-warning/90">{data.note}</p>}

      {loading ? (
        <section className="mt-8 space-y-3" aria-labelledby={diffSectionId}>
          <h2 id={diffSectionId} className="text-h4 font-medium text-ink-800">
            {t("governance_params_diff_section")}
          </h2>
          <LoadingText />
        </section>
      ) : null}
      {error ? (
        <section className="mt-6 space-y-3" aria-labelledby={diffSectionId}>
          <h2 id={diffSectionId} className="text-h4 font-medium text-ink-800">
            {t("governance_params_diff_section")}
          </h2>
          <ApiErrorAlert message={error} />
        </section>
      ) : null}

      {!loading && !error && data && !protocolReferenceHasSubstance(data) && (
        <section className="mt-8 space-y-2" aria-labelledby={diffSectionId}>
          <h2 id={diffSectionId} className="text-h4 font-medium text-ink-800">
            {t("governance_params_diff_section")}
          </h2>
          <p className="text-body text-warning dark:text-warning/95" role="alert">
            {t("governance_params_body_incomplete")}
          </p>
        </section>
      )}

      {!loading && !error && data && protocolReferenceHasSubstance(data) && (
        <>
          <section className="mt-8 overflow-x-auto" aria-labelledby={diffSectionId}>
            <h2 id={diffSectionId} className="text-h4 font-medium text-ink-800">
              {t("governance_params_diff_section")}
            </h2>
            <p className="mt-1 text-meta text-ink-500">{t("governance_params_data_scope_title")}</p>
            {pendingErr ? (
              <div className="mt-3">
                <ApiErrorAlert message={pendingErr} />
              </div>
            ) : pending === undefined ? (
              <p
                className="mt-3 text-ink-500 motion-sub motion-reduce:transition-none animate-pulse motion-reduce:animate-none"
                role="status"
                aria-live="polite"
              >
                {t("governance_params_diff_pending_loading")}
              </p>
            ) : diffRows == null ? (
              <p className="mt-3 text-body text-warning dark:text-warning/95" role="alert">
                {t("governance_params_body_incomplete")}
              </p>
            ) : (
              <>
                <p
                  className={`mt-2 text-small font-medium ${
                    allMatch ? "text-ink-600" : "text-warning dark:text-warning/90"
                  }`}
                >
                  {allMatch ? t("governance_params_diff_all_match") : t("governance_params_diff_some_mismatch")}
                </p>
                {pendingSource ? (
                  <p className="mt-1 text-meta text-ink-500">
                    {t("governance_params_diff_source_hint", { source: pendingSource })}
                  </p>
                ) : null}
                <table className="mt-3 w-full min-w-[520px] border-collapse text-left text-small">
                  <thead>
                    <tr className="border-b border-ink-200 text-ink-600">
                      <th className="py-2 pr-3 font-medium">{t("governance_params_diff_col_metric")}</th>
                      <th className="py-2 pr-3 font-medium">{t("governance_params_diff_col_current")}</th>
                      <th className="py-2 pr-3 font-medium">{t("governance_params_diff_col_pending")}</th>
                      <th className="py-2 font-medium">{t("governance_params_diff_col_match")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRows.map((row) => {
                      const match = row.cur === row.pen;
                      const bump = !match ? "bg-warning dark:bg-warning/25" : "";
                      return (
                        <tr key={row.id} className="border-b border-ink-100 text-ink-800">
                          <td className={`py-2 pr-3 ${bump}`}>{t(row.labelKey)}</td>
                          <td className={`py-2 pr-3 font-mono ${bump}`}>{row.cur}%</td>
                          <td className={`py-2 pr-3 font-mono ${bump}`}>{row.pen}%</td>
                          <td className={`py-2 ${bump}`}>
                            {match ? t("governance_params_diff_match_yes") : t("governance_params_diff_match_no")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </section>

          <section className="mt-8" aria-labelledby={feeSplitSectionId}>
            <h2 id={feeSplitSectionId} className="text-h4 font-medium text-ink-800">
              {t("governance_params_fee_split")}
            </h2>
            <p className="mt-1 text-meta text-ink-500">{t("governance_params_data_scope_title")}</p>
            {l1 && (
              <ul className="mt-2 list-disc pl-5 text-body text-ink-700">
                <li>
                  {t("governance_params_layer1_country")}
                  {t("market_fin_colon")}
                  {l1.country_bucket}%
                </li>
                <li>
                  {t("governance_params_layer1_global")}
                  {t("market_fin_colon")}
                  {l1.global_pool}%
                </li>
              </ul>
            )}
            {gsplit && (
              <ul className="mt-2 list-disc pl-5 text-body text-ink-700">
                <li>
                  TTG {t("governance_params_stakers")}
                  {t("market_fin_colon")}
                  {gsplit.ttg_stakers}%
                </li>
                <li>
                  {t("governance_params_reserve")}
                  {t("market_fin_colon")}
                  {gsplit.reserve}%
                </li>
                <li>
                  {t("governance_params_operations")}
                  {t("market_fin_colon")}
                  {gsplit.operations}%
                </li>
              </ul>
            )}
            {data.fee_router?.orthogonality_ref && (
              <p className="mt-2 text-small text-ink-600">{data.fee_router.orthogonality_ref}</p>
            )}
          </section>

          <section className="mt-10 overflow-x-auto" aria-labelledby={countriesSectionId}>
            <h2 id={countriesSectionId} className="text-h4 font-medium text-ink-800">
              {t("governance_params_phase1_countries")}
            </h2>
            <p className="mt-1 text-meta text-ink-500">{t("governance_params_data_scope_title")}</p>
            <table className="mt-3 w-full min-w-[640px] border-collapse text-left text-small">
              <thead>
                <tr className="border-b border-ink-200 text-ink-600">
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_country")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_tier")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_cap_pts")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_open_pts")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_target_wan")}</th>
                  <th className="py-2 pr-3 font-medium">{t("governance_params_col_cap_wan")}</th>
                  <th className="py-2 font-medium">{t("governance_params_col_notes")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.phase1_countries ?? []).map((row) => (
                  <tr key={row.name_zh} className="border-b border-ink-100 text-ink-800">
                    <td className="py-2 pr-3">{row.name_zh}</td>
                    <td className="py-2 pr-3">{row.tier}</td>
                    <td className="py-2 pr-3">{row.national_pool_cap_fee_points}</td>
                    <td className="py-2 pr-3">{row.phase1_open_fee_points}</td>
                    <td className="py-2 pr-3">{row.fundraise_target_cny_wan}</td>
                    <td className="py-2 pr-3">{row.fundraise_cap_cny_wan}</td>
                    <td className="py-2 text-ink-600">{row.notes ?? dash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.checksums && (
              <div className="mt-4 border-t border-ink-100 pt-3 dark:border-ink-800">
                <h3 className="text-small font-medium text-ink-800 dark:text-ink-100">
                  {t("governance_params_checksums_section")}
                </h3>
                <dl className="mt-2 space-y-2 text-small">
                  {PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS.map((key) => {
                    const raw = data.checksums![key];
                    if (raw === undefined) return null;
                    return (
                      <div
                        key={key}
                        className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline"
                      >
                        <dt className="text-ink-600 dark:text-ink-400">{t(CHECKSUM_I18N_KEY[key])}</dt>
                        <dd className="font-mono text-ink-900 dark:text-ink-100">{String(raw)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </section>
        </>
      )}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/vault-forwards"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_vault_forwards_title")}
        </Link>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link
          href="/traveltrust#fee-router"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("traveltrust_link_feeRouter")}
        </Link>
        <GovernanceOpsAdminLinks />
        <Link
          href="/help"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("help_title")}
        </Link>
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
