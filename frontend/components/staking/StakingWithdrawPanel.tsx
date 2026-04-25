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
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

import { StakingTxFacts } from "./StakingTxFacts";

const WITHDRAW_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /InsufficientStake/i, messageKey: "staking_withdraw_errInsufficient" },
    { re: /TransferFailed/i, messageKey: "staking_stake_errTransfer" },
  ],
  rejectKey: "staking_stake_errRejected",
  allowanceKey: "staking_stake_errAllowance",
  genericKey: "staking_stake_errGeneric",
} as const;

/** Phase 3/4：身份质押池 `withdraw` — 将质押代币转回钱包（须 ≤ stakeOf）。 */
export function StakingWithdrawPanel({ pool }: { pool: StakingPoolKind }) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const stakingAddress = useMemo(
    () => (pool === "guide" ? getGuideStakingAddress() : getProviderStakingAddress()),
    [pool],
  );
  const withdrawTitleKey =
    pool === "guide" ? "staking_pool_guide_withdraw_title" : "staking_pool_provider_withdraw_title";
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const userEnabled = Boolean(baseEnabled && address && isConnected);
  const titleId = useId();
  const withdrawAmountFieldId = useId();
  const withdrawAmountErrorRegionId = useId();

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

  const exceedsStake =
    parsedAmount !== undefined &&
    stakeOfRead.data !== undefined &&
    parsedAmount > stakeOfRead.data;

  const amountParseInvalid = amountStr.trim() !== "" && parsedAmount === undefined;
  const withdrawAmountInvalid = exceedsStake || amountParseInvalid;

  const amountDisplay =
    decimals !== undefined && parsedAmount !== undefined
      ? `${formatUnits(parsedAmount, decimals)} (${parsedAmount.toString()} ${t("staking_stake_rawUnits")})`
      : amountStr.trim() || t("ui_em_dash");

  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: withdrawPending,
    error: withdrawErr,
    reset: resetWithdraw,
  } = useWriteContract();
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const busy = withdrawPending || withdrawConfirming;

  useEffect(() => {
    if (withdrawSuccess) {
      void stakeOfRead.refetch?.();
      void balanceRead.refetch?.();
      setAmountStr("");
      resetWithdraw();
    }
  }, [withdrawSuccess, stakeOfRead, balanceRead, resetWithdraw]);

  const onWithdraw = () => {
    if (
      !stakingAddress ||
      parsedAmount === undefined ||
      parsedAmount === BigInt(0) ||
      exceedsStake ||
      stakeOfRead.data === undefined
    ) {
      return;
    }
    writeWithdraw({
      address: stakingAddress,
      abi: identityStakingPoolAbi,
      functionName: "withdraw",
      args: [parsedAmount],
    });
  };

  const setMaxStake = () => {
    if (decimals === undefined || stakeOfRead.data === undefined) return;
    setAmountStr(formatUnits(stakeOfRead.data, decimals));
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
          {t(withdrawTitleKey)}
        </h2>
        <p className="mt-2 text-body text-ink-600">{t("staking_stake_connect")}</p>
      </section>
    );
  }

  const errMsg = mapWalletWriteError(withdrawErr as Error | undefined, t, WITHDRAW_WRITE_ERROR_OPTS);

  return (
    <section
      className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
        {t(withdrawTitleKey)}
      </h2>
      <p className="mt-1 text-body text-ink-600">{t("staking_withdraw_subtitle")}</p>

      {stakeOfRead.data !== undefined && decimals !== undefined ? (
        <p className="mt-2 text-meta text-ink-600">
          {t("staking_withdraw_currentStake")}
          {t("market_fin_colon")}
          {formatUnits(stakeOfRead.data, decimals)}
        </p>
      ) : null}
      {stakeOfRead.data !== undefined && stakeOfRead.data === BigInt(0) && !stakeOfRead.isLoading ? (
        <p className="mt-2 text-body text-ink-600">{t("staking_withdraw_noStake")}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label htmlFor={withdrawAmountFieldId} className="text-small text-ink-700">
          {t("staking_withdraw_amountLabel")}
          <input
            id={withdrawAmountFieldId}
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            disabled={busy || decimals === undefined}
            aria-invalid={withdrawAmountInvalid}
            aria-errormessage={withdrawAmountInvalid ? withdrawAmountErrorRegionId : undefined}
            className={`mt-1 block min-h-[44px] w-48 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-body text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            setMaxStake();
          }}
        >
          <button
            type="submit"
            disabled={busy || stakeOfRead.data === undefined || decimals === undefined || stakeOfRead.data === BigInt(0)}
            aria-busy={busy ? true : undefined}
            className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("staking_withdraw_max")}
          </button>
        </form>
      </div>

      {withdrawAmountInvalid ? (
        <div id={withdrawAmountErrorRegionId} className="mt-3 space-y-2" role="alert">
          {exceedsStake ? <p className="text-body text-warning">{t("staking_withdraw_exceedsStake")}</p> : null}
          {amountParseInvalid ? <p className="text-body text-danger">{t("staking_stake_invalidAmount")}</p> : null}
        </div>
      ) : null}

      {token && stakingAddress && parsedAmount !== undefined && parsedAmount > BigInt(0) && !exceedsStake ? (
        <div className="mt-4 space-y-3">
          <StakingTxFacts
            expectedChainId={expectedChainId}
            stakingAddress={stakingAddress}
            tokenAddress={token}
            amountDisplay={amountDisplay}
            action="withdraw"
          />
          {errMsg ? (
            <p className="text-small text-danger" role="alert">
              {errMsg}
            </p>
          ) : null}
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onWithdraw();
            }}
          >
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy ? true : undefined}
              className="btn-console inline-flex justify-center rounded-[var(--radius-sm)] border border-ink-400 bg-white px-5 py-2.5 text-center text-small font-semibold text-ink-900 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50"
            >
              {busy ? t("staking_stake_pending") : t("staking_withdraw_submit")}
            </button>
          </form>
        </div>
      ) : !exceedsStake &&
        !(stakeOfRead.data !== undefined && stakeOfRead.data === BigInt(0)) ? (
        <p className="mt-4 text-meta text-ink-500">{t("staking_withdraw_enterAmount")}</p>
      ) : null}
    </section>
  );
}
