"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import GovernanceProposalExecStatusBadge, {
  type GovernanceProposalExecStatusEntry,
} from "@/components/governance/GovernanceProposalExecStatusBadge";
import { GOV_EXEC_LIST_BRIDGE_DOM_ID, GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";
import {
  computeGovernanceVoteBarSegments,
  formatGovernanceAddressForList,
  formatGovernanceProposalIdForList,
  governanceProposalCardStatusHintKey,
  type GovernanceProposalListSummary,
} from "@/lib/governance/governanceProposalsListModel";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";

type Props = {
  proposalId: string;
  title: string;
  href: string;
  showOnChainPanel: boolean;
  chainExecLoading: boolean;
  chainExecById: Record<string, GovernanceProposalExecStatusEntry> | undefined;
  summary?: GovernanceProposalListSummary | null;
  summaryLoading?: boolean;
};

export function GovernanceProposalListCard({
  proposalId,
  title,
  href,
  showOnChainPanel,
  chainExecLoading,
  chainExecById,
  summary,
  summaryLoading,
}: Props) {
  const { t } = useTranslation();
  const idLabel = formatGovernanceProposalIdForList(proposalId);
  const exec = showOnChainPanel && chainExecById ? chainExecById[proposalId] : undefined;
  const execStatus = exec && exec.state === "ok" ? exec.status : "";
  const hintKey = execStatus ? governanceProposalCardStatusHintKey(execStatus) : null;
  const proposer =
    summary?.proposer && summary.proposer.trim()
      ? formatGovernanceAddressForList(summary.proposer)
      : null;
  const { total, segments } = computeGovernanceVoteBarSegments(
    summary?.yes ?? 0,
    summary?.no ?? 0,
    summary?.abstain ?? 0,
  );

  return (
    <div className={GOV_PROPOSALS_L5.proposalCardFrame}>
      <div className={GOV_PROPOSALS_L5.proposalCardInner}>
        <div className={GOV_PROPOSALS_L5.panelGlow} aria-hidden />
        <div className="relative z-[1] space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={href}
                className={`${GOV_PROPOSALS_L5.proposalTitle} ${GOV_PROPOSALS_L5.linkFocus}`}
                {...(showOnChainPanel
                  ? {
                      "aria-describedby": GOV_EXEC_LIST_BRIDGE_DOM_ID,
                      title: t(GovExecReadOnlyI18n.proposalLinkContinueTitle),
                    }
                  : {})}
              >
                {title}
              </Link>
              <p className={GOV_PROPOSALS_L5.proposalMeta} title={idLabel.full}>
                {t("governance_proposals_card_id")}: {idLabel.display}
              </p>
              {proposer ? (
                <p className={GOV_PROPOSALS_L5.proposalMeta} title={proposer.full}>
                  {t("governance_proposals_card_proposer")}: {proposer.display}
                </p>
              ) : null}
              {hintKey ? <p className={GOV_PROPOSALS_L5.cardHint}>{t(hintKey)}</p> : null}
            </div>
            {showOnChainPanel ? (
              <GovernanceProposalExecStatusBadge
                variant="list"
                loading={chainExecLoading}
                fetchSettled={chainExecById !== undefined}
                entry={exec}
              />
            ) : null}
          </div>

          {summaryLoading ? (
            <p className={`mt-2 ${GOV_PROPOSALS_L5.mutedNote}`} aria-live="polite">
              {t("governance_proposals_card_summary_loading")}
            </p>
          ) : null}

          {!summaryLoading && summary && total > 0 ? (
            <div className="mt-1" aria-label={t("governance_proposals_card_vote_bar_aria")}>
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
          ) : null}

          {!summaryLoading && summary && total === 0 && showOnChainPanel ? (
            <p className={`mt-2 ${GOV_PROPOSALS_L5.mutedNote}`}>{t("governance_proposals_card_no_votes")}</p>
          ) : null}

          {summary?.voteEndBlock != null && execStatus === "active" ? (
            <p className={GOV_PROPOSALS_L5.mutedNote}>
              {t("governance_proposals_card_vote_end")}: #{summary.voteEndBlock}
            </p>
          ) : null}

          <Link
            href={href}
            className={`${GOV_PROPOSALS_L5.cardCta} ${GOV_PROPOSALS_L5.linkFocus}`}
          >
            {t("governance_proposals_card_view_detail")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
