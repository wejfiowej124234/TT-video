"use client";

import { useMemo } from "react";
import { formatUnits, isAddress } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20DecimalsAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import {
  isViemNoContractDataError,
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { getGuideStakingAddress } from "@/lib/stakingEnv";

import { StakingApiStakeSummary } from "./StakingApiStakeSummary";
import { StakingNotDeployedCallout } from "./StakingNotDeployedCallout";
import { StakingWrongChainNote } from "./StakingWrongChainNote";

function formatAmount(raw: bigint, decimals: number | undefined, t: (k: string) => string): string {
  if (decimals === undefined) return `${raw.toString()} (${t("staking_contract_rawUnits")})`;
  try {
    return formatUnits(raw, decimals);
  } catch {
    return raw.toString();
  }
}

type StakingIdentitySummaryStripProps = {
  /** 工作台内由档位区承担不足额提示，摘要条仅展示余额 */
  suppressBelowMinHint?: boolean;
};

/** 向导身份池 · 链上摘要条（L5 单一视觉锚点 · 替代多面板重复展示） */
export function StakingIdentitySummaryStrip({
  suppressBelowMinHint = false,
}: StakingIdentitySummaryStripProps) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const stakingAddress = useMemo(() => getGuideStakingAddress(), []);
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(stakingAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);
  const userEnabled = Boolean(readsEnabled && address && isConnected);

  const minStakeRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "MIN_STAKE",
    query: { enabled: readsEnabled },
  });

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
  const decimals =
    decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const stakeOfRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "stakeOf",
    args: address ? [address] : undefined,
    query: { enabled: userEnabled },
  });

  const slashedRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "slashedOf",
    args: address ? [address] : undefined,
    query: { enabled: userEnabled },
  });

  const minStakeFormatted =
    minStakeRead.data !== undefined && decimals !== undefined
      ? formatAmount(minStakeRead.data, decimals, t)
      : null;

  const belowMinOnChain =
    userEnabled &&
    minStakeRead.data !== undefined &&
    stakeOfRead.data !== undefined &&
    stakeOfRead.data < minStakeRead.data;

  const shortfallFormatted = useMemo(() => {
    if (!belowMinOnChain || minStakeRead.data === undefined || stakeOfRead.data === undefined) {
      return null;
    }
    const shortfall = minStakeRead.data - stakeOfRead.data;
    if (shortfall <= BigInt(0) || decimals === undefined) return null;
    return formatAmount(shortfall, decimals, t);
  }, [belowMinOnChain, minStakeRead.data, stakeOfRead.data, decimals, t]);

  const userErrRaw =
    (stakeOfRead.error as Error | undefined)?.message ??
    (slashedRead.error as Error | undefined)?.message ??
    null;
  const userErr = userErrRaw && !isViemNoContractDataError(userErrRaw) ? userErrRaw : null;

  if (!isConnected || !address) {
    return <StakingApiStakeSummary enabled minStakeDisplay={minStakeFormatted} />;
  }

  if (!chainOk && stakingAddress) {
    return (
      <div className="space-y-3" data-tt-staking-summary-strip="wrong-chain">
        <StakingWrongChainNote currentChainId={chainId} expectedChainId={expectedChainId} />
        <StakingApiStakeSummary enabled minStakeDisplay={minStakeFormatted} />
      </div>
    );
  }

  if (deploymentStatus === "missing" && stakingAddress) {
    return (
      <div className="space-y-3" data-tt-staking-summary-strip="pool-missing">
        <StakingNotDeployedCallout
          chainId={chainId}
          expectedChainId={expectedChainId}
          contractAddress={stakingAddress}
          variant="warm"
        />
        <StakingApiStakeSummary enabled minStakeDisplay={minStakeFormatted} />
      </div>
    );
  }

  if (deploymentStatus === "loading" || (userEnabled && stakeOfRead.isLoading)) {
    return (
      <div className={TT_STAKING_PAGE_L5.amountHero} aria-busy="true" data-tt-staking-summary-strip="loading">
        <p className={TT_STAKING_PAGE_L5.amountHeroLabel}>{t("staking_summary_hero_label")}</p>
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.metaProse}`}>{t("staking_contract_loading")}</p>
      </div>
    );
  }

  if (userErr) {
    return (
      <p className={TT_STAKING_PAGE_L5.calloutDanger} role="alert">
        {t("staking_contract_error")} {t("staking_readErrorRetryHint")}
      </p>
    );
  }

  const stakeDisplay =
    stakeOfRead.data !== undefined && decimals !== undefined
      ? formatAmount(stakeOfRead.data, decimals, t)
      : dash;
  const slashedDisplay =
    slashedRead.data !== undefined &&
    decimals !== undefined &&
    slashedRead.data > BigInt(0)
      ? formatAmount(slashedRead.data, decimals, t)
      : null;

  return (
    <div className={TT_STAKING_PAGE_L5.amountHero} data-tt-staking-summary-strip="1">
      <p className={TT_STAKING_PAGE_L5.amountHeroLabel}>{t("staking_summary_hero_label")}</p>
      <p className={`mt-2 ${TT_STAKING_PAGE_L5.amountHeroValue}`}>
        {stakeDisplay}
        <span className="ml-2 text-meta font-normal text-slate-400">USDC</span>
      </p>
      <p className={TT_STAKING_PAGE_L5.amountHeroHint}>
        {t("staking_summary_min_line", { min: minStakeFormatted ?? dash })}
        {slashedDisplay ? ` · ${t("staking_summary_slashed_line", { amount: slashedDisplay })}` : ""}
      </p>
      {!suppressBelowMinHint && belowMinOnChain && shortfallFormatted ? (
        <p className="mt-3 text-meta text-amber-200/90" role="status" data-tt-staking-summary-below-min="1">
          {t("staking_summary_below_min_hint", { shortfall: shortfallFormatted })}
        </p>
      ) : null}
    </div>
  );
}
