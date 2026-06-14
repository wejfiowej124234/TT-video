"use client";

import { Suspense, type FormEvent, useId } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { StewardWorkbenchSubpageBackLinkFromQuery } from "@/components/governance/StewardWorkbenchSubpageBackLinkFromQuery";
import {
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
  TT_MARKETING_GOVERNANCE_INNER_3XL,
  TT_MARKETING_GOVERNANCE_INNER_4XL,
  TT_MARKETING_GOVERNANCE_INNER_5XL,
  TT_MARKETING_GOVERNANCE_INNER_6XL,
  TT_MARKETING_GOVERNANCE_PAGE_SHELL,
} from "@/lib/marketingUi";
import { useGovernanceDelegatePage } from "./useGovernanceDelegatePage";

/** B-073：委托 / 撤销 + 回执（request_id / tx_hash） */
function GovernanceDelegatePageContent() {
  const pageTitleId = useId();
  const formId = useId();
  const targetInputId = useId();
  const {
    t,
    loading,
    error,
    setRetryTick,
    authenticated,
    delegateTo,
    targetDraft,
    setTargetDraft,
    actionBusy,
    actionError,
    copyHint,
    receipt,
    loginHref,
    hasSession,
    copyLine,
    onSubmitDelegate,
    onRevoke,
  } = useGovernanceDelegatePage();

  const btnClass = `${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-white`;

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_3XL}`} data-tt-marketing-product-shell="1"
      aria-labelledby={pageTitleId}
      data-tt-governance-delegate-page="1"
    >
      <Suspense fallback={null}>
        <StewardWorkbenchSubpageBackLinkFromQuery t={t} />
      </Suspense>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_delegate_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_delegate_intro")}</p>
      <GovernanceTargetNotice className="mt-4" />

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

      {!loading && !error ? (
        <section className="mt-6 space-y-4" aria-label={t("governance_delegate_current")}>
          <div>
            <h2 className="text-small font-semibold text-ink-800">{t("governance_delegate_current")}</h2>
            <p className="mt-1 font-mono text-body text-ink-900">
              {authenticated && delegateTo ? delegateTo : t("governance_delegate_none")}
            </p>
          </div>

          {!hasSession ? (
            <div className="rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/50 p-4 dark:border-ink-600/40 dark:bg-ink-900/20">
              <p className="text-body text-ink-700 dark:text-ink-200">{t("governance_delegate_login_hint")}</p>
              <Link
                href={loginHref}
                className={`${touchTargetLink44Classes} mt-2 inline-flex items-center font-medium ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
              >
                {t("governance_delegate_go_login")}
              </Link>
            </div>
          ) : null}

          {hasSession ? (
            <form id={formId} className="space-y-3" onSubmit={onSubmitDelegate}>
              <div>
                <label htmlFor={targetInputId} className="text-small font-medium text-ink-800">
                  {t("governance_delegate_target_label")}
                </label>
                <input
                  id={targetInputId}
                  type="text"
                  name="delegate_to"
                  autoComplete="off"
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  placeholder={t("governance_delegate_target_placeholder")}
                  className={`mt-1 w-full max-w-xl min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE}`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={btnClass} disabled={actionBusy || !targetDraft.trim()}>
                  {t("governance_delegate_submit")}
                </button>
                <button
                  type="button"
                  className={btnClass}
                  disabled={actionBusy || !delegateTo}
                  onClick={() => void onRevoke()}
                >
                  {t("governance_delegate_revoke")}
                </button>
              </div>
            </form>
          ) : null}

          {actionError ? (
            <div className="mt-2">
              <ApiErrorAlert message={actionError} />
            </div>
          ) : null}

          {receipt?.request_id ? (
            <div
              className="rounded-[var(--radius-md)] border border-ink-200/80 bg-white p-4 dark:border-ink-600/40 dark:bg-ink-900/30"
              aria-label={t("governance_delegate_receipt_title")}
            >
              <h2 className="text-small font-semibold text-ink-800">{t("governance_delegate_receipt_title")}</h2>
              <dl className="mt-3 space-y-2 text-body text-ink-800">
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="font-medium">{t("governance_delegate_receipt_request_id")}</dt>
                  <dd className="font-mono text-small break-all">{receipt.request_id}</dd>
                  <button
                    type="button"
                    className={`${touchTargetLink44Classes} text-small ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
                    onClick={() => void copyLine("request_id", receipt.request_id ?? "")}
                  >
                    {t("agree_copy")}
                  </button>
                </div>
                <div>
                  <dt className="font-medium">{t("governance_delegate_receipt_tx_hash")}</dt>
                  <dd className="mt-1 font-mono text-small text-ink-600">
                    {receipt.tx_hash && String(receipt.tx_hash).trim()
                      ? String(receipt.tx_hash)
                      : t("governance_delegate_receipt_tx_none")}
                  </dd>
                </div>
              </dl>
              {receipt.action === "post" && receipt.idempotent ? (
                <p className="mt-3 text-meta text-ink-600" role="status">
                  {t("governance_delegate_receipt_idempotent")}
                </p>
              ) : null}
            </div>
          ) : null}
          {copyHint ? (
            <p className="text-meta text-ink-600" role="status">
              {copyHint}
            </p>
          ) : null}
        </section>
      ) : null}

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

export function GovernanceDelegatePageMain() {
  return (
    <GovernanceSearchParamsRouteSuspense pageTitleKey="governance_delegate_title" introKey="governance_delegate_intro">
      <GovernanceDelegatePageContent />
    </GovernanceSearchParamsRouteSuspense>
  );
}
