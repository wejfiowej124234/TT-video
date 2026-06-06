"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { ConfirmAction } from "./types";
import { walletErrorRaw } from "@/lib/mapWalletWriteError";

export interface UseEscrowDetailChainWriteMachinesArgs {
  confirmAction: ConfirmAction;
  depositPending: boolean;
  depositSuccess: boolean;
  depositError: Error | null | undefined;
  resetDeposit: () => void;
  releasePending: boolean;
  releaseSuccess: boolean;
  releaseError: Error | null | undefined;
  resetRelease: () => void;
  refundPending: boolean;
  refundSuccess: boolean;
  refundError: Error | null | undefined;
  resetRefund: () => void;
  disputePending: boolean;
  disputeSuccess: boolean;
  disputeError: Error | null | undefined;
  resetDispute: () => void;
  approveDepositPending: boolean;
  approveDepositError: Error | null | undefined;
  resetApproveDeposit: () => void;
}

export function useEscrowDetailChainWriteMachines({
  confirmAction,
  depositPending,
  depositSuccess,
  depositError,
  resetDeposit,
  releasePending,
  releaseSuccess,
  releaseError,
  resetRelease,
  refundPending,
  refundSuccess,
  refundError,
  resetRefund,
  disputePending,
  disputeSuccess,
  disputeError,
  resetDispute,
  approveDepositPending,
  approveDepositError,
  resetApproveDeposit,
}: UseEscrowDetailChainWriteMachinesArgs) {
  const pending =
    depositPending || releasePending || refundPending || disputePending || approveDepositPending;
  const success = depositSuccess || releaseSuccess || refundSuccess || disputeSuccess;
  const failed =
    !!depositError ||
    !!releaseError ||
    !!refundError ||
    !!disputeError ||
    !!approveDepositError;

  const txModalMachine = useMemo((): { pending: boolean; success: boolean; failed: boolean } => {
    const a = confirmAction;
    if (a === "deposit") {
      return {
        pending: depositPending || approveDepositPending,
        success: depositSuccess && !depositError && !approveDepositError,
        failed: !!depositError || !!approveDepositError,
      };
    }
    if (a === "release") {
      return {
        pending: releasePending,
        success: releaseSuccess && !releaseError,
        failed: !!releaseError,
      };
    }
    if (a === "refund") {
      return {
        pending: refundPending,
        success: refundSuccess && !refundError,
        failed: !!refundError,
      };
    }
    if (a === "dispute") {
      return {
        pending: disputePending,
        success: disputeSuccess && !disputeError,
        failed: !!disputeError,
      };
    }
    return { pending: false, success: false, failed: false };
  }, [
    confirmAction,
    depositPending,
    approveDepositPending,
    depositSuccess,
    depositError,
    approveDepositError,
    releasePending,
    releaseSuccess,
    releaseError,
    refundPending,
    refundSuccess,
    refundError,
    disputePending,
    disputeSuccess,
    disputeError,
  ]);

  const txSectionMachine = useMemo((): { pending: boolean; success: boolean; failed: boolean } => {
    if (confirmAction != null) return txModalMachine;
    return {
      pending,
      failed,
      success: success && !failed,
    };
  }, [confirmAction, txModalMachine, pending, failed, success]);

  const resetChainWriteError = useCallback(() => {
    if (depositError) resetDeposit();
    else if (releaseError) resetRelease();
    else if (refundError) resetRefund();
    else if (disputeError) resetDispute();
    else if (approveDepositError) resetApproveDeposit();
  }, [
    depositError,
    releaseError,
    refundError,
    disputeError,
    approveDepositError,
    resetDeposit,
    resetRelease,
    resetRefund,
    resetDispute,
    resetApproveDeposit,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const errs = [depositError, releaseError, refundError, disputeError, approveDepositError].filter(
      Boolean,
    ) as Error[];
    if (errs.length === 0) return;
    for (const e of errs) {
      console.error("[useEscrowDetail] chain write error (raw, UI uses mapped i18n):", walletErrorRaw(e));
    }
  }, [depositError, releaseError, refundError, disputeError, approveDepositError]);

  return {
    pending,
    success,
    failed,
    txModalMachine,
    txSectionMachine,
    resetChainWriteError,
  };
}
