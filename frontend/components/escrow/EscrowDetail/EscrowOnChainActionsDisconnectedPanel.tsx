"use client";

import { useState } from "react";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  TT_MARKETING_BTN_CONSOLE_DANGER,
  TT_MARKETING_BTN_CONSOLE_SUCCESS_SOLID,
  TT_MARKETING_BTN_CONSOLE_WARNING,
  TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL,
} from "@/lib/marketingUi";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function EscrowOnChainActionsDisconnectedPanel({
  protocolPaused,
  hintClass,
  isDid,
  ctaFocusClass,
  disputeBtnDisabled,
  disputeBtnTitle,
  t,
}: {
  protocolPaused: boolean;
  hintClass: string;
  isDid: boolean;
  ctaFocusClass: string;
  disputeBtnDisabled: boolean;
  disputeBtnTitle: string | undefined;
  t: TFn;
}) {
  const [walletDisconnectedTap, setWalletDisconnectedTap] = useState(false);

  return (
    <div className="space-y-2">
      <p className={hintClass}>{t("escrow_connectWalletHint")}</p>
      {walletDisconnectedTap && (
        <p className={isDid ? "text-small text-warning/95" : "text-small text-warning"} role="alert">
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
          className={`${TT_MARKETING_BTN_CONSOLE_SUCCESS_SOLID} disabled:opacity-50 ${ctaFocusClass}`}
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
          className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL} disabled:opacity-50${isDid ? ` ${ctaFocusClass}` : ""}`}
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
          className={`${TT_MARKETING_BTN_CONSOLE_WARNING} px-4 py-2 disabled:opacity-50 ${ctaFocusClass}`}
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
          className={`${TT_MARKETING_BTN_CONSOLE_DANGER} px-4 py-2 disabled:opacity-50 ${ctaFocusClass}`}
        >
          {t("escrow_openDispute")}
        </button>
      </div>
    </div>
  );
}
