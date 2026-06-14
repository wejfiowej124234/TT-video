"use client";



import { type FormEvent } from "react";

import LoadingText from "@/components/LoadingText";

import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";

import { GovernanceProposalsL5Shell } from "@/components/governance/GovernanceProposalsL5Shell";

import { GovernanceProposalsPageHeader } from "@/components/governance/GovernanceProposalsPageHeader";

import { GovernanceProposalsSubpageNav } from "@/components/governance/GovernanceProposalsSubpageNav";

import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";

import ApiErrorAlert from "@/components/ApiErrorAlert";

import {

  GOV_PROPOSALS_L5,

  GovernanceProposalsL5Panel,

} from "@/lib/governance/governanceProposalsL5Ui";

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

    <GovernanceProposalsL5Shell width="narrow" pageKind="detail" ariaLabelledBy={pageTitleId}>

      <GovernanceProposalsPageHeader

        pageTitleId={pageTitleId}

        kicker={t("governance_proposals_l5_kicker")}

        title={t("governance_proposal_detail_title")}

        lead={t("governance_proposal_detail_l5_lead")}

      />



      <GovernanceTargetNotice className="mt-4" />



      <div className="mt-4">

        <InlineTransparencyVerification context="governance" surface="ink" verificationKey={proposalId} />

      </div>



      <GovernanceProposalsSubpageNav t={t} />



      {loading ? (

        <GovernanceProposalsL5Panel className="mt-6">

          <LoadingText />

        </GovernanceProposalsL5Panel>

      ) : null}



      {error ? (

        <GovernanceProposalsL5Panel className="mt-6">

          <ApiErrorAlert message={error} />

          <form

            className="mt-3 inline"

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

              className={GOV_PROPOSALS_L5.retryBtn}

            >

              {loading ? t("common_retrying") : t("common_retry")}

            </button>

          </form>

        </GovernanceProposalsL5Panel>

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

          proposalId={proposalId}

          onChainVoteRefresh={retryLoad}

        />

      ) : null}



      <ProductCrossNav

        ariaLabelKey="governance_subpage_relatedNav_aria"

        showGuides

        className={GOV_PROPOSALS_L5.crossNavWrap}

        linkClassName={GOV_PROPOSALS_L5.crossNavLink}

        separatorClassName={GOV_PROPOSALS_L5.crossNavSep}

      />

    </GovernanceProposalsL5Shell>

  );

}

