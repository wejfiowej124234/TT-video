"use client";

import { useEffect } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { GovernanceTxExplorerLink } from "@/components/governance/GovernanceTxExplorerLink";
import { GovernanceWalletConnectPanel } from "@/components/governance/GovernanceWalletConnectPanel";
import { useGovernanceCancelProposal } from "@/dapp/hooks/useGovernanceCancelProposal";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";

type Props = {
  governorAddress: `0x${string}` | null;
  proposalId: string;
  proposerAddress?: string | null;
  metaChainId?: number | null;
  onTxSuccess?: () => void;
};

/** 提案人 cancel · TravelTrustGovernor.cancel（投票结束前） */
export function GovernanceProposalCancelPanel({
  governorAddress,
  proposalId,
  proposerAddress,
  metaChainId,
  onTxSuccess,
}: Props) {
  const { t } = useTranslation();
  const { address, chainReady, wrongNetwork, expectedChainId, cancel, hash, busy, isSuccess, error } =
    useGovernanceCancelProposal(governorAddress, proposalId, metaChainId);

  const isProposer =
    address &&
    proposerAddress &&
    address.toLowerCase() === proposerAddress.trim().toLowerCase();

  useEffect(() => {
    if (isSuccess && onTxSuccess) onTxSuccess();
  }, [isSuccess, onTxSuccess]);

  const walletErr = mapWalletWriteError(error, t, {
    revertPatterns: [{ re: /GovNotProposer|GovBadState/i, messageKey: "governance_cancel_invalid_state" }],
    rejectKey: "wallet_txErrorUserRejected",
    genericKey: "governance_cancel_failed",
  });

  if (!isProposer) return null;

  return (
    <section className={`${GOV_PROPOSALS_L5.noticeSoft} mt-4`} data-tt-governance-cancel-panel="1">
      <h3 className={`text-small font-semibold text-slate-50`}>{t("governance_cancel_section_heading")}</h3>
      <p className={`mt-1 ${GOV_PROPOSALS_L5.cardHint}`}>{t("governance_cancel_section_lead")}</p>
      <GovernanceWalletConnectPanel wrongNetwork={wrongNetwork} expectedChainId={expectedChainId} compact />
      {walletErr ? <ApiErrorAlert message={walletErr} /> : null}
      <button
        type="button"
        className={`${GOV_PROPOSALS_L5.retryBtn} mt-3 !inline-flex`}
        disabled={busy || !chainReady}
        onClick={() => cancel()}
      >
        {busy ? t("governance_cancel_submitting") : t("governance_cancel_cta")}
      </button>
      {hash ? (
        <p className={`mt-2 ${GOV_PROPOSALS_L5.formHint}`}>
          {t("governance_onchain_vote_tx_submitted")}:{" "}
          <GovernanceTxExplorerLink chainId={expectedChainId} txHash={hash} />
        </p>
      ) : null}
      {isSuccess ? (
        <p className="mt-2 text-body text-emerald-300" role="status">
          {t("governance_cancel_success")}
        </p>
      ) : null}
    </section>
  );
}
