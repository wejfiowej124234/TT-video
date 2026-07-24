"use client";

/**
 * TravelTrust L5 Wallet Connection Center — header entry.
 *
 * Wagmi session only: connect / identify / switch-chain / request signatures.
 * Opens as absolute dropdown under chip (aligned with language + user menus).
 *
 * Architecture: WalletStatusMini → useWalletConnectionController →
 * TravelTrustWalletSheet / WalletAccountMenu → wagmi connectors.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderUtilityMenuL5Chrome } from "@/components/header/HeaderUtilityMenuL5Chrome";
import { TravelTrustWalletSheet } from "@/components/trust/TravelTrustWalletSheet";
import { WalletAccountMenu } from "@/components/trust/WalletAccountMenu";
import { useWalletConnectionController } from "@/lib/wallet/useWalletConnectionController";
import {
  headerUtilityMenuL5ShellClass,
  TT_HEADER_UTILITY_MENU_L5,
} from "@/lib/header/headerUtilityMenuL5";
import { TRAVELTRUST_HEADER_WALLET_ID } from "@/lib/traveltrustHeroTrustChips";

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

const FALLBACK_DROPDOWN =
  "absolute right-0 top-full z-50 mt-2 box-border flex w-[min(20.5rem,calc(100vw-1.5rem))] min-w-[16rem] flex-col overflow-hidden rounded-xl border border-ref-sun/40 bg-[#0c0a09]/96 py-0 shadow-[0_0_0_1px_rgba(252,164,124,0.16),0_18px_44px_-16px_rgba(0,0,0,0.78)] backdrop-blur-2xl outline-none";

export default function WalletStatusMini({ variant = "dark", className = "" }: Props) {
  const { t } = useTranslation();
  const ctrl = useWalletConnectionController();
  const rootRef = useRef<HTMLDivElement>(null);
  const authL5 = variant === "authL5" || variant === "community";
  const menuOpen = ctrl.sheetOpen || ctrl.accountMenuOpen;

  const menuClass = authL5
    ? `${headerUtilityMenuL5ShellClass("wide")} !w-[min(20.5rem,calc(100vw-1.5rem))] !min-w-[18rem]`
    : FALLBACK_DROPDOWN;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        ctrl.closeSheet();
        ctrl.closeAccountMenu();
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen, ctrl]);

  const pillBase =
    variant === "authL5" || variant === "community"
      ? "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-ref-sun/40 bg-[#0c0a09]/55 px-3 py-1.5 text-small text-[#f5e6c8] shadow-[inset_0_0_0_1px_rgba(252,164,124,0.12),0_0_20px_-12px_rgba(252,164,124,0.45)] backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-150 hover:border-ref-sun/60 hover:bg-ref-sun/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40"
      : variant === "console"
        ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1 text-small text-slate-100"
        : variant === "light"
          ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-2.5 py-1 text-small text-slate-800"
          : "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-small text-white";

  const openClass = authL5 && menuOpen ? ` ${TT_HEADER_UTILITY_MENU_L5.buttonOpen}` : "";

  const dropdownShell = (kind: "sheet" | "account", children: ReactNode) => (
    <div
      className={menuClass}
      data-tt-header-wallet-menu-l5={authL5 ? "1" : undefined}
      data-tt-wallet-dropdown-shell={kind}
    >
      {authL5 ? <HeaderUtilityMenuL5Chrome /> : null}
      <div className={authL5 ? TT_HEADER_UTILITY_MENU_L5.dropdownBody : undefined}>{children}</div>
    </div>
  );

  /** View-only: never look like a live connected session. */
  if (ctrl.phase === "viewOnly" && ctrl.viewOnlyAddress) {
    return (
      <div
        id={TRAVELTRUST_HEADER_WALLET_ID}
        ref={rootRef}
        className={`relative shrink-0 ${className}`.trim()}
      >
        <button
          type="button"
          className={`${pillBase}${openClass}`}
          aria-label={t("wallet_observing_aria", { address: ctrl.shortAddress ?? "" })}
          aria-haspopup="menu"
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
        {ctrl.sheetOpen
          ? dropdownShell("sheet", <TravelTrustWalletSheet ctrl={ctrl} authL5={authL5} />)
          : null}
      </div>
    );
  }

  if (ctrl.isConnected && ctrl.address) {
    const statusDot = ctrl.wrongNetwork
      ? "bg-warning shadow-[0_0_6px_rgba(250,204,21,0.55)]"
      : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]";
    return (
      <div
        id={TRAVELTRUST_HEADER_WALLET_ID}
        ref={rootRef}
        className={`relative shrink-0 ${className}`.trim()}
      >
        <button
          type="button"
          className={`${pillBase}${openClass}`}
          aria-label={
            ctrl.wrongNetwork
              ? t("wallet_wrongNetwork_aria", { address: ctrl.shortAddress ?? "" })
              : t("wallet_connected_aria", { address: ctrl.shortAddress ?? "" })
          }
          aria-haspopup="menu"
          aria-expanded={ctrl.accountMenuOpen || ctrl.sheetOpen}
          title={ctrl.address}
          onClick={() => {
            if (ctrl.accountMenuOpen || ctrl.sheetOpen) {
              ctrl.closeAccountMenu();
              ctrl.closeSheet();
            } else {
              ctrl.openAccountMenu();
            }
          }}
        >
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDot}`} aria-hidden />
          <span className="whitespace-nowrap font-mono tabular-nums" data-tt-wallet-chip-address="1">
            {ctrl.shortAddress}
          </span>
          <span aria-hidden className="opacity-70">
            ▾
          </span>
        </button>
        <span className="sr-only">
          {ctrl.wrongNetwork ? (
            <span className="text-warning">{t("wallet_wrongNetwork")}</span>
          ) : (
            t("wallet_connected")
          )}
        </span>
        {ctrl.accountMenuOpen
          ? dropdownShell("account", <WalletAccountMenu ctrl={ctrl} authL5={authL5} />)
          : null}
        {ctrl.sheetOpen
          ? dropdownShell("sheet", <TravelTrustWalletSheet ctrl={ctrl} authL5={authL5} />)
          : null}
      </div>
    );
  }

  const connecting = ctrl.phase === "connecting";

  return (
    <div
      id={TRAVELTRUST_HEADER_WALLET_ID}
      ref={rootRef}
      className={`relative shrink-0 ${className}`.trim()}
    >
      <button
        type="button"
        className={`${pillBase}${openClass}`}
        aria-label={t("wallet_connect")}
        aria-haspopup="menu"
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
      {ctrl.sheetOpen
        ? dropdownShell("sheet", <TravelTrustWalletSheet ctrl={ctrl} authL5={authL5} />)
        : null}
    </div>
  );
}
