"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { formatUnits, isAddress, parseUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20TokenAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import { getGuideStakingAddress, getProviderStakingAddress } from "@/lib/stakingEnv";
import type { StakingPanelVariant, StakingPoolKind } from "./StakingContractPanel";
import { StakingL5Panel } from "./StakingL5Panel";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import {
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { useStakingGuideDbSync } from "@/lib/staking/useStakingGuideDbSync";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

import { StakingPanelDisconnectedState } from "./StakingPanelDisconnectedState";
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
export function StakingWithdrawPanel({
  pool,
  panelVariant = "legacy",
  embedded = false,
}: {
  pool: StakingPoolKind;
  panelVariant?: StakingPanelVariant;
  embedded?: boolean;
}) {
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
  const { status: deploymentStatus } = useStakingContractDeployment(stakingAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);
  const userEnabled = Boolean(readsEnabled && address && isConnected);
  const titleId = useId();
  const shell = panelVariant === "warm" ? TT_STAKING_PAGE_L5.panelCard : TT_STAKING_PAGE_L5.legacyPanel;
  const warm = panelVariant === "warm";
  const inputCls = warm
    ? TT_STAKING_PAGE_L5.input
    : `mt-1 block min-h-[44px] w-48 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-body text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`;
  const chipBtnCls = warm
    ? TT_STAKING_PAGE_L5.chipBtn
    : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`;
  const submitBtnCls = warm
    ? TT_STAKING_PAGE_L5.secondaryBtn + " min-h-[44px] font-semibold"
    : "btn-console inline-flex justify-center rounded-[var(--radius-sm)] border border-ink-400 bg-white px-5 py-2.5 text-center text-small font-semibold text-ink-900 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50";
  const labelCls = warm ? TT_STAKING_PAGE_L5.inputLabel : "text-small text-ink-700";
  const metaCls = warm ? TT_STAKING_PAGE_L5.metaProse : "text-meta text-ink-600";
  const withdrawAmountFieldId = useId();
  const withdrawAmountErrorRegionId = useId();
  const { syncAfterTx, syncing: dbSyncing, syncError: dbSyncError } = useStakingGuideDbSync(pool);

  const [amountStr, setAmountStr] = useState("");

  const tokenRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "token",
    query: { enabled: readsEnabled },
  });
  const tokenAddr = tokenRead.data;
  const token = tokenAddr && isAddress(tokenAddr) ? (tokenAddr as `0x${string}`) : undefined;

  const decimalsRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "decimals",
    query: { enabled: Boolean(readsEnabled && token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const minStakeRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "MIN_STAKE",
    query: { enabled: readsEnabled },
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

  const remainingAfterWithdraw =
    stakeOfRead.data !== undefined && parsedAmount !== undefined
      ? stakeOfRead.data - parsedAmount
      : undefined;
  const belowMinAfterWithdraw =
    parsedAmount !== undefined &&
    parsedAmount > BigInt(0) &&
    minStakeRead.data !== undefined &&
    remainingAfterWithdraw !== undefined &&
    remainingAfterWithdraw > BigInt(0) &&
    remainingAfterWithdraw < minStakeRead.data;

  const amountParseInvalid = amountStr.trim() !== "" && parsedAmount === undefined;
  const withdrawAmountInvalid = exceedsStake || amountParseInvalid || belowMinAfterWithdraw;

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
    if (!withdrawSuccess) return;
    void (async () => {
      const stakeRefetch = await stakeOfRead.refetch?.();
      void balanceRead.refetch?.();
      const total = stakeRefetch?.data ?? stakeOfRead.data;
      await syncAfterTx(total, decimals);
      setAmountStr("");
      resetWithdraw();
    })();
  }, [withdrawSuccess, stakeOfRead, balanceRead, resetWithdraw, syncAfterTx, decimals]);

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

  if (deploymentStatus === "missing") {
    return null;
  }

  if (!isConnected || !address) {
    if (embedded) return null;
    return (
      <StakingL5Panel
        title={t(withdrawTitleKey)}
        titleId={titleId}
        subtitle={t("staking_withdraw_subtitle")}
        variant={panelVariant}
      >
        <StakingPanelDisconnectedState />
      </StakingL5Panel>
    );
  }

  const errMsg = mapWalletWriteError(withdrawErr as Error | undefined, t, WITHDRAW_WRITE_ERROR_OPTS);

  const guideSimpleWithdraw = pool === "guide" && embedded;
  const hasStake =
    stakeOfRead.data !== undefined && stakeOfRead.data > BigInt(0) && !stakeOfRead.isLoading;

  const withdrawBody = (
    <>
      {!embedded && stakeOfRead.data !== undefined && decimals !== undefined ? (
        <p className={`mt-2 ${metaCls}`}>
          {t("staking_withdraw_currentStake")}
          {t("market_fin_colon")}
          {formatUnits(stakeOfRead.data, decimals)}
        </p>
      ) : null}
      {stakeOfRead.data !== undefined && stakeOfRead.data === BigInt(0) && !stakeOfRead.isLoading ? (
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.bodyProse}`}>{t("staking_withdraw_noStake")}</p>
      ) : null}

      {guideSimpleWithdraw ? (
        hasStake && decimals !== undefined && token && stakingAddress ? (
          <div className="mt-4">
            <StakingTxFacts
              expectedChainId={expectedChainId}
              stakingAddress={stakingAddress}
              tokenAddress={token}
              amountDisplay={formatUnits(stakeOfRead.data!, decimals)}
              action="withdraw"
              variant={warm ? "warm" : "legacy"}
            >
              <p className={`mb-3 ${metaCls}`}>
                {t("staking_guide_withdraw_full_hint", {
                  amount: formatUnits(stakeOfRead.data!, decimals),
                })}
              </p>
              {errMsg ? (
                <p className="mb-3 text-small text-danger" role="alert">
                  {errMsg}
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                aria-busy={busy ? true : undefined}
                className={warm ? TT_STAKING_PAGE_L5.txConfirmCtaBtn : submitBtnCls}
                data-tt-staking-guide-withdraw-full="1"
                onClick={() => {
                  if (!stakingAddress || stakeOfRead.data === undefined || stakeOfRead.data === BigInt(0)) {
                    return;
                  }
                  writeWithdraw({
                    address: stakingAddress,
                    abi: identityStakingPoolAbi,
                    functionName: "withdraw",
                    args: [stakeOfRead.data],
                  });
                }}
              >
                {busy
                  ? t("staking_stake_pending")
                  : warm
                    ? t("staking_tx_cta_withdraw")
                    : t("staking_guide_withdraw_full_cta")}
              </button>
              {dbSyncing ? (
                <p className={`mt-3 ${metaCls}`} role="status">
                  {t("staking_db_sync_inProgress")}
                </p>
              ) : null}
              {dbSyncError ? (
                <p className={`mt-2 ${TT_STAKING_PAGE_L5.calloutDanger}`} role="alert">
                  {t("staking_db_sync_error")} {dbSyncError}
                </p>
              ) : null}
            </StakingTxFacts>
          </div>
        ) : null
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label htmlFor={withdrawAmountFieldId} className={labelCls}>
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
              className={inputCls}
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
              className={chipBtnCls}
            >
              {t("staking_withdraw_max")}
            </button>
          </form>
        </div>
      )}

      {!guideSimpleWithdraw && withdrawAmountInvalid ? (
        <div id={withdrawAmountErrorRegionId} className="mt-3 space-y-2" role="alert">
          {exceedsStake ? <p className="text-body text-warning">{t("staking_withdraw_exceedsStake")}</p> : null}
          {belowMinAfterWithdraw ? (
            <p className="text-body text-warning">{t("staking_withdraw_belowMinAfter")}</p>
          ) : null}
          {amountParseInvalid ? <p className="text-body text-danger">{t("staking_stake_invalidAmount")}</p> : null}
        </div>
      ) : null}

      {!guideSimpleWithdraw &&
      token &&
      stakingAddress &&
      parsedAmount !== undefined &&
      parsedAmount > BigInt(0) &&
      !exceedsStake ? (
        <div className="mt-4">
          <StakingTxFacts
            expectedChainId={expectedChainId}
            stakingAddress={stakingAddress}
            tokenAddress={token}
            amountDisplay={amountDisplay}
            action="withdraw"
            variant={warm ? "warm" : "legacy"}
          >
            {errMsg ? (
              <p className="mb-3 text-small text-danger" role="alert">
                {errMsg}
              </p>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onWithdraw();
              }}
            >
              <button
                type="submit"
                disabled={busy || belowMinAfterWithdraw}
                aria-busy={busy ? true : undefined}
                className={warm ? TT_STAKING_PAGE_L5.txConfirmCtaBtn : submitBtnCls}
              >
                {busy
                  ? t("staking_stake_pending")
                  : warm
                    ? t("staking_tx_cta_withdraw")
                    : t("staking_withdraw_submit")}
              </button>
            </form>
          </StakingTxFacts>
        </div>
      ) : !guideSimpleWithdraw &&
        !exceedsStake &&
        !(stakeOfRead.data !== undefined && stakeOfRead.data === BigInt(0)) ? (
        <p className={`mt-4 ${metaCls}`}>{t("staking_withdraw_enterAmount")}</p>
      ) : null}
      {dbSyncing ? (
        <p className={`mt-2 ${metaCls}`} role="status">
          {t("staking_db_sync_inProgress")}
        </p>
      ) : null}
      {dbSyncError ? (
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.calloutDanger}`} role="alert">
          {t("staking_db_sync_error")} {dbSyncError}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    if (
      guideSimpleWithdraw &&
      stakeOfRead.data !== undefined &&
      stakeOfRead.data === BigInt(0) &&
      !stakeOfRead.isLoading
    ) {
      return null;
    }
    return (
      <div className="min-w-0" data-tt-staking-withdraw-embedded="1">
        <h3 className="text-small font-semibold text-ref-sun/85">{t(withdrawTitleKey)}</h3>
        <p className={`mt-1 ${metaCls}`}>{t("staking_guide_withdraw_subtitle_short")}</p>
        {withdrawBody}
      </div>
    );
  }

  return (
    <StakingL5Panel
      title={t(withdrawTitleKey)}
      titleId={titleId}
      subtitle={t("staking_withdraw_subtitle")}
      address={stakingAddress}
      variant={panelVariant}
    >
      {withdrawBody}
    </StakingL5Panel>
  );
}
