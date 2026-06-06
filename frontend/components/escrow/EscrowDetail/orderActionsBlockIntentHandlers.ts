import type { FormEvent } from "react";
import { escrowDisputeSummaryToReasonHash } from "@/lib/escrowDisputeReason";
import { mapIntentError } from "@/lib/mapIntentError";

export type OrderActionsBlockIntentHandlersInput = {
  orderId: string;
  protocolPaused: boolean;
  escrowHex: `0x${string}` | undefined;
  isConnected: boolean;
  disputeReasonSummary: string;
  t: (key: string) => string;
  onSuccess: () => void;
  setIntentWalletDisconnectedTap: (v: boolean) => void;
  setLoading: (v: string | null) => void;
  setErr: (v: string | null) => void;
  setErrAction: (v: string | null) => void;
  setIntentOk: (v: string | null) => void;
  submitConfirmCompletionIntent: (orderId: string, escrowHex: `0x${string}`) => Promise<unknown>;
  submitOpenDisputeIntent: (
    orderId: string,
    escrowHex: `0x${string}`,
    reasonHash?: `0x${string}`,
  ) => Promise<unknown>;
};

export function buildOrderActionsBlockIntentHandlers(input: OrderActionsBlockIntentHandlersInput) {
  const {
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
  } = input;

  const onIntentConfirmSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (protocolPaused) return;
    if (!escrowHex) return;
    if (!isConnected) {
      setIntentWalletDisconnectedTap(true);
      return;
    }
    setLoading("confirmIntent");
    setErr(null);
    setErrAction(null);
    setIntentOk(null);
    submitConfirmCompletionIntent(orderId, escrowHex)
      .then(() => {
        setIntentOk(t("escrow_intentAccepted"));
        onSuccess();
      })
      .catch((submitErr) => {
        if (typeof window !== "undefined") {
          console.error("OrderActionsBlock confirmCompletionIntent:", submitErr);
        }
        setErrAction(null);
        setErr(mapIntentError(submitErr, t));
      })
      .finally(() => setLoading(null));
  };

  const onOpenDisputeIntent = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (protocolPaused) return;
    if (!escrowHex) return;
    if (!isConnected) {
      setIntentWalletDisconnectedTap(true);
      return;
    }
    const trimmed = disputeReasonSummary.trim();
    let reasonHash: `0x${string}` | undefined;
    if (trimmed.length > 0) {
      const conv = escrowDisputeSummaryToReasonHash(trimmed);
      if (!conv.ok) {
        setErrAction(null);
        setErr(t("escrow_disputeReasonTooShort"));
        return;
      }
      reasonHash = conv.hash;
    }
    setLoading("openDisputeIntent");
    setErr(null);
    setErrAction(null);
    setIntentOk(null);
    submitOpenDisputeIntent(orderId, escrowHex, reasonHash)
      .then(() => {
        setIntentOk(t("escrow_intentAccepted"));
        onSuccess();
      })
      .catch((submitErr) => {
        if (typeof window !== "undefined") {
          console.error("OrderActionsBlock openDisputeIntent:", submitErr);
        }
        setErrAction(null);
        setErr(mapIntentError(submitErr, t));
      })
      .finally(() => setLoading(null));
  };

  return { onIntentConfirmSubmit, onOpenDisputeIntent };
}
