"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { formatUnits, isAddress, parseUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20TokenAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import { getGuideStakingAddress, getProviderStakingAddress } from "@/lib/stakingEnv";
import type { StakingPoolKind } from "./StakingContractPanel";

/** Phase 3/4：ERC-20 approve + 身份质押池 `stake` — 读链/写链与校验（与 `StakingStakePanel` 展示分离）。 */
export function useStakingStakePanel(pool: StakingPoolKind) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const stakingAddress = useMemo(
    () => (pool === "guide" ? getGuideStakingAddress() : getProviderStakingAddress()),
    [pool],
  );
  const stakeTitleKey = pool === "guide" ? "staking_pool_guide_stake_title" : "staking_pool_provider_stake_title";
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const userEnabled = Boolean(baseEnabled && address && isConnected);
  const titleId = useId();
  const stakeAmountFieldId = useId();
  const stakeAmountErrorRegionId = useId();

  const [amountStr, setAmountStr] = useState("");

  const tokenRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "token",
    query: { enabled: baseEnabled },
  });
  const tokenAddr = tokenRead.data;
  const token = tokenAddr && isAddress(tokenAddr) ? (tokenAddr as `0x${string}`) : undefined;

  const decimalsRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "decimals",
    query: { enabled: Boolean(baseEnabled && token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const minStakeRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "MIN_STAKE",
    query: { enabled: baseEnabled },
  });

  const stakeOfRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "stakeOf",
    args: address ? [address] : undefined,
    query: { enabled: userEnabled },
  });

  const balanceRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(userEnabled && token) },
  });

  const allowanceRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "allowance",
    args: address && stakingAddress ? [address, stakingAddress] : undefined,
    query: { enabled: Boolean(userEnabled && token && stakingAddress) },
  });

  const parsedAmount = useMemo(() => {
    if (decimals === undefined) return undefined;
    const s = amountStr.trim();
    if (!s) return undefined;
    try {
      return parseUnits(s, decimals);
    } catch {
      return undefined;
    }
  }, [amountStr, decimals]);

  const nextTotal =
    stakeOfRead.data !== undefined && parsedAmount !== undefined
      ? stakeOfRead.data + parsedAmount
      : undefined;
  const belowMin =
    parsedAmount !== undefined &&
    parsedAmount > BigInt(0) &&
    minStakeRead.data !== undefined &&
    nextTotal !== undefined &&
    nextTotal < minStakeRead.data;

  const exceedsBalance =
    parsedAmount !== undefined &&
    balanceRead.data !== undefined &&
    parsedAmount > balanceRead.data;

  const amountParseInvalid = amountStr.trim() !== "" && parsedAmount === undefined;
  const stakeAmountInvalid = exceedsBalance || belowMin || amountParseInvalid;

  const needsApproval =
    parsedAmount !== undefined &&
    parsedAmount > BigInt(0) &&
    allowanceRead.data !== undefined &&
    allowanceRead.data < parsedAmount;

  const amountDisplay =
    decimals !== undefined && parsedAmount !== undefined
      ? `${formatUnits(parsedAmount, decimals)} (${parsedAmount.toString()} ${t("staking_stake_rawUnits")})`
      : amountStr.trim() || t("ui_em_dash");

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveWriteErr,
    reset: resetApprove,
  } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    writeContract: writeStake,
    data: stakeHash,
    isPending: stakePending,
    error: stakeWriteErr,
    reset: resetStake,
  } = useWriteContract();
  const { isLoading: stakeConfirming, isSuccess: stakeSuccess } = useWaitForTransactionReceipt({ hash: stakeHash });

  const busy = approvePending || approveConfirming || stakePending || stakeConfirming;

  useEffect(() => {
    if (approveSuccess) {
      void allowanceRead.refetch?.();
    }
  }, [approveSuccess, allowanceRead]);

  useEffect(() => {
    if (stakeSuccess) {
      void stakeOfRead.refetch?.();
      void balanceRead.refetch?.();
      void allowanceRead.refetch?.();
      setAmountStr("");
      resetStake();
      resetApprove();
    }
  }, [stakeSuccess, stakeOfRead, balanceRead, allowanceRead, resetStake, resetApprove]);

  const onApprove = () => {
    if (
      !stakingAddress ||
      !token ||
      parsedAmount === undefined ||
      parsedAmount === BigInt(0) ||
      exceedsBalance
    )
      return;
    writeApprove({
      address: token,
      abi: erc20TokenAbi,
      functionName: "approve",
      args: [stakingAddress, parsedAmount],
    });
  };

  const onStake = () => {
    if (
      !stakingAddress ||
      parsedAmount === undefined ||
      parsedAmount === BigInt(0) ||
      belowMin ||
      exceedsBalance
    )
      return;
    writeStake({
      address: stakingAddress,
      abi: identityStakingPoolAbi,
      functionName: "stake",
      args: [parsedAmount],
    });
  };

  const setMaxFromBalance = () => {
    if (decimals === undefined || balanceRead.data === undefined) return;
    setAmountStr(formatUnits(balanceRead.data, decimals));
  };

  return {
    t,
    stakeTitleKey,
    titleId,
    stakeAmountFieldId,
    stakeAmountErrorRegionId,
    stakingAddress,
    chainOk,
    isConnected,
    address,
    expectedChainId,
    amountStr,
    setAmountStr,
    decimals,
    minStakeRead,
    balanceRead,
    allowanceRead,
    parsedAmount,
    belowMin,
    exceedsBalance,
    amountParseInvalid,
    stakeAmountInvalid,
    needsApproval,
    amountDisplay,
    approvePending,
    approveConfirming,
    approveWriteErr,
    stakePending,
    stakeConfirming,
    stakeWriteErr,
    busy,
    onApprove,
    onStake,
    setMaxFromBalance,
    token,
  };
}

export type StakingStakePanelViewModel = ReturnType<typeof useStakingStakePanel>;
