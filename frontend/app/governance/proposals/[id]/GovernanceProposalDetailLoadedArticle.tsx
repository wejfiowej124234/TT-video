import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceB090OnChainProposalNotice from "@/components/governance/GovernanceB090OnChainProposalNotice";
import GovernanceProposalImpactPanel from "@/components/governance/GovernanceProposalImpactPanel";
import GovernancePreExecutionHint from "@/components/governance/GovernancePreExecutionHint";
import GovernanceProposalExecutionActionsSkeleton from "@/components/governance/GovernanceProposalExecutionActionsSkeleton";
import GovernanceProposalExecutionReadinessPanel, {
  GovernanceProposalExecutionVoteFooter,
} from "@/components/governance/GovernanceProposalExecutionReadinessPanel";
import {
  GOV_EXEC_READINESS_DESC_ID,
  GOV_EXEC_READINESS_VOTE_FOOTER_ID,
  type GovernanceExecutionReadiness,
} from "@/lib/governanceExecutionReadiness";
import { GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";
import type { GovernanceProposalDetailResponse, GovernanceVotingPowerResponse } from "@/lib/apiClient";
import type { ChainContractsSnapshot } from "@/lib/governanceChainMeta";
import { TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";
import {
  touchTargetLink44Classes,
} from "@/lib/travelLinkFocus";

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
  } = props;

  const voteBtnClass = `${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-white`;

  return (
    <article className="mt-6 space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <p className="mt-1 text-meta text-ink-600">
          {t("governance_proposal_detail_status")}: {status}
        </p>
      </header>
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
        <p
          id="gov-exec-detail-bridge"
          className="rounded-[var(--radius-sm)] border border-ink-200/90 bg-ink-50/80 p-3 text-meta leading-snug text-ink-700 dark:border-ink-600/45 dark:bg-ink-900/30 dark:text-ink-200"
          role="note"
        >
          {t(GovExecReadOnlyI18n.detailContinuationBridge)}
        </p>
      ) : null}
      {onChainGovernor ? (
        <section aria-labelledby="gov-pre-exec" className="space-y-2">
          <h2 id="gov-pre-exec" className="text-small font-semibold text-ink-800 dark:text-ink-100">
            {t("governance_pre_exec_section_heading")}
          </h2>
          <GovernancePreExecutionHint />
        </section>
      ) : null}
      <section aria-labelledby="gov-prop-body">
        <h3 id="gov-prop-body" className="text-small font-semibold text-ink-800">
          {t("governance_proposal_detail_body")}
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-body text-ink-800">{body || "—"}</p>
      </section>
      <section aria-labelledby="gov-prop-tally">
        <h3 id="gov-prop-tally" className="text-small font-semibold text-ink-800">
          {t("governance_proposal_detail_vote_counts")}
        </h3>
        <ul className="mt-2 list-inside list-disc text-body text-ink-800">
          <li>
            {t("governance_proposal_detail_vote_yes")}: {yes}
          </li>
          <li>
            {t("governance_proposal_detail_vote_no")}: {no}
          </li>
          <li>
            {t("governance_proposal_detail_vote_abstain")}: {abstain}
          </li>
        </ul>
        <p className="mt-2 text-meta text-ink-600 dark:text-ink-300">
          {onChainGovernor
            ? t("governance_proposal_on_chain_tally_hint")
            : t("governance_proposal_detail_vote_counts_weighted_hint")}
        </p>
        {onChainGovernor && data?.chain?.state_live ? (
          <p className="mt-2 text-body text-ink-800 dark:text-ink-100" role="status">
            {t("governance_proposal_chain_state_live")}: {String(data.chain.state_live)}
            {data.chain.state_rpc_error
              ? ` (${t("governance_proposal_chain_read_error")}: ${String(data.chain.state_rpc_error)})`
              : ""}
          </p>
        ) : null}
        {hasSession &&
        votingPower?.authenticated &&
        ((votingPower.can_cast_vote === false && votingPower.reason === "delegation_active_cannot_vote") ||
          typeof votingPower.total_weight_units === "number") ? (
          <p className="mt-2 text-body text-ink-800 dark:text-ink-100" role="status">
            {votingPower.can_cast_vote === false && votingPower.reason === "delegation_active_cannot_vote"
              ? t("governance_voting_power_delegated_away")
              : `${t("governance_voting_power_current")}: ${votingPower.total_weight_units}`}
          </p>
        ) : null}
        <p className="mt-2 text-body text-ink-800">
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
          <p className="mt-1 text-meta text-ink-600 dark:text-ink-300">
            {t("governance_proposal_detail_my_vote_weight")}: {myVoteWeight}
          </p>
        ) : null}
      </section>

      {onChainGovernor ? (
        <GovernanceProposalExecutionActionsSkeleton className="mt-2" readiness={executionReadiness} />
      ) : null}

      <section
        aria-labelledby="gov-prop-vote"
        className="rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/40 p-4 dark:border-ink-600/40 dark:bg-ink-900/20"
      >
        <h3 id="gov-prop-vote" className="text-small font-semibold text-ink-800 dark:text-ink-100">
          {t("governance_proposal_detail_vote_section")}
        </h3>
        <GovernanceProposalExecutionReadinessPanel className="mt-3" onChainGovernor={onChainGovernor} chain={data?.chain} />
        {!hasSession ? (
          <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_proposal_detail_login_to_vote")}</p>
        ) : null}
        {!hasSession ? (
          <Link
            href={loginHref}
            className={`${touchTargetLink44Classes} mt-2 inline-flex items-center font-medium ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
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
                className={`${touchTargetLink44Classes} inline-flex items-center ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
              >
                {t("governance_delegate_nav")}
              </Link>
            ) : null}
          </div>
        ) : null}
        {voteInfo ? (
          <p className="mt-3 text-body text-ink-700 dark:text-ink-200" role="status">
            {voteInfo}
          </p>
        ) : null}
        {onChainGovernor ? (
          <div className="mt-3 space-y-2 text-body text-ink-800 dark:text-ink-100">
            <p>{t("governance_proposal_on_chain_vote_explain")}</p>
            {data?.cast_vote_calldata ? (
              <div className="space-y-1 text-meta">
                <div>
                  <span className="font-medium">{t("governance_proposal_calldata_yes")}</span>
                  <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                    {data.cast_vote_calldata.yes ?? "—"}
                  </pre>
                </div>
                <div>
                  <span className="font-medium">{t("governance_proposal_calldata_no")}</span>
                  <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                    {data.cast_vote_calldata.no ?? "—"}
                  </pre>
                </div>
                <div>
                  <span className="font-medium">{t("governance_proposal_calldata_abstain")}</span>
                  <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                    {data.cast_vote_calldata.abstain ?? "—"}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {voteBusy ? (
          <p className="mt-3 text-meta text-ink-600" role="status" aria-live="polite">
            {t("governance_proposal_detail_vote_submitting")}
          </p>
        ) : null}
        <GovernanceProposalExecutionVoteFooter
          className="mt-4"
          readiness={executionReadiness}
          onChainGovernor={onChainGovernor}
        />
        <div
          className="mt-2 flex flex-wrap gap-2"
          aria-describedby={onChainGovernor ? `${GOV_EXEC_READINESS_DESC_ID} ${GOV_EXEC_READINESS_VOTE_FOOTER_ID}` : undefined}
        >
          <button
            type="button"
            className={voteBtnClass}
            disabled={voteBusy || !hasSession || onChainGovernor}
            aria-busy={voteBusy ? true : undefined}
            onClick={() => void submitVote("yes")}
          >
            {t("governance_proposal_detail_vote_yes")}
          </button>
          <button
            type="button"
            className={voteBtnClass}
            disabled={voteBusy || !hasSession || onChainGovernor}
            aria-busy={voteBusy ? true : undefined}
            onClick={() => void submitVote("no")}
          >
            {t("governance_proposal_detail_vote_no")}
          </button>
          <button
            type="button"
            className={voteBtnClass}
            disabled={voteBusy || !hasSession || onChainGovernor}
            aria-busy={voteBusy ? true : undefined}
            onClick={() => void submitVote("abstain")}
          >
            {t("governance_proposal_detail_vote_abstain")}
          </button>
        </div>
      </section>
    </article>
  );
}
