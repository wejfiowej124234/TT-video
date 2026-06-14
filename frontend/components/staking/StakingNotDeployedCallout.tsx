"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export type StakingNotDeployedCalloutProps = {
  chainId: number;
  expectedChainId: number;
  contractAddress: string;
  variant?: "warm" | "legacy";
};

/** 当前链 RPC 上无合约字节码（常见于 Anvil 未部署却填了 Sepolia 地址） */
export function StakingNotDeployedCallout({
  chainId,
  expectedChainId,
  contractAddress,
  variant = "warm",
}: StakingNotDeployedCalloutProps) {
  const { t } = useTranslation();
  const calloutClass = variant === "warm" ? TT_STAKING_PAGE_L5.calloutWarn : TT_STAKING_PAGE_L5.calloutWarn;
  const titleClass = variant === "warm" ? "font-medium text-slate-100" : "font-medium text-ink-900";
  const metaClass = variant === "warm" ? "text-meta text-slate-400/95" : "text-meta text-ink-600";

  return (
    <div
      className={calloutClass}
      role="alert"
      data-tt-staking-contract-not-deployed="1"
    >
      <p className={titleClass}>{t("staking_contract_notDeployedTitle")}</p>
      <p className="mt-2">
        {t("staking_contract_notDeployedBody", {
          chainId: String(chainId),
          expectedChainId: String(expectedChainId),
        })}
      </p>
      <p className={`mt-2 ${metaClass}`}>{t("staking_contract_notDeployedHint")}</p>
      <p className={`mt-2 font-mono text-meta break-all ${variant === "warm" ? "text-slate-500" : "text-ink-500"}`}>
        {contractAddress}
      </p>
    </div>
  );
}
