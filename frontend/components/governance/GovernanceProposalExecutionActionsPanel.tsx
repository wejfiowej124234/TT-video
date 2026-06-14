"use client";

import { useEffect, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { GovernanceTxExplorerLink } from "@/components/governance/GovernanceTxExplorerLink";
import { GovernanceWalletConnectPanel } from "@/components/governance/GovernanceWalletConnectPanel";
import { useGovernanceTimelockActions } from "@/dapp/hooks/useGovernanceTimelockActions";
import { deriveExecutionActionSurface, type GovernanceExecutionReadiness } from "@/lib/governanceExecutionReadiness";
import { GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";
import { GOVERNANCE_TIMELOCK_MAX_ACTIONS } from "@/lib/governance/governanceProposalCreateModel";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { travelTrustGovernorAbi } from "@/lib/governance/travelTrustGovernorAbi";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { useReadContract } from "wagmi";

export const GOV_EXEC_ACTIONS_HEADING_ID = "gov-exec-actions-heading";

type Props = {
  className?: string;
  readiness: GovernanceExecutionReadiness;
  governorAddress: `0x${string}` | null;
  proposalId: string;
  operationId?: string | null;
  metaChainId?: number | null;
  onTxSuccess?: () => void;
};

/** Timelock queue / execute · 钱包写操作（行业 OZ Governor 标准 · ① 本地 Anvil/meta） */
export default function GovernanceProposalExecutionActionsPanel({
  className,
  readiness,
  governorAddress,
  proposalId,
  operationId,
  metaChainId,
  onTxSuccess,
}: Props) {
  const { t } = useTranslation();
  const surface = useMemo(() => deriveExecutionActionSurface(readiness), [readiness]);
  const root = className?.trim() ? className : "";

  const { isConnected, chainReady, wrongNetwork, expectedChainId, queue, execute, hash, busy, isSuccess, error } =
    useGovernanceTimelockActions(governorAddress, proposalId, metaChainId);

  const actionsRead = useReadContract({
    address: governorAddress ?? undefined,
    abi: travelTrustGovernorAbi,
    functionName: "getProposalActions",
    args: proposalId.trim() ? [BigInt(proposalId.trim())] : undefined,
    query: { enabled: Boolean(governorAddress && proposalId.trim() && chainReady) },
  });

  const actionCount = actionsRead.data?.[0]?.length ?? null;
  const timelockSingleOpOk = actionCount === null || actionCount <= GOVERNANCE_TIMELOCK_MAX_ACTIONS;

  useEffect(() => {
    if (isSuccess && onTxSuccess) onTxSuccess();
  }, [isSuccess, onTxSuccess]);

  const walletErr = mapWalletWriteError(error, t, {
    revertPatterns: [
      { re: /GovernorUnexpectedProposalState|InvalidProposalState|GovSingleOpOnly|GovBadState/i, messageKey: "governance_timelock_invalid_state" },
      { re: /TimelockUnexpectedOperationState/i, messageKey: "governance_timelock_invalid_state" },
    ],
    rejectKey: "wallet_txErrorUserRejected",
    genericKey: "governance_timelock_tx_failed",
  });

  const baseBtn = `${GOV_PROPOSALS_L5.primarySubmit} !inline-flex min-h-[44px]`;
  const secondaryBtn = `${GOV_PROPOSALS_L5.retryBtn} !inline-flex min-h-[44px] ${travelFocusRingCoreOffset2Classes}`;
  const writeDisabled = busy || !isConnected || !chainReady || !governorAddress;
  const queueDisabled = writeDisabled || !surface.queueEnabled || !timelockSingleOpOk;

  return (
    <section
      className={`${GOV_PROPOSALS_L5.panelFrame} ${root}`}
      aria-labelledby={GOV_EXEC_ACTIONS_HEADING_ID}
      data-tt-governance-exec-actions-panel="1"
    >
      <div className={`${GOV_PROPOSALS_L5.panelInner} ${GOV_PROPOSALS_L5.panelBody}`}>
        <h3 id={GOV_EXEC_ACTIONS_HEADING_ID} className={GOV_PROPOSALS_L5.sectionHeading}>
          {t("governance_exec_actions_section_heading_live")}
        </h3>
        <p className={`mt-1 ${GOV_PROPOSALS_L5.cardHint}`}>{t("governance_exec_actions_section_lead_live")}</p>

        {operationId ? (
          <p className={`mt-2 font-mono break-all ${GOV_PROPOSALS_L5.formHint}`} data-tt-governance-timelock-op-id="1">
            {t("governance_timelock_operation_id")}: {operationId}
          </p>
        ) : null}

        {!timelockSingleOpOk ? (
          <p className="mt-2 text-body text-amber-200" role="note">
            {t("governance_create_timelock_single_action_warn", { max: GOVERNANCE_TIMELOCK_MAX_ACTIONS })}
          </p>
        ) : null}

        <aside className={`mt-3 ${GOV_PROPOSALS_L5.noticeSoft}`} aria-label={t("governance_exec_actions_limits_aria")}>
          <p className={`text-small font-semibold text-slate-50`}>{t("governance_exec_actions_limits_heading")}</p>
          <p className={`mt-1 ${GOV_PROPOSALS_L5.formHint}`}>{t(GovExecReadOnlyI18n.sharedLimitsSkeleton)}</p>
          {readiness.kind === "executable" ? (
            <p className={`mt-2 ${GOV_PROPOSALS_L5.formHint}`}>{t(GovExecReadOnlyI18n.sharedQueuedExplanation)}</p>
          ) : null}
        </aside>

        <GovernanceWalletConnectPanel wrongNetwork={wrongNetwork} expectedChainId={expectedChainId} compact />

        {walletErr ? (
          <div className="mt-3">
            <ApiErrorAlert message={walletErr} />
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={queueDisabled}
            title={
              surface.queueEnabled && timelockSingleOpOk
                ? t("governance_exec_action_queue_enabled_hint_live")
                : t("governance_exec_action_queue_disabled_hint")
            }
            className={baseBtn}
            data-tt-governance-exec-queue="1"
            onClick={() => queue()}
          >
            {busy ? t("governance_timelock_submitting") : t("governance_exec_action_queue_label")}
          </button>
          <button
            type="button"
            disabled={writeDisabled || !surface.executeEnabled}
            title={
              surface.executeEnabled
                ? t("governance_exec_action_execute_enabled_hint_live")
                : t("governance_exec_action_execute_disabled_hint")
            }
            className={secondaryBtn}
            data-tt-governance-exec-execute="1"
            onClick={() => execute()}
          >
            {busy ? t("governance_timelock_submitting") : t("governance_exec_action_execute_label")}
          </button>
        </div>

        {hash ? (
          <p className={`mt-2 ${GOV_PROPOSALS_L5.formHint}`} role="status">
            {t("governance_onchain_vote_tx_submitted")}:{" "}
            <GovernanceTxExplorerLink chainId={expectedChainId} txHash={hash} />
          </p>
        ) : null}
        {isSuccess ? (
          <p className="mt-2 text-body text-emerald-300" role="status">
            {t("governance_timelock_tx_confirmed")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
