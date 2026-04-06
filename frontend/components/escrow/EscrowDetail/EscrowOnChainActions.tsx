"use client";

import { useEffect, useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { escrowChainTxErrorUserMessage } from "@/lib/mapEscrowChainTxError";
import { marketCyanPillControlFocusClasses, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import TxMachineStatus from "../TxMachineStatus";
import EscrowChainMismatchActions from "./EscrowChainMismatchActions";

export interface EscrowOnChainActionsProps {
  isConnected: boolean;
  /** 35 §3.1：错链时禁用链上按钮并提示 */
  chainMismatch?: boolean;
  expectedChainId?: number;
  chainId?: number;
  confirmAction: string | null;
  pending: boolean;
  success: boolean;
  failed: boolean;
  depositAmount: bigint | undefined;
  depositPending: boolean;
  releasePending: boolean;
  refundPending: boolean;
  disputePending: boolean;
  /** 争议窗口过期（链下 deadline）时禁用链上 openDispute 入口 */
  disputeDisabled?: boolean;
  /** B-037：与 OrderActionsBlock / API 可争议态一致 */
  canOpenDisputeOnChain?: boolean;
  /** B-037：`!canOpenDisputeOnChain` 时的 i18n 键（可发起时为 null） */
  disputeOnChainUnavailableReasonKey?: string | null;
  /** 53-S10：与 API 订单态、评分双确对齐，避免误点 revert */
  canDepositOnChain?: boolean;
  canReleaseOnChain?: boolean;
  canRefundOnChain?: boolean;
  /** ERC-20 allowance below deposit amount: approve before deposit */
  needsDepositApproval?: boolean;
  onApproveForDeposit?: () => void;
  approveDepositPending?: boolean;
  onSetConfirmAction: (action: "deposit" | "release" | "refund" | "dispute") => void;
  onDeposit: () => void;
  onRelease: () => void;
  onRefund: () => void;
  txErrorMessage: string;
  /** 清除链上写错误态以便重试（B-030） */
  onDismissTxError?: () => void;
  variantDid?: boolean;
  /** B-067：`GET /meta` `pause.enabled` 为真时统一门闸 */
  protocolPaused?: boolean;
}

export default function EscrowOnChainActions({
  isConnected,
  chainMismatch = false,
  expectedChainId = 0,
  chainId = 0,
  confirmAction,
  pending,
  success,
  failed,
  depositAmount,
  depositPending,
  releasePending,
  refundPending,
  disputePending,
  disputeDisabled = false,
  canOpenDisputeOnChain = true,
  disputeOnChainUnavailableReasonKey = null,
  canDepositOnChain = true,
  canReleaseOnChain = true,
  canRefundOnChain = true,
  needsDepositApproval = false,
  onApproveForDeposit,
  approveDepositPending = false,
  onSetConfirmAction,
  onDeposit,
  onRelease,
  onRefund,
  txErrorMessage,
  onDismissTxError,
  variantDid,
  protocolPaused = false,
}: EscrowOnChainActionsProps) {
  const { t } = useTranslation();
  const [walletDisconnectedTap, setWalletDisconnectedTap] = useState(false);
  const headingId = useId();
  const releaseBlockedStatusId = useId();
  const isDid = !!variantDid;

  useEffect(() => {
    if (isConnected) setWalletDisconnectedTap(false);
  }, [isConnected]);
  const sectionClass = isDid
    ? "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-8 shadow-scifi-panel space-y-4"
    : "rounded-[var(--radius-sm)] bg-bg-console p-8 shadow-soft space-y-4";
  const hClass = isDid ? "text-body-l font-semibold text-cyan-200" : "text-body-l font-semibold text-ink-800";
  const hintClass = isDid ? "text-small text-slate-300" : "text-small text-ink-500";
  const approvalHintClass = isDid ? "w-full text-small text-slate-300" : "w-full text-small text-ink-600";
  const ctaFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

  const disputeBtnDisabled =
    protocolPaused || disputePending || disputeDisabled || !canOpenDisputeOnChain;
  const disputeBtnTitle = protocolPaused
    ? t("escrow_protocolPause_title")
    : disputeDisabled
      ? t("escrow_disputeWindowExpired")
      : !canOpenDisputeOnChain && disputeOnChainUnavailableReasonKey
        ? t(disputeOnChainUnavailableReasonKey)
        : undefined;

  return (
    <section className={sectionClass} aria-labelledby={headingId}>
      <h3 id={headingId} className={hClass}>
        {t("escrow_onChainActions")}
      </h3>
      <TxMachineStatus
        pending={pending}
        success={success}
        failed={failed}
        variantDid={variantDid}
        signing={!!confirmAction && !pending && !success && !failed}
        longPrefix
      />
      {protocolPaused ? (
        <p className={hintClass} role="status">
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      {!isConnected ? (
        <div className="space-y-2">
          <p className={hintClass}>{t("escrow_connectWalletHint")}</p>
          {walletDisconnectedTap && (
            <p
              className={isDid ? "text-small text-warning/95" : "text-small text-warning"}
              role="alert"
            >
              {t("escrow_connectWalletUseHeader")}
            </p>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              disabled={protocolPaused}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              onClick={() => {
                if (protocolPaused) return;
                setWalletDisconnectedTap(true);
              }}
              className={`btn-console rounded-[var(--radius-sm)] bg-success px-4 py-2 text-white text-small disabled:opacity-50 ${ctaFocusClass}`}
            >
              {t("escrow_deposit")}
            </button>
            <button
              type="button"
              disabled={protocolPaused}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              onClick={() => {
                if (protocolPaused) return;
                setWalletDisconnectedTap(true);
              }}
              className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${ctaFocusClass}`}
            >
              {t("escrow_release")}
            </button>
            <button
              type="button"
              disabled={protocolPaused}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              onClick={() => {
                if (protocolPaused) return;
                setWalletDisconnectedTap(true);
              }}
              className={`btn-console rounded-[var(--radius-sm)] border border-warning px-4 py-2 text-warning disabled:opacity-50 ${ctaFocusClass}`}
            >
              {t("escrow_refund")}
            </button>
            <button
              type="button"
              disabled={disputeBtnDisabled}
              title={disputeBtnTitle}
              onClick={() => {
                if (protocolPaused || disputeBtnDisabled) return;
                setWalletDisconnectedTap(true);
              }}
              className={`btn-console rounded-[var(--radius-sm)] border border-danger px-4 py-2 text-danger disabled:opacity-50 ${ctaFocusClass}`}
            >
              {t("escrow_openDispute")}
            </button>
          </div>
        </div>
      ) : chainMismatch ? (
        <div className="space-y-1">
          <p className="text-small text-warning" role="alert">
            {t("escrow_wrongChainDesc")
              .replace("{expectedChainId}", String(expectedChainId))
              .replace("{chainId}", String(chainId))}
          </p>
          <EscrowChainMismatchActions
            isConnected={isConnected}
            expectedChainId={expectedChainId}
            chainId={chainId}
            variantDid={isDid}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 items-center">
          {needsDepositApproval && (
            <>
              <p className={approvalHintClass} role="status">
                {t("escrow_depositNeedsApprovalHint")}
              </p>
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (protocolPaused) return;
                  onApproveForDeposit?.();
                }}
              >
                <button
                  type="submit"
                  disabled={protocolPaused || approveDepositPending || !onApproveForDeposit}
                  className={`btn-console rounded-[var(--radius-sm)] border border-success/60 bg-success/15 px-4 py-2 text-success text-small disabled:opacity-50 ${ctaFocusClass}`}
                  aria-busy={approveDepositPending ? true : undefined}
                >
                  {approveDepositPending ? t("escrow_approveForDepositConfirming") : t("escrow_approveForDeposit")}
                </button>
              </form>
            </>
          )}
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              if (protocolPaused) return;
              onSetConfirmAction("deposit");
            }}
          >
            <button
              type="submit"
              disabled={
                protocolPaused ||
                depositPending ||
                !depositAmount ||
                !canDepositOnChain ||
                needsDepositApproval ||
                approveDepositPending
              }
              className={`btn-console rounded-[var(--radius-sm)] bg-success px-4 py-2 text-white text-small disabled:opacity-50 ${ctaFocusClass}`}
              title={
                protocolPaused
                  ? t("escrow_protocolPause_title")
                  : !depositAmount
                    ? t("escrow_orderAmountInvalid")
                    : !canDepositOnChain
                      ? t("escrow_depositDisabledHint")
                      : needsDepositApproval || approveDepositPending
                        ? t("escrow_depositNeedsApprovalHint")
                        : undefined
              }
              aria-busy={depositPending ? true : undefined}
            >
              {depositPending ? t("escrow_depositConfirming") : t("escrow_deposit")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              if (protocolPaused) return;
              onSetConfirmAction("release");
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || releasePending || !canReleaseOnChain}
              className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${ctaFocusClass}`}
              title={
                protocolPaused
                  ? t("escrow_protocolPause_title")
                  : !canReleaseOnChain
                    ? t("escrow_releaseDisabledHint")
                    : undefined
              }
              aria-describedby={!canReleaseOnChain ? releaseBlockedStatusId : undefined}
              aria-busy={releasePending ? true : undefined}
            >
              {releasePending ? t("escrow_releaseConfirming") : t("escrow_release")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              if (protocolPaused) return;
              onSetConfirmAction("refund");
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || refundPending || !canRefundOnChain}
              title={
                protocolPaused
                  ? t("escrow_protocolPause_title")
                  : !canRefundOnChain
                    ? t("escrow_refundDisabledHint")
                    : undefined
              }
              aria-busy={refundPending ? true : undefined}
              className={`btn-console rounded-[var(--radius-sm)] border border-warning px-4 py-2 text-warning disabled:opacity-50 ${ctaFocusClass}`}
            >
              {refundPending ? t("common_submitting") : t("escrow_refund")}
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              if (protocolPaused || disputeBtnDisabled) return;
              onSetConfirmAction("dispute");
            }}
          >
            <button
              type="submit"
              disabled={disputeBtnDisabled}
              title={disputeBtnTitle}
              className={`btn-console rounded-[var(--radius-sm)] border border-danger px-4 py-2 text-danger disabled:opacity-50 ${ctaFocusClass}`}
              aria-busy={disputePending ? true : undefined}
            >
              {disputePending ? t("common_submitting") : t("escrow_openDispute")}
            </button>
          </form>
        </div>
      )}
      {isConnected && !chainMismatch && !canReleaseOnChain ? (
        <p id={releaseBlockedStatusId} className={hintClass} role="status">
          {t("escrow_releaseDisabledHint")}
        </p>
      ) : null}
      {isConnected && !chainMismatch && !canOpenDisputeOnChain && disputeOnChainUnavailableReasonKey ? (
        <p className={hintClass} role="status">
          {t(disputeOnChainUnavailableReasonKey)}
        </p>
      ) : null}
      {success && !failed && (
        <p className="text-small text-success" role="status">
          {t("escrow_txSubmittedWaitConfirm")}
        </p>
      )}
      {txErrorMessage && (
        <div className="text-small text-danger space-y-2" role="alert">
          <p>{escrowChainTxErrorUserMessage(txErrorMessage, t)}</p>
          {failed && onDismissTxError && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onDismissTxError();
              }}
            >
              <button
                type="submit"
                className={
                  isDid
                    ? `text-small text-cyan-300 underline-offset-2 hover:underline ${ctaFocusClass}`
                    : `text-small text-travel-600 underline-offset-2 hover:underline ${ctaFocusClass}`
                }
              >
                {t("common_closeAlert")}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
