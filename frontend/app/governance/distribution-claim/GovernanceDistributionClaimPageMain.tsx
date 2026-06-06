"use client";

import { useId } from "react";
import Link from "next/link";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import WalletStatusMini from "@/components/trust/WalletStatusMini";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { useGovernanceDistributionClaimPage } from "./useGovernanceDistributionClaimPage";
import {
  TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT,
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
  TT_MARKETING_GOVERNANCE_INNER_3XL,
  TT_MARKETING_GOVERNANCE_PAGE_SHELL,
} from "@/lib/marketingUi";

export function GovernanceDistributionClaimPageMain() {
  const titleId = useId();
  const distInputId = useId();
  const distErrorId = useId();
  const maxInputId = useId();

  const {
    t,
    address,
    isConnected,
    chainOk,
    claimAddress,
    distInput,
    setDistInput,
    maxStr,
    setMaxStr,
    parsedBytes32,
    readsEnabled,
    tokenRead,
    token,
    unknownDistribution,
    claimableRead,
    entitledRead,
    claimedRead,
    claimable,
    entitled,
    claimed,
    simEnabled,
    simData,
    simFetching,
    simError,
    simMsg,
    claim,
    withdrawDividend,
    writePending,
    writeSuccess,
    writeMsg,
    hash,
    claimableFormatted,
    yieldGrowPayload,
    distInvalid,
    effectiveMax,
  } = useGovernanceDistributionClaimPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_3XL}`}
      data-tt-governance-distribution-claim-page="1"
      data-tt-marketing-product-shell="1"
    >
      <GovernanceTargetNotice className="mb-6" />
      <h1 id={titleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_claim_title")}
      </h1>
      <p className="mt-2 text-body text-ink-700">{t("governance_claim_desc")}</p>
      <p className="mt-2 text-meta text-ink-500">{t("governance_claim_env_hint")}</p>

      <div className="mt-4">
        <TrustGrowthMomentBanner moment="first_yield" surface="ink" analyticsPayload={yieldGrowPayload} />
      </div>

      <div className="mt-4">
        <InlineTransparencyVerification context="yield" surface="ink" />
      </div>

      {!claimAddress ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-warning bg-warning px-3 py-2 text-body text-white">
          {t("governance_claim_contract_unconfigured")}
        </p>
      ) : null}

      <div className="mt-6 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 px-3 py-3">
        <p className="text-meta font-medium text-ink-700">{t("governance_claim_wallet_section")}</p>
        <div className="mt-2">
          <WalletStatusMini />
        </div>
        {isConnected && !chainOk ? (
          <p className="mt-2 text-body text-danger">{t("governance_claim_wrong_chain")}</p>
        ) : null}
      </div>

      <div className="mt-6 space-y-2">
        <label htmlFor={distInputId} className="block text-meta font-medium text-ink-700">
          {t("governance_claim_dist_label")}
        </label>
        <input
          id={distInputId}
          type="text"
          value={distInput}
          onChange={(e) => setDistInput(e.target.value)}
          placeholder={t("governance_claim_dist_placeholder")}
          autoComplete="off"
          aria-invalid={distInvalid}
          aria-errormessage={distInvalid ? distErrorId : undefined}
          data-tt-governance-distribution-claim-dist-input="1"
          className={`w-full min-h-[44px] rounded-[var(--radius-sm)] border bg-white px-3 py-2 font-mono text-small text-ink-900 ${
            distInvalid ? "border-danger" : "border-ink-300"
          } ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE}`}
        />
        {distInvalid ? (
          <p id={distErrorId} className="text-small text-danger" role="alert">
            {t("governance_claim_dist_invalid")}
          </p>
        ) : null}
        {parsedBytes32 ? (
          <p className="break-all font-mono text-meta text-ink-600">
            {t("governance_claim_resolved_bytes32")}
            {t("market_fin_colon")}
            {parsedBytes32}
          </p>
        ) : null}
      </div>

      {readsEnabled && parsedBytes32 ? (
        <dl className="mt-6 space-y-2 text-small">
          <div>
            <dt className="text-meta text-ink-500">{t("governance_claim_token")}</dt>
            <dd className="break-all font-mono">
              {tokenRead.isLoading ? t("common_loading") : token ? token : t("governance_claim_token_unknown")}
            </dd>
          </div>
          {address ? (
            <>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_claim_entitled_label")}</dt>
                <dd className="font-mono">
                  {entitledRead.isLoading ? t("common_loading") : entitled?.toString() ?? t("ui_em_dash")}
                </dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_claim_claimed_label")}</dt>
                <dd className="font-mono">
                  {claimedRead.isLoading ? t("common_loading") : claimed?.toString() ?? t("ui_em_dash")}
                </dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_claim_claimable")}</dt>
                <dd className="font-mono">
                  {claimableRead.isLoading ? (
                    t("common_loading")
                  ) : claimable !== undefined ? (
                    <>
                      {claimable.toString()}
                      {claimableFormatted ? (
                        <span className="ml-2 text-meta text-ink-500">
                          ({claimableFormatted} {t("governance_claim_token_units_hint")})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    t("ui_em_dash")
                  )}
                </dd>
              </div>
            </>
          ) : (
            <p className="text-body text-ink-600">{t("governance_claim_connect_for_reads")}</p>
          )}
        </dl>
      ) : null}

      <section className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-3">
        <h2 className="text-h4 font-medium text-ink-900">{t("governance_claim_expected_fail_section")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-ink-700">
          <li>
            {unknownDistribution
              ? t("governance_claim_expected_fail_unknown_active")
              : t("governance_claim_expected_fail_unknown")}
          </li>
          <li>
            {claimable !== undefined && claimable === 0n && token
              ? t("governance_claim_expected_fail_nothing_active")
              : t("governance_claim_expected_fail_nothing")}
          </li>
        </ul>
      </section>

      <div className="mt-6 space-y-2">
        <label htmlFor={maxInputId} className="block text-meta font-medium text-ink-700">
          {t("governance_claim_max_label")}
        </label>
        <input
          id={maxInputId}
          type="text"
          inputMode="numeric"
          value={maxStr}
          onChange={(e) => setMaxStr(e.target.value)}
          placeholder={t("governance_claim_max_placeholder")}
          data-tt-governance-distribution-claim-max-input="1"
          className={`w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE}`}
        />
        <p className="text-meta text-ink-500">{t("governance_claim_max_hint")}</p>
      </div>

      <section className="mt-6">
        <h2 className="text-h4 font-medium text-ink-900">{t("governance_claim_precheck_section")}</h2>
        {simFetching ? <p className="mt-2 text-meta text-ink-500">{t("common_loading")}</p> : null}
        {!simEnabled && isConnected && chainOk && claimAddress && parsedBytes32 && token && address ? (
          <p className="mt-2 text-body text-ink-600">{t("governance_claim_precheck_need_amount")}</p>
        ) : null}
        {simEnabled && !simFetching && !simError && simData?.request ? (
          <p className="mt-2 text-body text-success">{t("governance_claim_precheck_ok")}</p>
        ) : null}
        {simMsg ? <p className="mt-2 text-body text-danger">{simMsg}</p> : null}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            !isConnected ||
            !chainOk ||
            !claimAddress ||
            !parsedBytes32 ||
            !token ||
            effectiveMax === undefined ||
            writePending
          }
          onClick={() => claim()}
          data-tt-governance-distribution-claim-btn-claim="1"
          className={`${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-bg-main`}
        >
          {writePending ? t("governance_claim_tx_pending") : t("governance_claim_btn_claim")}
        </button>
        <button
          type="button"
          disabled={
            !isConnected ||
            !chainOk ||
            !claimAddress ||
            !parsedBytes32 ||
            !token ||
            effectiveMax === undefined ||
            writePending
          }
          onClick={() => withdrawDividend()}
          data-tt-governance-distribution-claim-btn-withdraw="1"
          className={`${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} disabled:opacity-50`}
        >
          {t("governance_claim_btn_withdraw")}
        </button>
      </div>

      {writeMsg ? <p className="mt-3 text-body text-danger">{writeMsg}</p> : null}
      {writeSuccess && hash ? (
        <p className="mt-2 text-body text-success">
          {t("governance_claim_tx_success")}
          <span className="mt-1 block break-all font-mono text-meta">
            {t("governance_claim_tx_hash")}
            {t("market_fin_colon")}
            {hash}
          </span>
        </p>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_title")}
        </Link>
        <GovernanceOpsAdminLinks />
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
