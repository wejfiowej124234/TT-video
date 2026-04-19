"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { formatUnits, isAddress, parseUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20TokenAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import { getGuideStakingAddress, getProviderStakingAddress } from "@/lib/stakingEnv";
import type { StakingPoolKind } from "./StakingContractPanel";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { StakingTxFacts } from "./StakingTxFacts";

const STAKE_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /StakeBelowMinimum/i, messageKey: "staking_stake_errBelowMin" },
    { re: /TransferFailed/i, messageKey: "staking_stake_errTransfer" },
  ],
  rejectKey: "staking_stake_errRejected",
  allowanceKey: "staking_stake_errAllowance",
  genericKey: "staking_stake_errGeneric",
} as const;

/** Phase 3/4：ERC-20 approve + 身份质押池 `stake`。 */
export function StakingStakePanel({ pool }: { pool: StakingPoolKind }) {
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
  const {
    isLoading: approveConfirming,
    isSuccess: approveSuccess,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeStake,
    data: stakeHash,
    isPending: stakePending,
    error: stakeWriteErr,
    reset: resetStake,
  } = useWriteContract();
  const {
    isLoading: stakeConfirming,
    isSuccess: stakeSuccess,
  } = useWaitForTransactionReceipt({ hash: stakeHash });

  const busy =
    approvePending ||
    approveConfirming ||
    stakePending ||
    stakeConfirming;

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

  if (!stakingAddress || !chainOk) {
    return null;
  }

  if (!isConnected || !address) {
    return (
      <section
        className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t(stakeTitleKey)}
        </h2>
        <p className="mt-2 text-body text-ink-600">{t("staking_stake_connect")}</p>
      </section>
    );
  }

  const approveErr = mapWalletWriteError(approveWriteErr as Error | undefined, t, STAKE_WRITE_ERROR_OPTS);
  const stakeErr = mapWalletWriteError(stakeWriteErr as Error | undefined, t, STAKE_WRITE_ERROR_OPTS);

  return (
    <section
      className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
        {t(stakeTitleKey)}
      </h2>
      <p className="mt-1 text-body text-ink-600">{t("staking_stake_subtitle")}</p>

      {minStakeRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-2 text-meta text-ink-600">
          {t("staking_stake_minHint")}: {formatUnits(minStakeRead.data, decimals)} ({t("staking_stake_minTotalNote")})
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-small text-ink-700">
          {t("staking_stake_amountLabel")}
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            disabled={busy || decimals === undefined}
            className="mt-1 block w-48 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-body text-ink-900"
            autoComplete="off"
          />
        </label>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            setMaxFromBalance();
          }}
        >
          <button
            type="submit"
            disabled={busy || balanceRead.data === undefined || decimals === undefined}
            aria-busy={busy ? true : undefined}
            className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50`}
          >
            {t("staking_stake_max")}
          </button>
        </form>
      </div>

      {balanceRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-2 text-meta text-ink-600">
          {t("staking_stake_walletBalance")}: {formatUnits(balanceRead.data, decimals)}
        </p>
      ) : null}
      {allowanceRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-1 text-meta text-ink-600">
          {t("staking_stake_allowance")}: {formatUnits(allowanceRead.data, decimals)}
        </p>
      ) : null}

      {exceedsBalance ? (
        <p className="mt-3 text-body text-warning" role="alert">
          {t("staking_stake_exceedsBalance")}
        </p>
      ) : null}
      {belowMin ? (
        <p className="mt-3 text-body text-warning" role="alert">
          {t("staking_stake_belowMin")}
        </p>
      ) : null}
      {parsedAmount === undefined && amountStr.trim() !== "" ? (
        <p className="mt-3 text-body text-danger" role="alert">
          {t("staking_stake_invalidAmount")}
        </p>
      ) : null}

      {token && stakingAddress ? (
        <div className="mt-4 space-y-4">
          {needsApproval && parsedAmount && parsedAmount > BigInt(0) ? (
            <>
              <StakingTxFacts
                expectedChainId={expectedChainId}
                stakingAddress={stakingAddress}
                tokenAddress={token}
                amountDisplay={amountDisplay}
                action="approve"
              />
              {approveErr ? (
                <p className="text-small text-danger" role="alert">
                  {approveErr}
                </p>
              ) : null}
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  onApprove();
                }}
              >
                <button
                  type="submit"
                  disabled={busy || belowMin || exceedsBalance || parsedAmount === undefined}
                  aria-busy={busy ? true : undefined}
                  className="btn-console inline-flex justify-center rounded-[var(--radius-sm)] bg-ink-800 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50"
                >
                  {approvePending || approveConfirming ? t("staking_stake_pending") : t("staking_stake_approve")}
                </button>
              </form>
            </>
          ) : null}

          {!needsApproval && parsedAmount && parsedAmount > BigInt(0) ? (
            <>
              <StakingTxFacts
                expectedChainId={expectedChainId}
                stakingAddress={stakingAddress}
                tokenAddress={token}
                amountDisplay={amountDisplay}
                action="stake"
              />
              {stakeErr ? (
                <p className="text-small text-danger" role="alert">
                  {stakeErr}
                </p>
              ) : null}
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  onStake();
                }}
              >
                <button
                  type="submit"
                  disabled={busy || belowMin || exceedsBalance}
                  aria-busy={busy ? true : undefined}
                  className="btn-console inline-flex justify-center rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50"
                >
                  {stakePending || stakeConfirming ? t("staking_stake_pending") : t("staking_stake_submit")}
                </button>
              </form>
            </>
          ) : null}

          {!parsedAmount || parsedAmount === BigInt(0) ? (
            <p className="text-meta text-ink-500">{t("staking_stake_enterAmount")}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-body text-ink-600">{t("staking_contract_loading")}</p>
      )}
    </section>
  );
}
