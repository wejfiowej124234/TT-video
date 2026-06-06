"use client";

import { type FormEvent, useId } from "react";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import {TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL, TT_MARKETING_FILTER_TAB_SELECTED} from "@/lib/marketingUi";
import { useGovernanceFeeRoutesPage } from "./useGovernanceFeeRoutesPage";
import { GovernanceFeeRoutesEventsTable } from "./GovernanceFeeRoutesEventsTable";
import { GovernanceFeeRoutesLoadMoreSection } from "./GovernanceFeeRoutesLoadMoreSection";
import { GovernanceFeeRoutesPageFooterNav } from "./GovernanceFeeRoutesPageFooterNav";

export function GovernanceFeeRoutesPageMain() {
  const pageTitleId = useId();
  const governanceFeeRoutesLoadMoreHintId = useId();
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
    metaFeeRouterRaw,
    metaContractsLoaded,
    buildTimeFeeRouter,
    feeRouterEnvMetaMismatch,
    onLoadMore,
  } = useGovernanceFeeRoutesPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_6XL}`} data-tt-marketing-product-shell="1"
      aria-labelledby={pageTitleId}
      data-tt-governance-fee-routes-page="1"
    >
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_fee_routes_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-600">{t("governance_fee_routes_desc")}</p>
      <GovernanceTargetNotice className="mt-3 max-w-3xl" />

      {metaReady && metaHttpError ? (
        <p className="mt-4 text-body text-danger" role="alert">
          {metaHttpError}
        </p>
      ) : null}

      {metaReady && !metaHttpError && (
        <section
          className="mt-4 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/60 p-4 text-small"
          aria-label={t("governance_fee_routes_wiring_title")}
        >
          <h2 className="text-body font-semibold text-ink-900">{t("governance_fee_routes_wiring_title")}</h2>
          <p className="mt-1 text-meta text-ink-600">{t("governance_fee_routes_wiring_lead")}</p>
          <dl className="mt-3 space-y-2 text-ink-800">
            <div>
              <dt className="text-meta font-medium text-ink-600">{t("governance_fee_routes_wiring_api")}</dt>
              <dd className="mt-0.5 break-all font-mono text-meta">
                {!metaContractsLoaded
                  ? t("governance_fee_routes_wiring_contracts_absent")
                  : metaFeeRouterRaw || t("governance_fee_routes_wiring_none")}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-medium text-ink-600">{t("governance_fee_routes_wiring_build")}</dt>
              <dd className="mt-0.5 break-all font-mono text-meta">
                {buildTimeFeeRouter ?? t("governance_fee_routes_wiring_none")}
              </dd>
            </div>
          </dl>
          {feeRouterEnvMetaMismatch ? (
            <p
              className="mt-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-3 py-2 text-meta text-ink-800"
              role="status"
            >
              {t("governance_fee_routes_wiring_mismatch")}
            </p>
          ) : null}
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
        <p className="mt-6 text-body text-ink-500">{t("governance_fee_routes_empty")}</p>
      )}

      {!loading && items.length > 0 && <GovernanceFeeRoutesEventsTable items={items} t={t} />}

      <GovernanceFeeRoutesLoadMoreSection
        hasMore={hasMore}
        nextCursor={nextCursor}
        loadMoreError={loadMoreError}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        setLoadMoreError={setLoadMoreError}
        governanceFeeRoutesLoadMoreHintId={governanceFeeRoutesLoadMoreHintId}
        t={t}
      />

      <GovernanceFeeRoutesPageFooterNav t={t} />
    </main>
  );
}
