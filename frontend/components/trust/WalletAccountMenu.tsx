"use client";

/**
 * Connected-wallet L5 dropdown — absolute under header chip (not portaled modal).
 */

import { useEffect } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import type { WalletConnectionController } from "@/lib/wallet/useWalletConnectionController";

type Props = {
  ctrl: WalletConnectionController;
  authL5?: boolean;
};

const ITEM =
  "flex w-full min-h-9 items-center rounded-md px-2.5 text-left text-small text-slate-100 transition-colors hover:bg-ref-sun/12 hover:text-[#fde9a8] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/40";

export function WalletAccountMenu({ ctrl, authL5 }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!ctrl.accountMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctrl.closeAccountMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ctrl]);

  if (!ctrl.accountMenuOpen || !ctrl.address) return null;

  return (
    <div
      role="menu"
      aria-label={t("wallet_account_menu")}
      data-tt-header-wallet-menu-l5={authL5 ? "1" : undefined}
      data-tt-wallet-account-menu-l5="1"
      data-tt-wallet-dropdown="1"
      className="relative z-[1] w-full overflow-hidden py-2"
    >
      <div className="space-y-0.5 px-3 pb-2 pt-0.5">
        <p className="text-meta text-slate-400" data-tt-wallet-session-hint="1">
          {t("wallet_account_session_hint")}
        </p>
        <p className="truncate font-mono text-small text-[#fde9a8]" title={ctrl.address}>
          {ctrl.shortAddress}
        </p>
        <p className="text-meta text-slate-300">
          {ctrl.wrongNetwork
            ? t("wallet_network_mismatch", { name: ctrl.chainName })
            : ctrl.chainName}
          {ctrl.connectorName ? (
            <span>
              {" · "}
              <span className="font-medium text-[#e8d4a8]">{ctrl.connectorName}</span>
            </span>
          ) : null}
        </p>
        {ctrl.accountChangedPulse ? (
          <p className="text-meta text-[#fde9a8]" role="status">
            {t("wallet_account_changed")}
          </p>
        ) : null}
        {!ctrl.writeGuard.canWrite && ctrl.writeGuard.reason === "view_only" ? (
          <p className="text-meta text-slate-400">{t("wallet_viewOnly_hint")}</p>
        ) : null}
      </div>

      {ctrl.wrongNetwork || ctrl.switchRejected ? (
        <div className="px-1.5 pb-1">
          <p className="mb-1 px-2 text-meta text-warning">
            {ctrl.switchRejected ? t("wallet_switch_rejected") : t("wallet_wrongNetwork_action")}
          </p>
          <button
            type="button"
            role="menuitem"
            className={ITEM}
            disabled={ctrl.isSwitchPending}
            onClick={() => void ctrl.switchToTargetChain()}
          >
            {t("wallet_switch_network", { name: ctrl.chainName })}
          </button>
        </div>
      ) : null}

      <div className="mx-2.5 mb-1 h-px bg-ref-sun/16" role="separator" />

      <div className="flex flex-col gap-0.5 px-1.5">
        <button
          type="button"
          role="menuitem"
          className={ITEM}
          onClick={() => void ctrl.copyAddress(ctrl.address!)}
        >
          {ctrl.copyDone ? t("wallet_copied") : t("wallet_copy_address")}
        </button>

        {ctrl.explorerUrl ? (
          <a
            href={ctrl.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className={ITEM}
          >
            {t("wallet_view_explorer")}
          </a>
        ) : null}

        <button
          type="button"
          role="menuitem"
          className={ITEM}
          onClick={() => {
            ctrl.closeAccountMenu();
            ctrl.openSheet();
          }}
        >
          {t("wallet_switch_wallet")}
        </button>

        <button
          type="button"
          role="menuitem"
          className={`${ITEM} text-ref-coral/95`}
          onClick={() => void ctrl.disconnectWallet()}
        >
          {t("wallet_disconnect")}
        </button>
      </div>
    </div>
  );
}
