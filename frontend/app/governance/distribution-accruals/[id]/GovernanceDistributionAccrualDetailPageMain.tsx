"use client";

import { useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import { shortHexAddr } from "@/lib/feeRouterWiring";
import {TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL , TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";

import { useGovernanceDistributionAccrualDetailPage } from "./useGovernanceDistributionAccrualDetailPage";

export function GovernanceDistributionAccrualDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { rawId, validUuid, detail, lines, loading, error, load, sourceLabel, bindingJson } =
    useGovernanceDistributionAccrualDetailPage();

  return (
    <main className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_5XL}`} data-tt-marketing-product-shell="1" data-tt-governance-distribution-accrual-detail-page="1">
      <GovernanceTargetNotice className="mb-6" />
      <p className="text-meta text-ink-600">
        <Link
          href="/governance/distribution-accruals"
          className={`${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_distribution_accruals_back_list")}
        </Link>
      </p>
      <h1 id={pageTitleId} className="mt-4 text-h3 font-semibold text-ink-900">
        {t("governance_distribution_accruals_detail_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-700">{t("governance_distribution_accruals_desc")}</p>
      <p className="mt-2 font-mono text-meta text-ink-700 break-all">{rawId || "—"}</p>
      <p className="mt-1 text-meta text-ink-600">{sourceLabel}</p>

      <div className="mt-4 max-w-3xl">
        <InlineTransparencyVerification context="yield" surface="ink" verificationKey={rawId ?? ""} />
      </div>

      {!validUuid ? (
        <p className="mt-6 text-body text-ink-700">{t("governance_distribution_accruals_invalid_id")}</p>
      ) : null}

      {validUuid && error ? (
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

      {validUuid && loading ? (
        <p className="mt-6 text-meta text-ink-500">{t("common_loading")}</p>
      ) : null}

      {validUuid && !loading && !error && detail ? (
        <>
          <dl className="mt-6 grid gap-2 text-small sm:grid-cols-2">
            <div>
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_chain")}</dt>
              <dd>{detail.chain_id}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_snapshot")}</dt>
              <dd>{detail.snapshot_block_number}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_token")}</dt>
              <dd className="break-all font-mono">{detail.token_address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_total_cash")}</dt>
              <dd className="break-all font-mono">{detail.total_cash_u256_hex}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("governance_distribution_accruals_col_created")}</dt>
              <dd>{detail.created_at}</dd>
            </div>
          </dl>

          <h2 className="mt-8 text-h4 font-medium text-ink-900">{t("governance_distribution_accruals_lines_title")}</h2>
          {lines.length === 0 ? (
            <p className="mt-2 text-body text-ink-600">{t("governance_distribution_accruals_empty")}</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
              <table className="min-w-full border-collapse text-left text-small">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_holder")}</th>
                    <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_balance_snap")}</th>
                    <th className="px-3 py-2 font-medium">{t("governance_distribution_accruals_col_accrual")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {lines.map((line) => (
                    <tr key={`${line.holder_address}-${line.accrual_u256_hex}`}>
                      <td className="px-3 py-2 font-mono" title={line.holder_address}>
                        {shortHexAddr(line.holder_address)}
                      </td>
                      <td className="px-3 py-2 font-mono" title={line.balance_snapshot_u256_hex}>
                        {shortHexAddr(line.balance_snapshot_u256_hex, 6, 4)}
                      </td>
                      <td className="px-3 py-2 font-mono" title={line.accrual_u256_hex}>
                        {shortHexAddr(line.accrual_u256_hex, 6, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bindingJson ? (
            <section className="mt-8">
              <h2 className="text-h4 font-medium text-ink-900">{t("governance_distribution_accruals_snapshot_binding")}</h2>
              <pre className="mt-2 max-h-96 overflow-auto rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 p-3 text-meta font-mono whitespace-pre-wrap break-all">
                {bindingJson}
              </pre>
            </section>
          ) : null}
        </>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
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
        <GovernanceOpsAdminLinks />
        <Link href="/help" className={`${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS} inline-flex min-h-[44px] items-center`}>
          {t("help_title")}
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
