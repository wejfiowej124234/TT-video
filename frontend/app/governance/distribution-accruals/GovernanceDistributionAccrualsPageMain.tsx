"use client";

import { useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { shortHexAddr } from "@/lib/feeRouterWiring";
import {TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL , TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";

import { useGovernanceDistributionAccrualsPage } from "./useGovernanceDistributionAccrualsPage";

export function GovernanceDistributionAccrualsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { rows, dataSource, note, loading, error, load, sourceLabel } = useGovernanceDistributionAccrualsPage();

  return (
    <main className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_5XL}`} data-tt-marketing-product-shell="1" data-tt-governance-distribution-accruals-page="1">
      <GovernanceTargetNotice className="mb-6" />
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_distribution_accruals_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-700">{t("governance_distribution_accruals_desc")}</p>
      <p className="mt-2 text-meta text-ink-600">{sourceLabel}</p>
      {dataSource === "placeholder" && note ? (
        <p className="mt-1 text-meta text-ink-500">
          {note} — {t("governance_distribution_accruals_placeholder_note")}
        </p>
      ) : null}

      {error ? (
        <div className="mt-4">
          <ApiErrorAlert message={error} />
          <button
            type="button"
            className={`mt-3 ${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-3 py-2 focus-visible:ring-offset-bg-main`}
            onClick={() => void load()}
          >
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-meta text-ink-500">{t("common_loading")}</p>
      ) : !error && rows.length === 0 ? (
        <p className="mt-6 text-body text-ink-600">{t("governance_distribution_accruals_empty")}</p>
      ) : !error ? (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
          <table className="min-w-full border-collapse text-left text-small">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_id")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_chain")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_token")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_snapshot")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_created")}</th>
                <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_total_cash")}</th>
                <th className="px-3 py-2 font-medium" aria-label={t("governance_distribution_accruals_view_detail")}>
                  <span className="sr-only">{t("governance_distribution_accruals_view_detail")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-mono text-meta break-all max-w-[14rem]">{row.id}</td>
                  <td className="px-3 py-2">{row.chain_id}</td>
                  <td className="px-3 py-2 font-mono" title={row.token_address}>
                    {shortHexAddr(row.token_address)}
                  </td>
                  <td className="px-3 py-2">{row.snapshot_block_number}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.created_at}</td>
                  <td className="px-3 py-2 font-mono" title={row.total_cash_u256_hex}>
                    {shortHexAddr(row.total_cash_u256_hex, 6, 4)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/governance/distribution-accruals/${row.id}`}
                      className={`${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
                    >
                      {t("governance_distribution_accruals_view_detail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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
          href="/governance/vault-forwards"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_vault_forwards_title")}
        </Link>
        <Link
          href="/governance/distribution-claim"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_claim_title")}
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
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
