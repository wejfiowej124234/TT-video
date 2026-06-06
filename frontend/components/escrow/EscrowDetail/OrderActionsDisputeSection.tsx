"use client";

import type { FormEvent } from "react";
import { TT_MARKETING_BTN_CONSOLE_DANGER } from "@/lib/marketingUi";
import IntentSignFacts from "./IntentSignFacts";

export interface OrderActionsDisputeSectionProps {
  orderId: string;
  expectedChainId: number;
  escrowAddress: `0x${string}` | undefined;
  variantDid?: boolean;
  metaClass: string;
  labelClass: string;
  pillFocusClass: string;
  protocolPaused: boolean;
  busy: boolean;
  chainMismatch: boolean;
  loading: string | null;
  isSigning: boolean;
  isConnected: boolean;
  disputeReasonSummary: string;
  setDisputeReasonSummary: (v: string) => void;
  t: (key: string) => string;
  canChainOffDispute: boolean;
  canEscrowDisputeIntent: boolean;
  onOpenDisputeOffchain: (e: FormEvent<HTMLFormElement>) => void;
  onOpenDisputeIntent: (e: FormEvent<HTMLFormElement>) => void;
}

export function OrderActionsDisputeSection({
  orderId,
  expectedChainId,
  escrowAddress,
  variantDid,
  metaClass,
  labelClass,
  pillFocusClass,
  protocolPaused,
  busy,
  chainMismatch,
  loading,
  isSigning,
  isConnected,
  disputeReasonSummary,
  setDisputeReasonSummary,
  t,
  canChainOffDispute,
  canEscrowDisputeIntent,
  onOpenDisputeOffchain,
  onOpenDisputeIntent,
}: OrderActionsDisputeSectionProps) {
  const isDid = !!variantDid;
  return (
    <>
      {canChainOffDispute && (
        <form className="contents" onSubmit={onOpenDisputeOffchain}>
          <button
            type="submit"
            disabled={protocolPaused || busy}
            title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
            aria-busy={loading === "openDispute" ? true : undefined}
            className={`${TT_MARKETING_BTN_CONSOLE_DANGER} disabled:opacity-50 ${pillFocusClass}`}
          >
            {loading === "openDispute" ? t("common_submitting") : t("escrow_openDisputeOffchain")}
          </button>
        </form>
      )}
      {canEscrowDisputeIntent && escrowAddress && (
        <div className="w-full flex flex-col gap-1.5 mt-1">
          <IntentSignFacts
            orderId={orderId}
            expectedChainId={expectedChainId}
            escrowAddress={escrowAddress}
            action="open_dispute"
            disputeSummaryOrHash={disputeReasonSummary.trim() || undefined}
            variantDid={variantDid}
          />
          <p className={`${metaClass} max-w-md`}>{t("escrow_openDisputeIntentHint")}</p>
          <label className={`${labelClass} max-w-md`} htmlFor={`dispute-reason-${orderId}`}>
            {t("escrow_disputeReasonLabel")}
          </label>
          <textarea
            id={`dispute-reason-${orderId}`}
            value={disputeReasonSummary}
            onChange={(e) => setDisputeReasonSummary(e.target.value)}
            rows={2}
            className={`w-full max-w-md rounded-[var(--radius-sm)] border bg-white px-2 py-1.5 text-small text-ink-800 placeholder:text-ink-400 ${
              isDid
                ? "border-slate-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                : "border-ink-200"
            }`}
            placeholder={t("escrow_disputeReasonPlaceholder")}
            disabled={protocolPaused || busy}
            aria-busy={busy ? true : undefined}
          />
          <p className={`${metaClass} max-w-md`}>{t("escrow_disputeReasonHashHint")}</p>
          <form className="contents" onSubmit={onOpenDisputeIntent}>
            <button
              type="submit"
              disabled={protocolPaused || busy || chainMismatch}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              aria-busy={loading === "openDisputeIntent" || isSigning ? true : undefined}
              className={`${TT_MARKETING_BTN_CONSOLE_DANGER} w-fit disabled:opacity-50 ${pillFocusClass}`}
            >
              {loading === "openDisputeIntent" || isSigning
                ? t("common_submitting")
                : t("escrow_openDisputeIntentSign")}
            </button>
          </form>
          {!isConnected && <p className={metaClass}>{t("escrow_intentConnectWallet")}</p>}
          {isConnected && chainMismatch && (
            <p className="text-meta text-warning">{t("escrow_intentWrongChain")}</p>
          )}
        </div>
      )}
    </>
  );
}
