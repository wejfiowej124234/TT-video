"use client";

import { useId, useMemo } from "react";
import { formatUnits, isAddress } from "viem";
import { useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20DecimalsAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import {
  isViemNoContractDataError,
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { getGuideStakingAddress, getProviderStakingAddress } from "@/lib/stakingEnv";

import { StakingContractAddressRow } from "./StakingContractAddressRow";
import type { StakingPoolKind } from "./StakingContractPanel";

function formatAmount(raw: bigint, decimals: number | undefined, t: (k: string) => string): string {
  if (decimals === undefined) return `${raw.toString()} (${t("staking_contract_rawUnits")})`;
  try {
    return formatUnits(raw, decimals);
  } catch {
    return raw.toString();
  }
}

/** 合约技术字段折叠区（L5 · 默认收起，减少主视觉噪音） */
export function StakingTechnicalDetailsCollapsible({ pool }: { pool: StakingPoolKind }) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const detailsId = useId();
  const chainId = useChainId();
  const stakingAddress = useMemo(
    () => (pool === "guide" ? getGuideStakingAddress() : getProviderStakingAddress()),
    [pool],
  );
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(stakingAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);

  const tokenRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "token",
    query: { enabled: readsEnabled },
  });
  const tokenAddr = tokenRead.data;
  const tokenForDecimals =
    tokenAddr && isAddress(tokenAddr) ? (tokenAddr as `0x${string}`) : undefined;
  const decimalsRead = useReadContract({
    address: tokenForDecimals,
    abi: erc20DecimalsAbi,
    functionName: "decimals",
    query: { enabled: Boolean(readsEnabled && tokenForDecimals) },
  });
  const slasherRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "slasher",
    query: { enabled: readsEnabled },
  });
  const minStakeRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "MIN_STAKE",
    query: { enabled: readsEnabled },
  });

  const decimals =
    decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;
  const globalErrRaw =
    (tokenRead.error as Error | undefined)?.message ??
    (slasherRead.error as Error | undefined)?.message ??
    null;
  const globalErr =
    globalErrRaw && !isViemNoContractDataError(globalErrRaw) ? globalErrRaw : null;

  if (!stakingAddress || !chainOk || deploymentStatus === "missing") {
    return null;
  }

  return (
    <details className={TT_STAKING_PAGE_L5.registryDetails} data-tt-staking-technical-details="1">
      <summary className={TT_STAKING_PAGE_L5.registrySummary} aria-controls={detailsId}>
        {t("staking_technical_details_summary")}
      </summary>
      <div id={detailsId} className="mt-3 space-y-3">
        {globalErr ? (
          <p className={TT_STAKING_PAGE_L5.calloutDanger} role="alert">
            {t("staking_contract_error")}
          </p>
        ) : (
          <dl className={TT_STAKING_PAGE_L5.statGrid}>
            <StakingContractAddressRow
              label={t("staking_contract_poolAddress")}
              address={stakingAddress}
            />
            <StakingContractAddressRow label={t("staking_contract_stakeToken")} address={tokenAddr ?? null} />
            <div className={TT_STAKING_PAGE_L5.statRow}>
              <dt className={TT_STAKING_PAGE_L5.statLabel}>{t("staking_contract_minStake")}</dt>
              <dd className={TT_STAKING_PAGE_L5.statValue}>
                {minStakeRead.data !== undefined && decimals !== undefined
                  ? formatAmount(minStakeRead.data, decimals, t)
                  : dash}
              </dd>
            </div>
            <StakingContractAddressRow label={t("staking_contract_slasher")} address={slasherRead.data ?? null} />
          </dl>
        )}
        <p className={TT_STAKING_PAGE_L5.metaProse}>{t("staking_technical_details_hint")}</p>
      </div>
    </details>
  );
}
