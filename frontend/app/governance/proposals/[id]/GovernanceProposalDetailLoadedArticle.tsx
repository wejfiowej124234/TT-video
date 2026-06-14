import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceB090OnChainProposalNotice from "@/components/governance/GovernanceB090OnChainProposalNotice";
import GovernanceProposalImpactPanel from "@/components/governance/GovernanceProposalImpactPanel";
import GovernancePreExecutionHint from "@/components/governance/GovernancePreExecutionHint";
import GovernanceOnChainVotePanel from "@/components/governance/GovernanceOnChainVotePanel";
import GovernanceProposalExecutionActionsPanel from "@/components/governance/GovernanceProposalExecutionActionsPanel";
import { GovernanceProposalCancelPanel } from "@/components/governance/GovernanceProposalCancelPanel";
import GovernanceProposalExecutionReadinessPanel, {
  GovernanceProposalExecutionVoteFooter,
} from "@/components/governance/GovernanceProposalExecutionReadinessPanel";
import {
  type GovernanceExecutionReadiness,
} from "@/lib/governanceExecutionReadiness";
import { GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";
import {
  computeGovernanceVoteBarSegments,
  formatGovernanceAddressForList,
} from "@/lib/governance/governanceProposalsListModel";
import {
  GOV_PROPOSALS_L5,
  GovernanceProposalsL5Panel,
} from "@/lib/governance/governanceProposalsL5Ui";
import type { GovernanceProposalDetailResponse, GovernanceVotingPowerResponse } from "@/lib/apiClient";
import type { ChainContractsSnapshot } from "@/lib/governanceChainMeta";

export type GovernanceProposalDetailLoadedArticleProps = {
  data: GovernanceProposalDetailResponse;
  proposal: NonNullable<GovernanceProposalDetailResponse["proposal"]>;
  title: string;
  body: string;
  status: string;
  yes: number;
  no: number;
  abstain: number;
  onChainGovernor: boolean;
  myVote: string | null;
  myVoteWeight: number | null;
  executionReadiness: GovernanceExecutionReadiness;
  hasSession: boolean;
  votingPower: GovernanceVotingPowerResponse | null;
  metaGovernor: string | null;
  metaChainId: number | null;
  metaContracts: ChainContractsSnapshot | null;
  loginHref: string;
  voteBusy: boolean;
  voteError: string | null;
  voteFailCode: string | null;
  voteInfo: string | null;
  submitVote: (choice: "yes" | "no" | "abstain") => void;
  proposalId: string;
  onChainVoteRefresh?: () => void;
};

export function GovernanceProposalDetailLoadedArticle(props: GovernanceProposalDetailLoadedArticleProps) {
  const { t } = useTranslation();
  const {
    data,
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
    proposalId,
    onChainVoteRefresh,
  } = props;

  const governorAddr =
    metaGovernor && metaGovernor.startsWith("0x") ? (metaGovernor as `0x${string}`) : null;

  const voteBtnClass = `${GOV_PROPOSALS_L5.retryBtn} !inline-flex`;
  const { total, segments } = computeGovernanceVoteBarSegments(yes, no, abstain);
  const proposer =
    proposal.proposer && proposal.proposer.trim()
      ? formatGovernanceAddressForList(proposal.proposer)
      : null;

  return (
    <article className="mt-6 space-y-4">
      <GovernanceProposalsL5Panel>
        <header>
          <h2 className={GOV_PROPOSALS_L5.detailTitle}>{title}</h2>
          <p className={`mt-2 text-meta ${GOV_PROPOSALS_L5.voteLegend}`}>
            {t("governance_proposal_detail_status")}: {status}
          </p>
          {proposer ? (
            <p className={`mt-1 text-meta ${GOV_PROPOSALS_L5.proposalMeta}`} title={proposer.full}>
              {t("governance_proposals_card_proposer")}: {proposer.display}
            </p>
          ) : null}
        </header>
      </GovernanceProposalsL5Panel>
      {onChainGovernor && proposal ? (
        <GovernanceB090OnChainProposalNotice
          variant="detail"
          chainId={metaChainId}
          governorAddress={metaGovernor}
          proposal={{
            proposer: proposal.proposer,
            snapshot_block: proposal.snapshot_block,
            vote_start_block: proposal.vote_start_block,
            vote_end_block: proposal.vote_end_block,
            operation_id: proposal.operation_id,
          }}
        />
      ) : null}
      {onChainGovernor && proposal ? (
        <GovernanceProposalImpactPanel
          onChainGovernor={onChainGovernor}
          proposal={proposal}
          chain={data?.chain}
          contracts={metaContracts}
          votingPowerAtSnapshot={data?.voting_power_at_snapshot}
          hasCastVoteCalldata={
            !!(
              data?.cast_vote_calldata &&
              (data.cast_vote_calldata.yes || data.cast_vote_calldata.no || data.cast_vote_calldata.abstain)
            )
          }
        />
      ) : null}
      {onChainGovernor ? (
        <p id="gov-exec-detail-bridge" className={GOV_PROPOSALS_L5.noticeSoft} role="note">
          {t(GovExecReadOnlyI18n.detailContinuationBridge)}
        </p>
      ) : null}
      {onChainGovernor ? (
        <section aria-labelledby="gov-pre-exec" className="space-y-2">
          <h2 id="gov-pre-exec" className={`text-small font-semibold ${GOV_PROPOSALS_L5.detailTitle}`}>
            {t("governance_pre_exec_section_heading")}
          </h2>
          <GovernancePreExecutionHint />
        </section>
      ) : null}
      <GovernanceProposalsL5Panel>
        <section aria-labelledby="gov-prop-body">
          <h3 id="gov-prop-body" className={GOV_PROPOSALS_L5.sectionHeading}>
            {t("governance_proposal_detail_body")}
          </h3>
          <p className={`mt-3 whitespace-pre-wrap text-body leading-relaxed ${GOV_PROPOSALS_L5.cardHint}`}>{body || "—"}</p>
        </section>
      </GovernanceProposalsL5Panel>

      <GovernanceProposalsL5Panel>
        <section aria-labelledby="gov-prop-tally">
          <h3 id="gov-prop-tally" className={GOV_PROPOSALS_L5.sectionHeading}>
            {t("governance_proposal_detail_vote_counts")}
          </h3>
          {total > 0 ? (
            <div className="mt-3" aria-label={t("governance_proposals_card_vote_bar_aria")}>
              <div className={GOV_PROPOSALS_L5.voteBarTrack} role="img" aria-hidden>
                {segments.map((seg) =>
                  seg.percent > 0 ? (
                    <span
                      key={seg.key}
                      className={
                        seg.key === "yes"
                          ? GOV_PROPOSALS_L5.voteBarYes
                          : seg.key === "no"
                            ? GOV_PROPOSALS_L5.voteBarNo
                            : GOV_PROPOSALS_L5.voteBarAbstain
                      }
                      style={{ width: `${seg.percent}%` }}
                    />
                  ) : null,
                )}
              </div>
              <ul className={GOV_PROPOSALS_L5.voteLegend}>
                {segments.map((seg) => (
                  <li key={seg.key}>
                    {t(`governance_proposal_detail_vote_${seg.key}`)}: {seg.count}
                    {total > 0 ? ` (${seg.percent}%)` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={`mt-3 text-body ${GOV_PROPOSALS_L5.cardHint}`}>{t("governance_proposals_card_no_votes")}</p>
          )}
        <p className={`mt-2 text-meta ${GOV_PROPOSALS_L5.voteLegend}`}>
          {onChainGovernor
            ? t("governance_proposal_on_chain_tally_hint")
            : t("governance_proposal_detail_vote_counts_weighted_hint")}
        </p>
        {onChainGovernor && data?.chain?.state_live ? (
          <p className={`mt-2 text-body ${GOV_PROPOSALS_L5.cardHint}`} role="status">
            {t("governance_proposal_chain_state_live")}: {String(data.chain.state_live)}
            {data.chain.state_rpc_error
              ? ` (${t("governance_proposal_chain_read_error")}: ${String(data.chain.state_rpc_error)})`
              : ""}
          </p>
        ) : null}
        {hasSession &&
        votingPower?.authenticated &&
        !onChainGovernor &&
        ((votingPower.can_cast_vote === false && votingPower.reason === "delegation_active_cannot_vote") ||
          typeof votingPower.total_weight_units === "number") ? (
          <p className={`mt-2 text-body ${GOV_PROPOSALS_L5.cardHint}`} role="status">
            {votingPower.can_cast_vote === false && votingPower.reason === "delegation_active_cannot_vote"
              ? t("governance_voting_power_delegated_away")
              : `${t("governance_voting_power_current")}: ${votingPower.total_weight_units}`}
          </p>
        ) : null}
        {hasSession && onChainGovernor && votingPower?.unified_on_chain_vote_weight_u256_dec ? (
          <p className={`mt-2 text-body ${GOV_PROPOSALS_L5.cardHint}`} role="status" data-tt-governance-onchain-vote-weight="1">
            {t("governance_voting_power_onchain_snapshot", {
              weight: votingPower.unified_on_chain_vote_weight_u256_dec,
            })}
          </p>
        ) : null}
        <p className={`mt-2 text-body ${GOV_PROPOSALS_L5.cardHint}`}>
          <span className="font-medium">{t("governance_proposal_detail_my_vote")}:</span>{" "}
          {myVote && myVote.trim()
            ? myVote === "yes"
              ? t("governance_proposal_detail_vote_yes")
              : myVote === "no"
                ? t("governance_proposal_detail_vote_no")
                : myVote === "abstain"
                  ? t("governance_proposal_detail_vote_abstain")
                  : myVote
            : t("governance_proposal_detail_my_vote_none")}
        </p>
        {myVote && myVote.trim() && myVoteWeight != null ? (
          <p className={`mt-1 text-meta ${GOV_PROPOSALS_L5.proposalMeta}`}>
            {t("governance_proposal_detail_my_vote_weight")}: {myVoteWeight}
          </p>
        ) : null}
        </section>
      </GovernanceProposalsL5Panel>

      {onChainGovernor ? (
        <GovernanceProposalExecutionActionsPanel
          className="mt-0"
          readiness={executionReadiness}
          governorAddress={governorAddr}
          proposalId={proposalId}
          operationId={proposal.operation_id}
          metaChainId={metaChainId}
          onTxSuccess={onChainVoteRefresh}
        />
      ) : null}

      {onChainGovernor ? (
        <GovernanceProposalCancelPanel
          governorAddress={governorAddr}
          proposalId={proposalId}
          proposerAddress={proposal.proposer}
          metaChainId={metaChainId}
          onTxSuccess={onChainVoteRefresh}
        />
      ) : null}

      <GovernanceProposalsL5Panel>
        <section aria-labelledby="gov-prop-vote">
          <h3 id="gov-prop-vote" className={GOV_PROPOSALS_L5.sectionHeading}>
            {t("governance_proposal_detail_vote_section")}
          </h3>
        <GovernanceProposalExecutionReadinessPanel className="mt-3" onChainGovernor={onChainGovernor} chain={data?.chain} />
        {!hasSession ? (
          <p className={`mt-2 text-body ${GOV_PROPOSALS_L5.cardHint}`}>{t("governance_proposal_detail_login_to_vote")}</p>
        ) : null}
        {!hasSession ? (
          <Link
            href={loginHref}
            className={`${GOV_PROPOSALS_L5.inlineLink} mt-2`}
          >
            {t("governance_proposal_detail_go_login")}
          </Link>
        ) : null}
        {voteError ? (
          <div className="mt-3 space-y-2">
            <ApiErrorAlert message={voteError} />
            {voteFailCode === "delegation_active_cannot_vote" ? (
              <Link
                href="/governance/delegate"
                className={GOV_PROPOSALS_L5.inlineLink}
              >
                {t("governance_delegate_nav")}
              </Link>
            ) : null}
          </div>
        ) : null}
        {voteInfo ? (
          <p className={`mt-3 text-body ${GOV_PROPOSALS_L5.cardHint}`} role="status">
            {voteInfo}
          </p>
        ) : null}
        <GovernanceProposalExecutionVoteFooter
          className="mt-4"
          readiness={executionReadiness}
          onChainGovernor={onChainGovernor}
        />
        {onChainGovernor ? (
          <GovernanceOnChainVotePanel
            proposalId={proposalId}
            governorAddress={governorAddr}
            metaChainId={metaChainId}
            hasSession={hasSession}
            loginHref={loginHref}
            canCastVote={votingPower?.can_cast_vote}
            votingPowerReason={votingPower?.reason}
            castVoteCalldata={data?.cast_vote_calldata}
            onTxSuccess={onChainVoteRefresh}
          />
        ) : (
          <>
            {voteBusy ? (
              <p className={`mt-3 text-meta ${GOV_PROPOSALS_L5.proposalMeta}`} role="status" aria-live="polite">
                {t("governance_proposal_detail_vote_submitting")}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={voteBtnClass}
                disabled={voteBusy || !hasSession}
                aria-busy={voteBusy ? true : undefined}
                onClick={() => void submitVote("yes")}
              >
                {t("governance_proposal_detail_vote_yes")}
              </button>
              <button
                type="button"
                className={voteBtnClass}
                disabled={voteBusy || !hasSession}
                aria-busy={voteBusy ? true : undefined}
                onClick={() => void submitVote("no")}
              >
                {t("governance_proposal_detail_vote_no")}
              </button>
              <button
                type="button"
                className={voteBtnClass}
                disabled={voteBusy || !hasSession}
                aria-busy={voteBusy ? true : undefined}
                onClick={() => void submitVote("abstain")}
              >
                {t("governance_proposal_detail_vote_abstain")}
              </button>
            </div>
          </>
        )}
        </section>
      </GovernanceProposalsL5Panel>
    </article>
  );
}
