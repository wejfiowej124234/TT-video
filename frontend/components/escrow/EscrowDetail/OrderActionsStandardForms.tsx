"use client";

import type { FormEvent } from "react";
import {
  TT_MARKETING_BTN_CONSOLE_DANGER,
  TT_MARKETING_BTN_CONSOLE_SUCCESS,
  TT_MARKETING_BTN_CONSOLE_WARNING,
  TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT,
} from "@/lib/marketingUi";

export interface OrderActionsStandardFormsProps {
  canAccept: boolean;
  canCancel: boolean;
  showOffchainConfirm: boolean;
  protocolPaused: boolean;
  busy: boolean;
  guideWalletMismatch: boolean;
  loading: string | null;
  pillFocusClass: string;
  t: (key: string) => string;
  acceptButtonTitle: string | undefined;
  acceptButtonDescribedBy: string | undefined;
  onAccept: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: (e: FormEvent<HTMLFormElement>) => void;
  onConfirmOffchain: (e: FormEvent<HTMLFormElement>) => void;
}

export function OrderActionsStandardForms({
  canAccept,
  canCancel,
  showOffchainConfirm,
  protocolPaused,
  busy,
  guideWalletMismatch,
  loading,
  pillFocusClass,
  t,
  acceptButtonTitle,
  acceptButtonDescribedBy,
  onAccept,
  onCancel,
  onConfirmOffchain,
}: OrderActionsStandardFormsProps) {
  return (
    <>
      {canAccept && (
        <form className="contents" onSubmit={onAccept}>
          <button
            type="submit"
            disabled={protocolPaused || busy || guideWalletMismatch}
            aria-busy={loading === "accept" ? true : undefined}
            title={protocolPaused ? t("escrow_protocolPause_title") : acceptButtonTitle}
            aria-describedby={acceptButtonDescribedBy}
            className={`${TT_MARKETING_BTN_CONSOLE_SUCCESS} ${pillFocusClass}`}
          >
            {loading === "accept" ? t("common_submitting") : t("escrow_accept")}
          </button>
        </form>
      )}
      {canCancel && (
        <form className="contents" onSubmit={onCancel}>
          <button
            type="submit"
            disabled={protocolPaused || busy}
            title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
            aria-busy={loading === "cancel" ? true : undefined}
            className={`${TT_MARKETING_BTN_CONSOLE_WARNING} ${pillFocusClass}`}
          >
            {loading === "cancel" ? t("common_submitting") : t("escrow_cancelOrder")}
          </button>
        </form>
      )}
      {showOffchainConfirm && (
        <form className="contents" onSubmit={onConfirmOffchain}>
          <button
            type="submit"
            disabled={protocolPaused || busy || guideWalletMismatch}
            title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
            aria-busy={loading === "confirmCompletion" ? true : undefined}
            className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT} disabled:opacity-50 ${pillFocusClass}`}
          >
            {loading === "confirmCompletion" ? t("common_submitting") : t("escrow_confirmCompletion")}
          </button>
        </form>
      )}
    </>
  );
}
