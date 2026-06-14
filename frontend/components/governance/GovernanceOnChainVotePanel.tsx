"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { GovernanceTxExplorerLink } from "@/components/governance/GovernanceTxExplorerLink";
import { GovernanceWalletConnectPanel } from "@/components/governance/GovernanceWalletConnectPanel";
import { useGovernanceCastVote } from "@/dapp/hooks/useGovernanceCastVote";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import {
  TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT,
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
} from "@/lib/marketingUi";
import type { GovernanceCastVoteCalldata } from "@/lib/apiClient";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type Props = {
  proposalId: string;
  governorAddress: `0x${string}` | null;
  metaChainId?: number | null;
  hasSession: boolean;
  loginHref: string;
  canCastVote: boolean | null | undefined;
  votingPowerReason?: string;
  castVoteCalldata?: GovernanceCastVoteCalldata | null;
  onTxSuccess?: () => void;
};

export default function GovernanceOnChainVotePanel({
  proposalId,
  governorAddress,
  metaChainId,
  hasSession,
  loginHref,
  canCastVote,
  votingPowerReason,
  castVoteCalldata,
  onTxSuccess,
}: Props) {
  const { t } = useTranslation();
  const { isConnected, chainReady, wrongNetwork, expectedChainId, castVote, hash, busy, isSuccess, error } =
    useGovernanceCastVote(governorAddress, proposalId, metaChainId);

  useEffect(() => {
    if (isSuccess && onTxSuccess) onTxSuccess();
  }, [isSuccess, onTxSuccess]);

  const walletErr = mapWalletWriteError(error, t, {
    revertPatterns: [
      { re: /GovernorAlreadyCastVote|already cast/i, messageKey: "governance_onchain_vote_already_cast" },
      { re: /GovernorInvalidProposalState|InvalidProposalState/i, messageKey: "governance_onchain_vote_invalid_state" },
    ],
    rejectKey: "wallet_txErrorUserRejected",
    genericKey: "governance_onchain_vote_failed",
  });

  const btnClass = `${TT_MARKETING_BTN_SECONDARY_CONSOLE} min-h-[44px] rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-white`;
  const primaryBtnClass = `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} min-h-[44px] rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-white`;

  const voteDisabled =
    busy || !hasSession || !chainReady || !governorAddress || canCastVote === false;

  return (
    <div className="space-y-3" data-tt-governance-onchain-vote-panel="1">
      <p className="text-body text-ink-800 dark:text-ink-100">{t("governance_onchain_vote_lead")}</p>

      <GovernanceWalletConnectPanel wrongNetwork={wrongNetwork} expectedChainId={expectedChainId} compact />

      {!hasSession ? (
        <Link
          href={loginHref}
          className={`${touchTargetLink44Classes} inline-flex items-center font-medium ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
        >
          {t("governance_proposal_detail_go_login")}
        </Link>
      ) : null}

      {hasSession && !isConnected ? (
        <p className="text-body text-ink-700 dark:text-ink-200" role="status">
          {t("governance_onchain_vote_connect_wallet")}
        </p>
      ) : null}

      {canCastVote === false && votingPowerReason === "delegation_active_cannot_vote" ? (
        <p className="text-body text-ink-700 dark:text-ink-200">
          {t("governance_voting_power_delegated_away")}{" "}
          <Link href="/governance/delegate" className={`${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}>
            {t("governance_delegate_nav")}
          </Link>
        </p>
      ) : null}

      {walletErr ? <ApiErrorAlert message={walletErr} /> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtnClass} disabled={voteDisabled} onClick={() => castVote("yes")}>
          {busy ? t("governance_proposal_detail_vote_submitting") : t("governance_proposal_detail_vote_yes")}
        </button>
        <button type="button" className={btnClass} disabled={voteDisabled} onClick={() => castVote("no")}>
          {t("governance_proposal_detail_vote_no")}
        </button>
        <button type="button" className={btnClass} disabled={voteDisabled} onClick={() => castVote("abstain")}>
          {t("governance_proposal_detail_vote_abstain")}
        </button>
      </div>

      {hash ? (
        <p className="text-meta text-ink-600 dark:text-ink-300" role="status">
          {t("governance_onchain_vote_tx_submitted")}:{" "}
          <GovernanceTxExplorerLink chainId={expectedChainId} txHash={hash} />
        </p>
      ) : null}

      {isSuccess ? (
        <p className="text-body text-travel-700 dark:text-travel-300" role="status">
          {t("governance_onchain_vote_tx_confirmed")}
        </p>
      ) : null}

      {castVoteCalldata ? (
        <details className="rounded-[var(--radius-sm)] border border-ink-200/80 bg-white/70 p-3 dark:border-ink-600/40 dark:bg-ink-950/30">
          <summary className="cursor-pointer text-small font-medium text-ink-800 dark:text-ink-100">
            {t("governance_onchain_vote_calldata_toggle")}
          </summary>
          <div className="mt-2 space-y-2 text-meta">
            {(["yes", "no", "abstain"] as const).map((key) => (
              <div key={key}>
                <span className="font-medium">{t(`governance_proposal_calldata_${key}`)}</span>
                <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                  {castVoteCalldata[key] ?? "—"}
                </pre>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
