"use client";

import { useId, useState, useRef, useEffect } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useOrderIntentSigner } from "@/dapp/hooks/useOrderIntentSigner";
import { sameWallet } from "./utils";
import {
  deriveOrderActionFlags,
  isEscrowEthAddress,
  normalizeOrderState,
  shouldShowOrderActionsBlock,
  type OrderActionsBlockProps,
} from "@/components/escrow/EscrowDetail/orderActionsBlockModel";
import { deriveOrderActionsBlockPresentation } from "@/components/escrow/EscrowDetail/orderActionsBlockPresentation";
import { buildOrderActionsBlockOffchainHandlers } from "@/components/escrow/EscrowDetail/orderActionsBlockOffchainHandlers";
import { buildOrderActionsBlockIntentHandlers } from "@/components/escrow/EscrowDetail/orderActionsBlockIntentHandlers";
import type {
  OrderActionsBlockViewModel,
  OrderActionsBlockViewShown,
} from "@/components/escrow/EscrowDetail/orderActionsBlockHookTypes";

export type {
  OrderActionsBlockViewHidden,
  OrderActionsBlockViewModel,
  OrderActionsBlockViewShown,
} from "@/components/escrow/EscrowDetail/orderActionsBlockHookTypes";

export function useOrderActionsBlock({
  orderId,
  state,
  hasEscrow,
  onSuccess,
  guideWalletAddress,
  connectedAddress,
  escrowAddress,
  expectedChainId,
  disputeWindowExpired = false,
  variantDid,
  protocolPaused = false,
  chainOffRestConfirmCompletionEnabled = false,
}: OrderActionsBlockProps): OrderActionsBlockViewModel {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [errAction, setErrAction] = useState<string | null>(null);
  const [intentOk, setIntentOk] = useState<string | null>(null);
  const [disputeReasonSummary, setDisputeReasonSummary] = useState("");
  const [intentWalletDisconnectedTap, setIntentWalletDisconnectedTap] = useState(false);
  const acceptIdempotencyKeyRef = useRef<string | null>(null);
  const cancelIdempotencyKeyRef = useRef<string | null>(null);
  const confirmCompletionIdempotencyKeyRef = useRef<string | null>(null);
  const orderActionsHeadingId = useId();
  const guideWalletAlertId = useId();
  const acceptOtherPendingId = useId();

  const {
    isConnected,
    chainMismatch,
    isSigning,
    submitConfirmCompletionIntent,
    submitOpenDisputeIntent,
  } = useOrderIntentSigner(expectedChainId);

  useEffect(() => {
    if (isConnected) setIntentWalletDisconnectedTap(false);
  }, [isConnected]);

  const stateNorm = normalizeOrderState(state);
  const derived = deriveOrderActionFlags({
    stateNorm,
    hasEscrow,
    escrowAddress,
    disputeWindowExpired,
    chainOffRestConfirmCompletionEnabled,
  });

  const {
    canAccept,
    canCancel,
    canConfirmCompletion,
    canChainOffDispute,
    validEscrow,
    canEscrowDisputeIntent,
    showOffchainConfirm,
    showIntentConfirm,
  } = derived;

  const needGuideWallet = canAccept || canConfirmCompletion;
  const guideWalletMismatch =
    needGuideWallet &&
    !!guideWalletAddress &&
    !!connectedAddress &&
    !sameWallet(guideWalletAddress, connectedAddress);

  if (!shouldShowOrderActionsBlock(derived)) {
    return { visible: false };
  }

  const busy = loading !== null || isSigning;
  const pres = deriveOrderActionsBlockPresentation({
    variantDid,
    canAccept,
    busy,
    loading,
    guideWalletMismatch,
    t,
    guideWalletAlertId,
    acceptOtherPendingId,
  });
  const {
    isDid,
    pillFocusClass,
    rootClass,
    hClass,
    metaClass,
    labelClass,
    acceptBlockedByOtherPending,
    acceptButtonTitle,
    acceptButtonDescribedBy,
  } = pres;

  const escrowHex: `0x${string}` | undefined =
    validEscrow && escrowAddress && isEscrowEthAddress(escrowAddress) ? escrowAddress : undefined;

  const {
    onAcceptSubmit,
    onCancelSubmit,
    onConfirmOffchainSubmit,
    onOpenDisputeOffchain,
    onRetryAccept,
  } = buildOrderActionsBlockOffchainHandlers({
    orderId,
    protocolPaused,
    t,
    onSuccess,
    setLoading,
    setErr,
    setErrAction,
    setIntentOk,
    acceptIdempotencyKeyRef,
    cancelIdempotencyKeyRef,
    confirmCompletionIdempotencyKeyRef,
  });

  const { onIntentConfirmSubmit, onOpenDisputeIntent } = buildOrderActionsBlockIntentHandlers({
    orderId,
    protocolPaused,
    escrowHex,
    isConnected,
    disputeReasonSummary,
    t,
    onSuccess,
    setIntentWalletDisconnectedTap,
    setLoading,
    setErr,
    setErrAction,
    setIntentOk,
    submitConfirmCompletionIntent,
    submitOpenDisputeIntent,
  });

  const shown: OrderActionsBlockViewShown = {
    visible: true,
    orderActionsHeadingId,
    guideWalletAlertId,
    acceptOtherPendingId,
    rootClass,
    hClass,
    metaClass,
    labelClass,
    pillFocusClass,
    isDid,
    busy,
    t,
    guideWalletMismatch,
    acceptBlockedByOtherPending,
    acceptButtonTitle,
    acceptButtonDescribedBy,
    escrowHex,
    onRetryAccept,
    onClearErr: () => {
      setErr(null);
      setErrAction(null);
    },
    canAccept,
    canCancel,
    showOffchainConfirm,
    showIntentConfirm,
    protocolPaused,
    loading,
    err,
    errAction,
    intentOk,
    intentWalletDisconnectedTap,
    onAcceptSubmit,
    onCancelSubmit,
    onConfirmOffchainSubmit,
    onIntentConfirmSubmit,
    onOpenDisputeOffchain,
    onOpenDisputeIntent,
    disputeReasonSummary,
    setDisputeReasonSummary,
    canChainOffDispute,
    canEscrowDisputeIntent,
    orderId,
    expectedChainId,
    variantDid,
    chainMismatch,
    isSigning,
    isConnected,
  };
  return shown;
}
