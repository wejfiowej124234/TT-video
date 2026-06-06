"use client";

import type { FormEvent } from "react";
import { TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT } from "@/lib/marketingUi";
import IntentSignFacts from "./IntentSignFacts";

export interface OrderActionsIntentConfirmPanelProps {
  orderId: string;
  expectedChainId: number;
  escrowAddress: `0x${string}`;
  variantDid?: boolean;
  metaClass: string;
  pillFocusClass: string;
  protocolPaused: boolean;
  busy: boolean;
  guideWalletMismatch: boolean;
  chainMismatch: boolean;
  loading: string | null;
  isSigning: boolean;
  isConnected: boolean;
  t: (key: string) => string;
  onSubmitIntent: (e: FormEvent<HTMLFormElement>) => void;
}

export function OrderActionsIntentConfirmPanel({
  orderId,
  expectedChainId,
  escrowAddress,
  variantDid,
  metaClass,
  pillFocusClass,
  protocolPaused,
  busy,
  guideWalletMismatch,
  chainMismatch,
  loading,
  isSigning,
  isConnected,
  t,
  onSubmitIntent,
}: OrderActionsIntentConfirmPanelProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <IntentSignFacts
        orderId={orderId}
        expectedChainId={expectedChainId}
        escrowAddress={escrowAddress}
        action="confirm_completion"
        variantDid={variantDid}
      />
      <p className={metaClass}>{t("escrow_confirmCompletionSignHint")}</p>
      <form className="contents" onSubmit={onSubmitIntent}>
        <button
          type="submit"
          disabled={protocolPaused || busy || guideWalletMismatch || chainMismatch}
          title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
          aria-busy={loading === "confirmIntent" || isSigning ? true : undefined}
          className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT} disabled:opacity-50 w-fit${variantDid ? ` ${pillFocusClass}` : ""}`}
        >
          {loading === "confirmIntent" || isSigning ? t("common_submitting") : t("escrow_confirmCompletionSign")}
        </button>
      </form>
      {!isConnected && <p className={metaClass}>{t("escrow_intentConnectWallet")}</p>}
      {isConnected && chainMismatch && (
        <p className="text-meta text-warning">{t("escrow_intentWrongChain")}</p>
      )}
    </div>
  );
}
