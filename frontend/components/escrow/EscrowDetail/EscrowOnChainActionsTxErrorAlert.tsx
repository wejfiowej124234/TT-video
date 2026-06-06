"use client";

import { escrowChainTxErrorUserMessage } from "@/lib/mapEscrowChainTxError";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_CONSOLE_LINK_FOCUS } from "@/lib/marketingUi";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function EscrowOnChainActionsTxErrorAlert({
  txErrorMessage,
  failed,
  onDismissTxError,
  isDid,
  ctaFocusClass,
  t,
}: {
  txErrorMessage: string;
  failed: boolean;
  onDismissTxError?: () => void;
  isDid: boolean;
  ctaFocusClass: string;
  t: TFn;
}) {
  if (!txErrorMessage) return null;
  return (
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
                : `text-small ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`
            }
          >
            {t("common_closeAlert")}
          </button>
        </form>
      )}
    </div>
  );
}
