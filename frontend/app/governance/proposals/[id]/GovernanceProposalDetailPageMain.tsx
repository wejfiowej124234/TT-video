"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import {
  touchTargetLink44Classes,
} from "@/lib/travelLinkFocus";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {TT_MARKETING_GOVERNANCE_INNER_3XL, TT_MARKETING_GOVERNANCE_INNER_4XL, TT_MARKETING_GOVERNANCE_INNER_5XL, TT_MARKETING_GOVERNANCE_INNER_6XL, TT_MARKETING_GOVERNANCE_PAGE_SHELL , TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";
import { GovernanceProposalDetailLoadedArticle } from "./GovernanceProposalDetailLoadedArticle";
import { useGovernanceProposalDetailPage } from "./useGovernanceProposalDetailPage";

/** B-072：`GET` 详情 + `POST` 投票；同票幂等、异票 409（`parseResponse` → `already_voted`） */
export function GovernanceProposalDetailPageMain() {
  const {
    t,
    pageTitleId,
    proposalId,
    data,
    loading,
    error,
    retryLoad,
    proposal,
    title,
    body,
    status,
    yes,
    no,
    abstain,
    onChainGovernor,
    myVote,
    myVoteWeight,
    executionReadiness,
    hasSession,
    votingPower,
    metaGovernor,
    metaChainId,
    metaContracts,
    loginHref,
    voteBusy,
    voteError,
    voteFailCode,
    voteInfo,
    submitVote,
  } = useGovernanceProposalDetailPage();

  return (
    <main
      className={`${TT_MARKETING_GOVERNANCE_PAGE_SHELL} ${TT_MARKETING_GOVERNANCE_INNER_3XL}`} data-tt-marketing-product-shell="1"
      aria-labelledby={pageTitleId}
      data-tt-governance-proposal-detail-page="1"
    >
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_proposal_detail_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_proposals_intro")}</p>
      <GovernanceTargetNotice className="mt-4" />

      <div className="mt-4">
        <InlineTransparencyVerification context="governance" surface="ink" verificationKey={proposalId} />
      </div>

      <nav className="mt-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/proposals"
          className={`${touchTargetLink44Classes} inline-flex items-center ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_proposal_detail_back")}
        </Link>
      </nav>

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
              retryLoad();
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

      {!loading && !error && proposal && data ? (
        <GovernanceProposalDetailLoadedArticle
          data={data}
          proposal={proposal}
          title={title}
          body={body}
          status={status}
          yes={yes}
          no={no}
          abstain={abstain}
          onChainGovernor={onChainGovernor}
          myVote={myVote}
          myVoteWeight={myVoteWeight}
          executionReadiness={executionReadiness}
          hasSession={hasSession}
          votingPower={votingPower}
          metaGovernor={metaGovernor}
          metaChainId={metaChainId}
          metaContracts={metaContracts}
          loginHref={loginHref}
          voteBusy={voteBusy}
          voteError={voteError}
          voteFailCode={voteFailCode}
          voteInfo={voteInfo}
          submitVote={submitVote}
        />
      ) : null}

      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
