"use client";

import { useMemo } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { registryAbi } from "@/lib/registryAbi";
import { getRegistryAddress } from "@/lib/registryEnv";
import {
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";

/** Registry 折叠区摘要：已连钱包时展示有效资格（收起态可见） */
export function StakingRegistryEligibilityBadge() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const registryAddress = useMemo(() => getRegistryAddress(), []);
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(registryAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(registryAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);
  const canRead = Boolean(readsEnabled && address && isConnected);

  const isApprovedRead = useReadContract({
    address: registryAddress ?? undefined,
    abi: registryAbi,
    functionName: "isApproved",
    args: address ? [address] : undefined,
    query: { enabled: canRead },
  });

  if (!registryAddress || deploymentStatus === "missing") {
    return (
      <span className="ml-2 font-normal text-slate-500" data-tt-staking-registry-badge="unavailable">
        {t("staking_registry_badge_unavailable")}
      </span>
    );
  }

  if (!isConnected) {
    return (
      <span className="ml-2 font-normal text-slate-500" data-tt-staking-registry-badge="connect">
        {t("staking_registry_collapsible_hint")}
      </span>
    );
  }

  if (isApprovedRead.isLoading) {
    return (
      <span className="ml-2 font-normal text-slate-500" data-tt-staking-registry-badge="loading">
        …
      </span>
    );
  }

  const effective = isApprovedRead.data;
  const label =
    effective === true
      ? t("staking_registry_badge_eligible")
      : effective === false
        ? t("staking_registry_badge_ineligible")
        : t("ui_em_dash");

  return (
    <span
      className={`ml-2 font-normal ${effective === true ? "text-emerald-400/90" : "text-slate-500"}`}
      data-tt-staking-registry-badge="1"
    >
      · {label}
    </span>
  );
}
