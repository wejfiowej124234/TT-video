"use client";

import { useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { GovernanceHubPoolSection } from "./GovernanceHubPoolSection";
import { GovernanceHubRewardsSection } from "./GovernanceHubRewardsSection";
import { useGovernanceHubPage } from "./useGovernanceHubPage";
import { ConversionFunnelRail } from "@/components/product-enhancement/ConversionFunnelRail";
import {
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_GOVERNANCE_INNER_3XL,
  TT_MARKETING_GOVERNANCE_PAGE_SHELL,
} from "@/lib/marketingUi";

export function GovernanceHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { pool, rewards, poolHttpError, rewardsHttpError, loading, error } = useGovernanceHubPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_3XL}`}
      aria-labelledby={pageTitleId}
      data-tt-governance-hub-page="1"
      data-tt-marketing-product-shell="1"
      data-tt-ui-generation="v2"
    >
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_desc")}</p>
      <ConversionFunnelRail touchpoint="governance" t={t} variant="light" className="mt-4" />
      <div className="mt-4">
        <TrustGrowthMomentBanner moment="governance_entry" surface="ink" />
      </div>
      <GovernanceTargetNotice />
      <p
        className="mt-4 rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50/60 px-3 py-2 text-meta text-ink-700 dark:border-ink-600/40 dark:bg-ink-900/25 dark:text-ink-200"
        role="note"
        data-tt-governance-hub-params-pointer="1"
      >
        {t("governance_hub_params_pointer")}
      </p>
      <p
        className="mt-4 rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50/60 px-3 py-2 text-meta text-ink-700 dark:border-ink-600/40 dark:bg-ink-900/25 dark:text-ink-200"
        role="note"
      >
        {t("governance_b428_closeloop_doc_pointer")}
      </p>

      {loading && (
        <p className="mt-4 text-body text-ink-500" role="status">
          {t("common_loading")}
        </p>
      )}
      {error ? (
        <div className="mt-4">
          <ApiErrorAlert message={error} />
        </div>
      ) : null}
      {!loading && !error && (
        <section className="mt-6 space-y-6" aria-label={t("governance_pool_label")}>
          <GovernanceHubPoolSection pool={pool} poolHttpError={poolHttpError} />
          <GovernanceHubRewardsSection rewards={rewards} rewardsHttpError={rewardsHttpError} />
        </section>
      )}

      <nav className="mt-8 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/delegate"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_delegate_nav")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/vault-forwards"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_vault_forwards_title")}
        </Link>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link
          href="/governance/distribution-claim"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_claim_title")}
        </Link>
        <Link
          href="/traveltrust#fee-router"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("traveltrust_link_feeRouter")}
        </Link>
        <GovernanceOpsAdminLinks />
        <Link
          href="/help"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("help_title")}
        </Link>
        <Link
          href="/governance/params"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_params_title")}
        </Link>
        <Link
          href="/"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_backHome")}
        </Link>
        <Link
          href="/disputes"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_disputes")}
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
