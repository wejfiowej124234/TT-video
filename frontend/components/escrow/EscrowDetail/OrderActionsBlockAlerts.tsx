"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { marketCyanInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_WARM_OUTLINE_COMPACT, TT_MARKETING_FOCUS_RING_CONSOLE} from "@/lib/marketingUi";

export interface OrderActionsBlockAlertsProps {
  t: (key: string) => string;
  isDid: boolean;
  metaClass: string;
  pillFocusClass: string;
  guideWalletMismatch: boolean;
  guideWalletAlertId: string;
  acceptBlockedByOtherPending: boolean;
  acceptOtherPendingId: string;
  protocolPaused: boolean;
  intentWalletDisconnectedTap: boolean;
  err: string | null;
  errAction: string | null;
  intentOk: string | null;
  busy: boolean;
  protocolPausedFlag: boolean;
  guideWalletMismatchFlag: boolean;
  onRetryAccept: () => void;
  onClearErr: () => void;
}

export function OrderActionsBlockAlerts({
  t,
  isDid,
  metaClass,
  pillFocusClass,
  guideWalletMismatch,
  guideWalletAlertId,
  acceptBlockedByOtherPending,
  acceptOtherPendingId,
  protocolPaused,
  intentWalletDisconnectedTap,
  err,
  errAction,
  intentOk,
  busy,
  protocolPausedFlag,
  guideWalletMismatchFlag,
  onRetryAccept,
  onClearErr,
}: OrderActionsBlockAlertsProps) {
  return (
    <>
      {guideWalletMismatch && (
        <p id={guideWalletAlertId} className="text-small text-warning" role="alert">
          {t("escrow_guideWalletRequired")}
        </p>
      )}
      {acceptBlockedByOtherPending && !guideWalletMismatch ? (
        <p id={acceptOtherPendingId} className={metaClass} role="status">
          {t("escrow_acceptBlocked_otherActionPending")}
        </p>
      ) : null}
      {protocolPaused ? (
        <p className={metaClass} role="status">
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      {intentWalletDisconnectedTap && (
        <p className="text-small text-warning" role="alert">
          {t("escrow_connectWalletUseHeader")}
        </p>
      )}
      {err ? (
        <div className="space-y-2">
          <ApiErrorAlert message={err} tone={isDid ? "dark" : "default"} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {errAction === "accept" ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (busy || guideWalletMismatchFlag) return;
                  onRetryAccept();
                }}
              >
                <button
                  type="submit"
                  disabled={protocolPausedFlag || busy || guideWalletMismatchFlag}
                  aria-label={t("common_retry")}
                  className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${
                    isDid
                      ? `border-ink-500/60 bg-ink-800/70 text-slate-200 hover:bg-ink-800 ${pillFocusClass}`
                      : TT_MARKETING_BTN_WARM_OUTLINE_COMPACT
                  }`}
                >
                  {t("common_retry")}
                </button>
              </form>
            ) : null}
            <button
              type="button"
              onClick={onClearErr}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium ${
                isDid
                  ? `border-ink-600/50 text-slate-300 hover:bg-ink-800/50 ${marketCyanInlineLinkFocusClasses}`
                  : `border-ink-200 text-ink-700 hover:bg-ink-50 ${TT_MARKETING_FOCUS_RING_CONSOLE}`
              }`}
            >
              {t("common_closeAlert")}
            </button>
          </div>
        </div>
      ) : null}
      {intentOk ? <p className="text-small text-success" role="status">{intentOk}</p> : null}
    </>
  );
}
