"use client";

import { type FormEvent, useId } from "react";
import Link from "next/link";
import { shortHexAddr } from "@/lib/feeRouterWiring";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL , TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_FILTER_TAB_SELECTED, TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_BTN_WARM_OUTLINE_COMPACT, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";
import { useGovernanceVaultForwardsPage } from "./useGovernanceVaultForwardsPage";

export function GovernanceVaultForwardsPageMain() {
  const pageTitleId = useId();
  const governanceVaultForwardsLoadMoreHintId = useId();
  const {
    t,
    items,
    nextCursor,
    hasMore,
    note,
    loading,
    loadingMore,
    error,
    loadMoreError,
    setLoadMoreError,
    metaReady,
    metaHttpError,
    configuredChainId,
    scopeMetaChain,
    setScopeMetaChain,
    metaVaultRaw,
    metaContractsLoaded,
    onLoadMore,
  } = useGovernanceVaultForwardsPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_6XL}`} data-tt-marketing-product-shell="1"
      aria-labelledby={pageTitleId}
      data-tt-governance-vault-forwards-page="1"
    >
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_vault_forwards_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-600">{t("governance_vault_forwards_desc")}</p>
      <GovernanceTargetNotice className="mt-3 max-w-3xl" />

      {metaReady && metaHttpError ? (
        <p className="mt-4 text-body text-danger" role="alert">
          {metaHttpError}
        </p>
      ) : null}

      {metaReady && !metaHttpError && (
        <section
          className="mt-4 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/60 p-4 text-small"
          aria-label={t("governance_vault_forwards_wiring_title")}
        >
          <h2 className="text-body font-semibold text-ink-900">{t("governance_vault_forwards_wiring_title")}</h2>
          <p className="mt-1 text-meta text-ink-600">{t("governance_vault_forwards_wiring_lead")}</p>
          <dl className="mt-3 space-y-2 text-ink-800">
            <div>
              <dt className="text-meta font-medium text-ink-600">{t("governance_vault_forwards_wiring_api")}</dt>
              <dd className="mt-0.5 break-all font-mono text-meta">
                {!metaContractsLoaded
                  ? t("governance_fee_routes_wiring_contracts_absent")
                  : metaVaultRaw || t("governance_fee_routes_wiring_none")}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {metaReady && !metaHttpError && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("governance_fee_routes_filter_group")}>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setScopeMetaChain(true);
            }}
          >
            <button
              type="submit"
              disabled={configuredChainId == null}
              className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-small font-medium transition ${
                scopeMetaChain && configuredChainId != null
                  ? {TT_MARKETING_FILTER_TAB_SELECTED}
                  : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              {configuredChainId != null
                ? t("governance_fee_routes_filter_meta").replace("{{id}}", String(configuredChainId))
                : t("governance_fee_routes_filter_meta_unknown")}
            </button>
          </form>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setScopeMetaChain(false);
            }}
          >
            <button
              type="submit"
              className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-small font-medium transition ${
                !scopeMetaChain || configuredChainId == null
                  ? {TT_MARKETING_FILTER_TAB_SELECTED}
                  : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              }`}
            >
              {t("governance_fee_routes_filter_all")}
            </button>
          </form>
        </div>
      )}

      {loading && (
        <p className="mt-4 text-body text-ink-500" role="status">
          {t("common_loading")}
        </p>
      )}
      {error && (
        <p className="mt-4 text-body text-danger" role="alert">
          {error}
        </p>
      )}
      {note && !loading && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 px-3 py-2 text-small text-ink-800">
          {t("governance_fee_routes_note_prefix")} {note}
        </p>
      )}

      {!loading && !error && items.length === 0 && !note && (
        <p className="mt-6 text-body text-ink-500">{t("governance_vault_forwards_empty")}</p>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
          <table className="min-w-full border-collapse text-left text-small">
            <thead className="bg-ink-50 text-meta font-medium uppercase tracking-wide text-ink-600">
              <tr>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_block")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_tx")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_vault_forwards_col_vault")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_token")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_vault_forwards_col_to")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 font-mono text-meta text-ink-800">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="whitespace-nowrap px-3 py-2" title={`#${row.block_number} log ${row.log_index}`}>
                    {row.block_number}
                    <span className="text-ink-500">:{row.log_index}</span>
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.tx_hash}>
                    {shortHexAddr(row.tx_hash)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.vault_address}>
                    {shortHexAddr(row.vault_address)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.token_address}>
                    {shortHexAddr(row.token_address)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.to_address}>
                    {shortHexAddr(row.to_address)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.amount_u256_hex}>
                    {shortHexAddr(row.amount_u256_hex, 4, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && nextCursor && (
        <div className="mt-6">
          {loadMoreError ? (
            <div className="mb-4 max-w-2xl space-y-2" role="alert" aria-live="polite">
              <ApiErrorAlert message={loadMoreError} />
              <div className="flex flex-wrap gap-2">
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (loadingMore) return;
                    onLoadMore();
                  }}
                >
                  <button
                    type="submit"
                    disabled={loadingMore}
                    aria-busy={loadingMore ? true : undefined}
                    aria-label={t("common_retry")}
                    className={`${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-3 py-2 focus-visible:ring-offset-bg-main`}
                  >
                    {loadingMore ? t("common_retrying") : t("common_retry")}
                  </button>
                </form>
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    setLoadMoreError(null);
                  }}
                >
                  <button
                    type="submit"
                    className={`${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} text-meta focus-visible:ring-offset-bg-main`}
                    aria-label={t("common_closeAlert")}
                  >
                    {t("common_closeAlert")}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
          <p id={governanceVaultForwardsLoadMoreHintId} className="mb-2 max-w-2xl text-meta text-ink-600">
            {t("governance_public_load_more_hint")}
          </p>
          <form
            className="inline"
            aria-describedby={governanceVaultForwardsLoadMoreHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onLoadMore();
            }}
          >
            <button
              type="submit"
              className={`${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-bg-main`}
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
            >
              {loadingMore ? t("common_loading") : t("governance_fee_routes_load_more")}
            </button>
          </form>
        </div>
      )}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/params"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_params_title")}
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
        <Link
          href="/"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_backHome")}
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
