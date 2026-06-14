"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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

import {
  GUIDE_IDENTITY_STAKE_TIER_USDC,
  computeGuideStakeDeltaToTierUsdc,
  formatGuideStakeDeltaUsdc,
  type GuideIdentityStakeTierUsdc,
} from "@/lib/guide/guideIdentityStakeTiers";

import { StakingGuideTierSelector } from "./StakingGuideTierSelector";
import { StakingPanelDisconnectedState } from "./StakingPanelDisconnectedState";
import { useStakingStakePrefill } from "./StakingStakePrefillContext";
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
export function StakingStakePanel({
  pool,
  panelVariant = "legacy",
  embedded = false,
}: {
  pool: StakingPoolKind;
  panelVariant?: StakingPanelVariant;
  /** 嵌入统一工作台：无独立大卡壳；未连钱包时由父级统一展示 */
  embedded?: boolean;
}) {
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
    ? TT_STAKING_PAGE_L5.trustSubmitBtn
    : "btn-console inline-flex justify-center rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50";
  const approveBtnCls = warm
    ? TT_STAKING_PAGE_L5.submitBtn
    : "btn-console inline-flex justify-center rounded-[var(--radius-sm)] bg-ink-800 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50";
  const labelCls = warm ? TT_STAKING_PAGE_L5.inputLabel : "text-small text-ink-700";
  const metaCls = warm ? TT_STAKING_PAGE_L5.metaProse : "text-meta text-ink-600";
  const stakeAmountFieldId = useId();
  const stakeAmountErrorRegionId = useId();
  const { syncAfterTx, syncing: dbSyncing, syncError: dbSyncError } = useStakingGuideDbSync(pool);
  const { prefillAmount, clearPrefill } = useStakingStakePrefill();

  const [amountStr, setAmountStr] = useState("");
  const [selectedTier, setSelectedTier] = useState<GuideIdentityStakeTierUsdc | null>(null);
  const autoTierAppliedRef = useRef(false);
  const useGuideTiers = pool === "guide";

  const applyTierDelta = (tier: GuideIdentityStakeTierUsdc, delta: string) => {
    setSelectedTier(tier);
    setAmountStr(delta);
  };

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

  const currentStakeDisplay =
    stakeOfRead.data !== undefined && decimals !== undefined
      ? formatUnits(stakeOfRead.data, decimals)
      : null;

  useEffect(() => {
    if (prefillAmount == null || prefillAmount === "") return;
    if (useGuideTiers) {
      const prefillN = Number.parseFloat(prefillAmount);
      const tier =
        GUIDE_IDENTITY_STAKE_TIER_USDC.find((t) => t >= prefillN) ??
        GUIDE_IDENTITY_STAKE_TIER_USDC[0];
      const delta = formatGuideStakeDeltaUsdc(
        computeGuideStakeDeltaToTierUsdc(currentStakeDisplay ?? "0", tier),
      );
      applyTierDelta(tier, delta);
    } else {
      setAmountStr(prefillAmount);
    }
    clearPrefill();
  }, [prefillAmount, clearPrefill, useGuideTiers, currentStakeDisplay]);

  const balanceRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(userEnabled && token) },
  });

  useEffect(() => {
    if (!useGuideTiers || !embedded || autoTierAppliedRef.current || selectedTier != null) return;
    if (currentStakeDisplay == null) return;
    const walletN =
      balanceRead.data !== undefined && decimals !== undefined
        ? Number.parseFloat(formatUnits(balanceRead.data, decimals))
        : null;
    const nextTier =
      GUIDE_IDENTITY_STAKE_TIER_USDC.find((tier) => {
        const deltaN = computeGuideStakeDeltaToTierUsdc(currentStakeDisplay, tier);
        if (deltaN <= 0) return false;
        if (walletN != null && Number.isFinite(walletN) && deltaN > walletN) return false;
        return true;
      }) ?? null;
    if (!nextTier) {
      autoTierAppliedRef.current = true;
      return;
    }
    const delta = formatGuideStakeDeltaUsdc(
      computeGuideStakeDeltaToTierUsdc(currentStakeDisplay, nextTier),
    );
    if (Number.parseFloat(delta) > 0) {
      applyTierDelta(nextTier, delta);
    }
    autoTierAppliedRef.current = true;
  }, [useGuideTiers, embedded, currentStakeDisplay, selectedTier, balanceRead.data, decimals]);

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

  const amountDisplayHuman =
    decimals !== undefined && parsedAmount !== undefined
      ? formatUnits(parsedAmount, decimals)
      : amountStr.trim() || t("ui_em_dash");
  const amountDisplay =
    useGuideTiers && warm
      ? amountDisplayHuman
      : decimals !== undefined && parsedAmount !== undefined
        ? `${amountDisplayHuman} (${parsedAmount.toString()} ${t("staking_stake_rawUnits")})`
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
    if (!stakeSuccess) return;
    void (async () => {
      const stakeRefetch = await stakeOfRead.refetch?.();
      void balanceRead.refetch?.();
      void allowanceRead.refetch?.();
      const total = stakeRefetch?.data ?? stakeOfRead.data;
      await syncAfterTx(total, decimals);
      setAmountStr("");
      resetStake();
      resetApprove();
    })();
  }, [
    stakeSuccess,
    stakeOfRead,
    balanceRead,
    allowanceRead,
    resetStake,
    resetApprove,
    syncAfterTx,
    decimals,
  ]);

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

  if (deploymentStatus === "missing") {
    return null;
  }

  if (!isConnected || !address) {
    if (embedded) return null;
    return (
      <StakingL5Panel title={t(stakeTitleKey)} titleId={titleId} subtitle={t("staking_stake_subtitle")} variant={panelVariant}>
        <StakingPanelDisconnectedState />
      </StakingL5Panel>
    );
  }

  const approveErr = mapWalletWriteError(approveWriteErr as Error | undefined, t, STAKE_WRITE_ERROR_OPTS);
  const stakeErr = mapWalletWriteError(stakeWriteErr as Error | undefined, t, STAKE_WRITE_ERROR_OPTS);

  const stakeBody = (
    <>
      {!embedded && minStakeRead.data !== undefined && decimals !== undefined ? (
        <p className={`mt-2 ${metaCls}`}>
          {t("staking_stake_minHint")}
          {t("market_fin_colon")}
          {formatUnits(minStakeRead.data, decimals)} ({t("staking_stake_minTotalNote")})
        </p>
      ) : null}

      {useGuideTiers ? (
        <div className="mt-4">
          <StakingGuideTierSelector
            currentStakeDisplay={currentStakeDisplay}
            selectedTier={selectedTier}
            onSelectTier={applyTierDelta}
            walletBalanceDisplay={
              balanceRead.data !== undefined && decimals !== undefined
                ? formatUnits(balanceRead.data, decimals)
                : null
            }
            disabled={busy || decimals === undefined}
          />
          {selectedTier != null && amountStr.trim() !== "" && amountStr !== "0" ? (
            <p className={`mt-3 ${metaCls}`} role="status">
              {t("staking_guide_tier_stake_preview", {
                delta: amountStr,
                total: String(selectedTier),
              })}
            </p>
          ) : selectedTier != null && amountStr === "0" ? (
            <p className={`mt-3 ${metaCls}`}>{t("staking_guide_tier_already_at_target")}</p>
          ) : (
            <p className={`mt-3 ${metaCls}`}>{t("staking_guide_tier_pick_one")}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label htmlFor={stakeAmountFieldId} className={labelCls}>
            {t("staking_stake_amountLabel")}
            <input
              id={stakeAmountFieldId}
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              disabled={busy || decimals === undefined}
              aria-invalid={stakeAmountInvalid}
              aria-errormessage={stakeAmountInvalid ? stakeAmountErrorRegionId : undefined}
              className={inputCls}
              autoComplete="off"
              spellCheck={false}
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
              className={chipBtnCls}
            >
              {t("staking_stake_max")}
            </button>
          </form>
        </div>
      )}

      {!useGuideTiers && balanceRead.data !== undefined && decimals !== undefined ? (
        <p className={`mt-2 ${metaCls}`}>
          {t("staking_stake_walletBalance")}
          {t("market_fin_colon")}
          {formatUnits(balanceRead.data, decimals)}
        </p>
      ) : null}
      {useGuideTiers && balanceRead.data !== undefined && decimals !== undefined ? (
        <p className={`mt-2 ${metaCls}`}>
          {t("staking_stake_walletBalance_short", { amount: formatUnits(balanceRead.data, decimals) })}
        </p>
      ) : null}
      {!useGuideTiers && allowanceRead.data !== undefined && decimals !== undefined ? (
        <p className={`mt-1 ${metaCls}`}>
          {t("staking_stake_allowance")}
          {t("market_fin_colon")}
          {formatUnits(allowanceRead.data, decimals)}
        </p>
      ) : null}

      {stakeAmountInvalid ? (
        <div id={stakeAmountErrorRegionId} className="mt-3 space-y-2" role="alert">
          {exceedsBalance ? (
            <p className="text-body text-warning">
              {useGuideTiers
                ? t("staking_guide_tier_exceeds_balance", {
                    need: amountStr.trim() || t("ui_em_dash"),
                    wallet:
                      balanceRead.data !== undefined && decimals !== undefined
                        ? formatUnits(balanceRead.data, decimals)
                        : t("ui_em_dash"),
                  })
                : t("staking_stake_exceedsBalance")}
            </p>
          ) : null}
          {belowMin ? <p className="text-body text-warning">{t("staking_stake_belowMin")}</p> : null}
          {amountParseInvalid ? <p className="text-body text-danger">{t("staking_stake_invalidAmount")}</p> : null}
        </div>
      ) : null}

      {token && stakingAddress ? (
        <div className="mt-4 space-y-4">
          {needsApproval && parsedAmount && parsedAmount > BigInt(0) ? (
            <StakingTxFacts
              expectedChainId={expectedChainId}
              stakingAddress={stakingAddress}
              tokenAddress={token}
              amountDisplay={amountDisplay}
              action="approve"
              variant={warm ? "warm" : "legacy"}
              step={1}
              stepTotal={2}
            >
              {approveErr ? (
                <p className="mb-3 text-small text-danger" role="alert">
                  {approveErr}
                </p>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onApprove();
                }}
              >
                <button
                  type="submit"
                  disabled={busy || belowMin || exceedsBalance || parsedAmount === undefined}
                  aria-busy={busy ? true : undefined}
                  className={warm ? TT_STAKING_PAGE_L5.txConfirmCtaBtn : approveBtnCls}
                >
                  {approvePending || approveConfirming
                    ? t("staking_stake_pending")
                    : warm
                      ? t("staking_tx_cta_approve")
                      : t("staking_stake_approve")}
                </button>
              </form>
            </StakingTxFacts>
          ) : null}

          {!needsApproval && parsedAmount && parsedAmount > BigInt(0) ? (
            <StakingTxFacts
              expectedChainId={expectedChainId}
              stakingAddress={stakingAddress}
              tokenAddress={token}
              amountDisplay={amountDisplay}
              action="stake"
              variant={warm ? "warm" : "legacy"}
              step={2}
              stepTotal={2}
            >
              {stakeErr ? (
                <p className="mb-3 text-small text-danger" role="alert">
                  {stakeErr}
                </p>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onStake();
                }}
              >
                <button
                  type="submit"
                  disabled={busy || belowMin || exceedsBalance}
                  aria-busy={busy ? true : undefined}
                  className={warm ? TT_STAKING_PAGE_L5.txConfirmCtaBtn : submitBtnCls}
                >
                  {stakePending || stakeConfirming
                    ? t("staking_stake_pending")
                    : warm
                      ? t("staking_tx_cta_stake")
                      : t("staking_stake_submit")}
                </button>
              </form>
            </StakingTxFacts>
          ) : null}

          {!parsedAmount || parsedAmount === BigInt(0) ? (
            <p className={metaCls}>{t("staking_stake_enterAmount")}</p>
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
        </div>
      ) : (
        <p className={`mt-4 ${metaCls}`}>{t("staking_contract_loading")}</p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="min-w-0" data-tt-staking-stake-embedded="1">
        <h3 className="text-small font-semibold text-ref-sun/85">{t(stakeTitleKey)}</h3>
        <p className={`mt-1 ${metaCls}`}>
          {useGuideTiers ? t("staking_guide_stake_subtitle_short") : t("staking_stake_subtitle")}
        </p>
        {stakeBody}
      </div>
    );
  }

  return (
    <StakingL5Panel
      title={t(stakeTitleKey)}
      titleId={titleId}
      subtitle={t("staking_stake_subtitle")}
      address={stakingAddress}
      variant={panelVariant}
    >
      {stakeBody}
    </StakingL5Panel>
  );
}
