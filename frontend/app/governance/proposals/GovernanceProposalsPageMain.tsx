"use client";

import { type FormEvent, useId } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import GovernanceB090OnChainProposalNotice from "@/components/governance/GovernanceB090OnChainProposalNotice";
import GovernanceProposalExecStatusBadge from "@/components/governance/GovernanceProposalExecStatusBadge";
import { GOV_EXEC_LIST_BRIDGE_DOM_ID, GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL , TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";
import {
  touchTargetLink44Classes,
} from "@/lib/travelLinkFocus";
import { useGovernanceProposalsPage } from "./useGovernanceProposalsPage";

export function GovernanceProposalsPageMain() {
  const pageTitleId = useId();
  const listSectionId = useId();
  const {
    t,
    items,
    note,
    loading,
    error,
    setRetryTick,
    chainId,
    metaGovernor,
    chainExecById,
    chainExecLoading,
    emptySuccess,
    showOnChainPanel,
  } = useGovernanceProposalsPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_3XL}`} data-tt-marketing-product-shell="1"
      aria-labelledby={pageTitleId}
      data-tt-governance-proposals-page="1"
    >
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_proposals_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_proposals_intro")}</p>
      <GovernanceTargetNotice className="mt-4" />

      {showOnChainPanel ? (
        <div className="mt-6">
          <GovernanceB090OnChainProposalNotice
            variant="list"
            chainId={chainId}
            governorAddress={metaGovernor}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6">
          <LoadingText />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 space-y-2">
          <ApiErrorAlert message={error} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loading) return;
              setRetryTick((n) => n + 1);
            }}
          >
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-3 py-2 focus-visible:ring-offset-white`}
            >
              {loading ? t("common_retrying") : t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {!loading && !error && emptySuccess ? (
        <section className="mt-6 rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/60 p-4 dark:border-ink-600/40 dark:bg-ink-900/30">
          <h2 className="text-small font-semibold text-ink-800 dark:text-ink-100">
            {t("governance_proposals_empty_title")}
          </h2>
          <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_proposals_empty_body")}</p>
          {note ? (
            <p className="mt-2 text-meta text-ink-600 dark:text-ink-400" role="note">
              {note}
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && items !== null && items.length > 0 ? (
        <section className="mt-6" aria-labelledby={listSectionId}>
          <h2 id={listSectionId} className="sr-only">
            {t("governance_proposals_list_heading")}
          </h2>
          {note ? <p className="mb-3 text-meta text-ink-600">{note}</p> : null}
          {showOnChainPanel ? (
            <p
              id={GOV_EXEC_LIST_BRIDGE_DOM_ID}
              className="mb-3 rounded-[var(--radius-sm)] border border-ink-200/90 bg-ink-50/80 p-3 text-meta leading-snug text-ink-700 dark:border-ink-600/45 dark:bg-ink-900/30 dark:text-ink-200"
              role="note"
            >
              {t(GovExecReadOnlyI18n.listEntryBridge)}
            </p>
          ) : null}
          {showOnChainPanel && chainExecLoading ? (
            <p className="mb-2 text-meta text-ink-600" aria-live="polite">
              {t("governance_proposals_status_loading")}
            </p>
          ) : null}
          <ul className="divide-y divide-ink-200 rounded-[var(--radius-md)] border border-ink-200">
            {items.map((proposal, i) => {
              const key =
                typeof proposal.id === "string" && proposal.id.trim() ? proposal.id : `proposal-${i}`;
              const title =
                typeof proposal.title === "string" && proposal.title.trim()
                  ? proposal.title
                  : t("governance_proposals_item_untitled");
              const statusText =
                typeof proposal.status === "string" && proposal.status.trim()
                  ? proposal.status.trim()
                  : null;
              const href = `/governance/proposals/${encodeURIComponent(String(proposal.id))}`;
              const pid =
                typeof proposal.id === "string" && proposal.id.trim() ? proposal.id.trim() : "";
              const exec =
                showOnChainPanel && pid && chainExecById ? chainExecById[pid] : undefined;
              return (
                <li key={key} className="px-4 py-3 text-body text-ink-800">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      {typeof proposal.id === "string" && proposal.id.trim() ? (
                        <Link
                          href={href}
                          className={`font-medium ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
                          {...(showOnChainPanel
                            ? {
                                "aria-describedby": GOV_EXEC_LIST_BRIDGE_DOM_ID,
                                title: t(GovExecReadOnlyI18n.proposalLinkContinueTitle),
                              }
                            : {})}
                        >
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                      {statusText ? (
                        <p className="mt-1 text-meta text-ink-600 dark:text-ink-400">
                          {t("governance_proposal_detail_status")}: {statusText}
                        </p>
                      ) : null}
                    </div>
                    {showOnChainPanel && pid ? (
                      <GovernanceProposalExecStatusBadge
                        loading={chainExecLoading}
                        fetchSettled={chainExecById !== undefined}
                        entry={exec}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <nav className="mt-8 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/delegate"
          className={`inline-flex min-h-[44px] items-center justify-start ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_delegate_nav")}
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
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
