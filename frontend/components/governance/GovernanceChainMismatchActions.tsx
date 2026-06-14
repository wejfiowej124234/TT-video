"use client";

import { useSwitchChain } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";

type Props = {
  isConnected: boolean;
  expectedChainId: number;
  walletChainId: number;
  className?: string;
};

/** 治理页 · 错误网络一键切链（与 EscrowChainMismatchActions 同源） */
export function GovernanceChainMismatchActions({
  isConnected,
  expectedChainId,
  walletChainId,
  className = "",
}: Props) {
  const { t } = useTranslation();
  const { switchChain, isPending, error } = useSwitchChain();

  if (!isConnected || walletChainId === expectedChainId) return null;

  const canSwitch = typeof switchChain === "function";

  return (
    <div className={`space-y-2 ${className}`} data-tt-governance-switch-chain="1">
      <p className="text-body text-rose-300" role="alert">
        {t("governance_wallet_wrong_network", { chainId: expectedChainId })}
      </p>
      {!canSwitch ? (
        <p className={GOV_PROPOSALS_L5.formHint}>{t("governance_switch_network_unavailable")}</p>
      ) : (
        <button
          type="button"
          className={GOV_PROPOSALS_L5.primarySubmit}
          disabled={isPending}
          onClick={() => switchChain({ chainId: expectedChainId })}
        >
          {isPending ? t("governance_switch_network_pending") : t("governance_switch_network_cta", { chainId: expectedChainId })}
        </button>
      )}
      {error ? (
        <p className="text-body text-rose-300" role="alert">
          {error.message?.trim() || t("governance_switch_network_failed")}
        </p>
      ) : null}
    </div>
  );
}
