"use client";

/**
 * TravelTrust L5 Wallet Connection Center — header entry.
 *
 * Wagmi session only: connect / identify / switch-chain / request signatures.
 * No wallet creation, key custody, mnemonics, or proxy signing.
 *
 * Architecture: WalletStatusMini → useWalletConnectionController →
 * TravelTrustWalletSheet / WalletAccountMenu → wagmi connectors.
 */

import { useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TravelTrustWalletSheet } from "@/components/trust/TravelTrustWalletSheet";
import { WalletAccountMenu } from "@/components/trust/WalletAccountMenu";
import { useWalletConnectionController } from "@/lib/wallet/useWalletConnectionController";
import { TT_HEADER_UTILITY_MENU_L5 } from "@/lib/header/headerUtilityMenuL5";

export type WalletStatusMiniVariant = "dark" | "light" | "console" | "community" | "authL5";

type Props = {
  variant?: WalletStatusMiniVariant;
  className?: string;
};

function WalletGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16 12h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17.25" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

export default function WalletStatusMini({ variant = "dark", className = "" }: Props) {
  const { t } = useTranslation();
  const ctrl = useWalletConnectionController();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const authL5 = variant === "authL5" || variant === "community";

  const pillBase =
    variant === "authL5" || variant === "community"
      ? "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-ref-sun/40 bg-[#0c0a09]/55 px-3 py-1.5 text-small text-[#f5e6c8] shadow-[inset_0_0_0_1px_rgba(252,164,124,0.12),0_0_20px_-12px_rgba(252,164,124,0.45)] backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-150 hover:border-ref-sun/60 hover:bg-ref-sun/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40"
      : variant === "console"
        ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1 text-small text-slate-100"
        : variant === "light"
          ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-2.5 py-1 text-small text-slate-800"
          : "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-small text-white";

  const openClass =
    authL5 && (ctrl.sheetOpen || ctrl.accountMenuOpen) ? ` ${TT_HEADER_UTILITY_MENU_L5.buttonOpen}` : "";

  /** View-only: never look like a live connected session. */
  if (ctrl.phase === "viewOnly" && ctrl.viewOnlyAddress) {
    return (
      <div className={`relative ${className}`.trim()}>
        <button
          ref={triggerRef}
          type="button"
          className={`${pillBase}${openClass}`}
          aria-label={t("wallet_observing_aria", { address: ctrl.shortAddress ?? "" })}
          aria-haspopup="dialog"
          aria-expanded={ctrl.sheetOpen}
          onClick={() => (ctrl.sheetOpen ? ctrl.closeSheet() : ctrl.openSheet())}
          title={ctrl.viewOnlyAddress}
        >
          <span className="text-ref-sun/80">{t("wallet_observing")}</span>
          <span className="font-mono text-meta opacity-90">· {ctrl.shortAddress}</span>
          <span aria-hidden className="opacity-70">
            ▾
          </span>
        </button>
        <TravelTrustWalletSheet ctrl={ctrl} authL5={authL5} />
      </div>
    );
  }

  if (ctrl.isConnected && ctrl.address) {
    const statusDot =
      ctrl.wrongNetwork
        ? "bg-warning shadow-[0_0_6px_rgba(250,204,21,0.55)]"
        : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]";
    return (
      <div className={`relative ${className}`.trim()}>
        <button
          ref={triggerRef}
          type="button"
          className={`${pillBase}${openClass}`}
          aria-label={
            ctrl.wrongNetwork
              ? t("wallet_wrongNetwork_aria", { address: ctrl.shortAddress ?? "" })
              : t("wallet_connected_aria", { address: ctrl.shortAddress ?? "" })
          }
          aria-haspopup="menu"
          aria-expanded={ctrl.accountMenuOpen}
          title={ctrl.address}
          onClick={() =>
            ctrl.accountMenuOpen ? ctrl.closeAccountMenu() : ctrl.openAccountMenu()
          }
        >
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDot}`} aria-hidden />
          <span className="font-mono tabular-nums">{ctrl.shortAddress}</span>
          <span aria-hidden className="opacity-70">
            ▾
          </span>
        </button>
        {/* Screen-reader / legacy contract markers for connected + wrong network */}
        <span className="sr-only">
          {ctrl.wrongNetwork ? (
            <span className="text-warning">{t("wallet_wrongNetwork")}</span>
          ) : (
            t("wallet_connected")
          )}
        </span>
        <WalletAccountMenu ctrl={ctrl} anchorRef={triggerRef} authL5={authL5} />
        <TravelTrustWalletSheet ctrl={ctrl} authL5={authL5} />
      </div>
    );
  }

  const connecting = ctrl.phase === "connecting";

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`${pillBase}${openClass}`}
        aria-label={t("wallet_connect")}
        aria-haspopup="dialog"
        aria-expanded={ctrl.sheetOpen}
        disabled={connecting}
        onClick={() => (ctrl.sheetOpen ? ctrl.closeSheet() : ctrl.openSheet())}
      >
        <WalletGlyph className="opacity-90" />
        <span>{connecting ? t("wallet_connecting") : t("wallet_connect")}</span>
        <span aria-hidden className="opacity-70">
          ▾
        </span>
      </button>
      <TravelTrustWalletSheet ctrl={ctrl} authL5={authL5} />
    </div>
  );
}
