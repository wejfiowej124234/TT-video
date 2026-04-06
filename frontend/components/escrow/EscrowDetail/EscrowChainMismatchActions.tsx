"use client";

import { useSwitchChain } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import {
  marketCyanPillControlFocusClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

export interface EscrowChainMismatchActionsProps {
  isConnected: boolean;
  expectedChainId: number;
  chainId: number;
  /** false：页顶横幅等浅色底；true：协议控制台 DID 风格 */
  variantDid?: boolean;
  className?: string;
}

export default function EscrowChainMismatchActions({
  isConnected,
  expectedChainId,
  chainId,
  variantDid = false,
  className = "",
}: EscrowChainMismatchActionsProps) {
  const { t } = useTranslation();
  const { switchChain, isPending, error } = useSwitchChain();

  const ctaFocusClass = variantDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

  const primaryBtnClass = variantDid
    ? `inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-cyan-500/30 px-4 py-2 text-small font-medium text-cyan-100 border border-cyan-400/50 hover:bg-cyan-500/40 disabled:opacity-50 ${ctaFocusClass}`
    : `inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white disabled:opacity-50 ${ctaFocusClass}`;

  const mutedClass = variantDid ? "text-slate-300" : "text-ink-600";

  if (!isConnected) {
    return (
      <p className={`text-small ${mutedClass} mt-2 ${className}`} role="status">
        {t("escrow_switchNetworkNeedWallet")}
      </p>
    );
  }

  const canSwitch = typeof switchChain === "function";
  const switchErrorMsg =
    error != null ? (error.message?.trim() ? error.message : t("escrow_switchNetworkFailed")) : null;

  return (
    <div className={`mt-3 flex flex-col gap-2 ${className}`}>
      {!canSwitch && (
        <p className="text-small text-warning" role="status">
          {t("escrow_switchNetworkUnavailable").replace("{{chainId}}", String(expectedChainId))}
        </p>
      )}
      {canSwitch && (
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            switchChain({ chainId: expectedChainId });
          }}
        >
          <button
            type="submit"
            disabled={isPending || chainId === expectedChainId}
            aria-busy={isPending ? true : undefined}
            className={primaryBtnClass}
          >
            {isPending
              ? t("escrow_switchNetworkPending")
              : t("escrow_switchNetworkCta").replace("{{chainId}}", String(expectedChainId))}
          </button>
        </form>
      )}
      {switchErrorMsg && (
        <p className="text-small text-danger" role="alert">
          {switchErrorMsg}
        </p>
      )}
    </div>
  );
}
