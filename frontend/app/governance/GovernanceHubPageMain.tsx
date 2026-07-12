"use client";

import { useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { GovernanceProposalsL5Shell } from "@/components/governance/GovernanceProposalsL5Shell";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { GovernanceHubPoolSection } from "./GovernanceHubPoolSection";
import { GovernanceHubRewardsSection } from "./GovernanceHubRewardsSection";
import { useGovernanceHubPage } from "./useGovernanceHubPage";
import { ConversionFunnelRail } from "@/components/product-enhancement/ConversionFunnelRail";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { GovernanceProposalsL5Panel } from "@/lib/governance/governanceProposalsL5Ui";

const HUB_L5 = "workspaceL5" as const;

export function GovernanceHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { pool, rewards, poolHttpError, rewardsHttpError, loading, error } = useGovernanceHubPage();

  const navLink = `${GOV_PROPOSALS_L5.footerLink} inline-flex min-h-[44px] items-center`;

  return (
    <GovernanceProposalsL5Shell width="narrow" ariaLabelledBy={pageTitleId}>
      <div data-tt-governance-hub-page="1" data-tt-ui-generation="l5">
        <header className={GOV_PROPOSALS_L5.pageHeaderWrap}>
          <p className={GOV_PROPOSALS_L5.heroKicker}>{t("governance_title")}</p>
          <h1 id={pageTitleId} className={GOV_PROPOSALS_L5.heroTitle}>
            {t("governance_title")}
          </h1>
          <p className={GOV_PROPOSALS_L5.heroLead}>{t("governance_desc")}</p>
        </header>

        <ConversionFunnelRail touchpoint="governance" t={t} variant="dark" className="mt-4" />
        <div className="mt-4">
          <TrustGrowthMomentBanner moment="governance_entry" surface="slate" />
        </div>
        <GovernanceTargetNotice />

        <GovernanceProposalsL5Panel className="mt-4 space-y-3">
          <p className={GOV_PROPOSALS_L5.metaNote} role="note" data-tt-governance-hub-params-pointer="1">
            {t("governance_hub_params_pointer")}
          </p>
          <p className={GOV_PROPOSALS_L5.metaNote} role="note">
            {t("governance_b428_closeloop_doc_pointer")}
          </p>
        </GovernanceProposalsL5Panel>

        {loading ? (
          <p className={`mt-4 ${GOV_PROPOSALS_L5.metaNote}`} role="status">
            {t("common_loading")}
          </p>
        ) : null}
        {error ? (
          <div className="mt-4">
            <ApiErrorAlert message={error} />
          </div>
        ) : null}
        {!loading && !error ? (
          <section className="mt-6 space-y-6" aria-label={t("governance_pool_label")}>
            <GovernanceHubPoolSection
              pool={pool}
              poolHttpError={poolHttpError}
              variant={HUB_L5}
            />
            <GovernanceHubRewardsSection
              rewards={rewards}
              rewardsHttpError={rewardsHttpError}
              variant={HUB_L5}
            />
          </section>
        ) : null}

        <nav className={`${GOV_PROPOSALS_L5.footerNav} mt-8`} aria-label={t("governance_nav_label")}>
          <Link href="/governance/delegate" className={navLink}>
            {t("governance_delegate_nav")}
          </Link>
          <Link href="/governance/proposals" className={navLink}>
            {t("governance_proposals_title")}
          </Link>
          <Link href="/governance/fee-routes" className={navLink}>
            {t("governance_fee_routes_title")}
          </Link>
          <Link href="/governance/vault-forwards" className={navLink}>
            {t("governance_vault_forwards_title")}
          </Link>
          <Link href="/governance/vacancy-ledger" className={navLink}>
            {t("governance_vacancy_ledger_title")}
          </Link>
          <Link href="/governance/net-profit-ledger" className={navLink}>
            {t("governance_net_profit_ledger_title")}
          </Link>
          <Link href="/governance/distribution-accruals" className={navLink}>
            {t("governance_distribution_accruals_title")}
          </Link>
          <Link href="/governance/distribution-claim" className={navLink}>
            {t("governance_claim_title")}
          </Link>
          <GovernanceOpsAdminLinks />
          <Link href="/help" className={navLink}>
            {t("help_title")}
          </Link>
          <Link href="/governance/params" className={navLink}>
            {t("governance_params_title")}
          </Link>
          <Link href="/" className={navLink}>
            {t("governance_backHome")}
          </Link>
          <Link href="/disputes" className={navLink}>
            {t("governance_disputes")}
          </Link>
        </nav>

        <ProductCrossNav
          ariaLabelKey="governance_subpage_relatedNav_aria"
          showGuides
          className={GOV_PROPOSALS_L5.crossNavWrap}
          linkClassName={GOV_PROPOSALS_L5.crossNavLink}
          separatorClassName={GOV_PROPOSALS_L5.crossNavSep}
        />
      </div>
    </GovernanceProposalsL5Shell>
  );
}
