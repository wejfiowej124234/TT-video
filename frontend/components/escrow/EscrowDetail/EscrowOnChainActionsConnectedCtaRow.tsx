"use client";

import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  TT_MARKETING_BTN_CONSOLE_DANGER,
  TT_MARKETING_BTN_CONSOLE_SUCCESS_OUTLINE,
  TT_MARKETING_BTN_CONSOLE_SUCCESS_SOLID,
  TT_MARKETING_BTN_CONSOLE_WARNING,
  TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL,
} from "@/lib/marketingUi";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function EscrowOnChainActionsConnectedCtaRow({
  protocolPaused,
  needsDepositApproval,
  approvalHintClass,
  onApproveForDeposit,
  approveDepositPending,
  depositAmount,
  depositPending,
  canDepositOnChain,
  canReleaseOnChain,
  canRefundOnChain,
  releaseBlockedStatusId,
  disputeBtnDisabled,
  disputeBtnTitle,
  disputePending,
  refundPending,
  releasePending,
  onSetConfirmAction,
  isDid,
  ctaFocusClass,
  t,
}: {
  protocolPaused: boolean;
  needsDepositApproval: boolean;
  approvalHintClass: string;
  onApproveForDeposit?: () => void;
  approveDepositPending: boolean;
  depositAmount: bigint | undefined;
  depositPending: boolean;
  canDepositOnChain: boolean;
  canReleaseOnChain: boolean;
  canRefundOnChain: boolean;
  releaseBlockedStatusId: string;
  disputeBtnDisabled: boolean;
  disputeBtnTitle: string | undefined;
  disputePending: boolean;
  refundPending: boolean;
  releasePending: boolean;
  onSetConfirmAction: (action: "deposit" | "release" | "refund" | "dispute") => void;
  isDid: boolean;
  ctaFocusClass: string;
  t: TFn;
}) {
  return (
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
              className={`${TT_MARKETING_BTN_CONSOLE_SUCCESS_OUTLINE} disabled:opacity-50 ${ctaFocusClass}`}
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
          className={`${TT_MARKETING_BTN_CONSOLE_SUCCESS_SOLID} disabled:opacity-50 ${ctaFocusClass}`}
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
          className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL} disabled:opacity-50${isDid ? ` ${ctaFocusClass}` : ""}`}
          title={
            protocolPaused ? t("escrow_protocolPause_title") : !canReleaseOnChain ? t("escrow_releaseDisabledHint") : undefined
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
            protocolPaused ? t("escrow_protocolPause_title") : !canRefundOnChain ? t("escrow_refundDisabledHint") : undefined
          }
          aria-busy={refundPending ? true : undefined}
          className={`${TT_MARKETING_BTN_CONSOLE_WARNING} px-4 py-2 disabled:opacity-50 ${ctaFocusClass}`}
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
          className={`${TT_MARKETING_BTN_CONSOLE_DANGER} px-4 py-2 disabled:opacity-50 ${ctaFocusClass}`}
          aria-busy={disputePending ? true : undefined}
        >
          {disputePending ? t("common_submitting") : t("escrow_openDispute")}
        </button>
      </form>
    </div>
  );
}
