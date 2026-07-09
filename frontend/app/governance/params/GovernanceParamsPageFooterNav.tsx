"use client";

import Link from "next/link";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { GOV_PARAMS_L5, GovernanceParamsL5Panel } from "@/lib/governance/governanceParamsPageL5";

type GovernanceParamsPageFooterNavProps = {
  t: (key: string) => string;
};

export function GovernanceParamsPageFooterNav({ t }: GovernanceParamsPageFooterNavProps) {
  return (
    <>
      <GovernanceParamsL5Panel className="mt-8" data-tt-governance-params-footer-nav="1">
        <p className={GOV_PARAMS_L5.sectionHeading}>{t("governance_params_footer_title")}</p>
        <p className={`mt-2 ${GOV_PARAMS_L5.metaNote}`}>{t("governance_params_footer_lead")}</p>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-small" aria-label={t("governance_subpage_relatedNav_aria")}>
          <Link href="/governance/vacancy-ledger" className={GOV_PARAMS_L5.inlineLink}>
            {t("governance_vacancy_ledger_title")}
          </Link>
          <Link href="/governance/fee-routes" className={GOV_PARAMS_L5.inlineLink}>
            {t("governance_fee_routes_title")}
          </Link>
          <Link href="/governance/vault-forwards" className={GOV_PARAMS_L5.inlineLink}>
            {t("governance_vault_forwards_title")}
          </Link>
          <Link href="/governance/distribution-accruals" className={GOV_PARAMS_L5.inlineLink}>
            {t("governance_distribution_accruals_title")}
          </Link>
          <Link href="/governance/proposals" className={GOV_PARAMS_L5.inlineLink}>
            {t("governance_proposals_title")}
          </Link>
          <GovernanceOpsAdminLinks />
        </nav>
      </GovernanceParamsL5Panel>

      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className={GOV_PARAMS_L5.crossNavWrap}
        linkClassName={GOV_PARAMS_L5.crossNavLink}
        separatorClassName={GOV_PARAMS_L5.crossNavSep}
      />
    </>
  );
}
