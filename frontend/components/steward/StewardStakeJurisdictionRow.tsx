"use client";

import { useCallback, useEffect, useMemo } from "react";
import { formatUnits, isAddress, keccak256, toBytes } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import {
  stakeJurisdictionCountryCode,
  tryJurisdictionIdToBytes2,
} from "@/lib/steward/jurisdictionBytes2";
import {
  formatProtocolStewardStakeTtgUnits,
  formatStewardWalletDisplay,
  formatTtgAmount,
} from "@/lib/steward/stewardStakeUiModel";
import { getRegionStewardStakePoolAddress } from "@/lib/steward/stewardStakeEnv";
import { regionStewardStakePoolAbi } from "@/lib/steward/regionStewardStakeAbi";
import { erc20TokenAbi } from "@/lib/stakingAbi";
import { ME_ONBOARDING_BTN_SECONDARY_CLASS } from "@/app/me/onboarding/meOnboardingPageChrome";

const STAKE_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /BelowMinStake/i, messageKey: "stewardStake_errBelowMin" },
    { re: /JurisdictionAlreadyStaked/i, messageKey: "stewardStake_errAlreadyStaked" },
    { re: /TransferFailed/i, messageKey: "stewardStake_errTransfer" },
  ],
  rejectKey: "stewardStake_errRejected",
  allowanceKey: "stewardStake_errAllowance",
  genericKey: "stewardStake_errGeneric",
} as const;

export type StewardStakeJurisdictionRowProps = {
  jurisdictionId: string;
  applicationId: string;
  expectedWallet: string;
  onStaked?: () => void;
  /** Stable ref recommended — row passes `jurisdictionId` as first arg (see `updateRowStake`). */
  onStakeStatus?: (jurisdictionId: string, hasStake: boolean | null, loadError: boolean) => void;
};

export function StewardStakeJurisdictionRow({
  jurisdictionId,
  applicationId,
  expectedWallet,
  onStaked,
  onStakeStatus,
}: StewardStakeJurisdictionRowProps) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const pool = getRegionStewardStakePoolAddress();
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const stakeCountryCode = useMemo(() => stakeJurisdictionCountryCode(jurisdictionId), [jurisdictionId]);
  const jurisdictionBytes = useMemo(
    () => (stakeCountryCode ? tryJurisdictionIdToBytes2(jurisdictionId) : null),
    [jurisdictionId, stakeCountryCode],
  );
  const applicationBytes32 = useMemo(
    () => keccak256(toBytes(applicationId)),
    [applicationId],
  );
  const expected = expectedWallet.trim().toLowerCase();
  const connected = address?.toLowerCase() ?? "";
  const walletMatch = Boolean(connected && connected === expected);

  const baseEnabled = Boolean(pool && chainOk && jurisdictionBytes);
  const userEnabled = Boolean(baseEnabled && isConnected && walletMatch && isAddress(expectedWallet));

  const hasStakeRead = useReadContract({
    address: pool ?? undefined,
    abi: regionStewardStakePoolAbi,
    functionName: "hasJurisdictionStake",
    args: userEnabled ? [expectedWallet as `0x${string}`, jurisdictionBytes] : undefined,
    query: { enabled: userEnabled },
  });

  const minStakeRead = useReadContract({
    address: pool ?? undefined,
    abi: regionStewardStakePoolAbi,
    functionName: "minStakeAmount",
    args: [jurisdictionBytes],
    query: { enabled: baseEnabled },
  });

  const ttgRead = useReadContract({
    address: pool ?? undefined,
    abi: regionStewardStakePoolAbi,
    functionName: "ttg",
    query: { enabled: baseEnabled },
  });
  const token = ttgRead.data && isAddress(ttgRead.data) ? (ttgRead.data as `0x${string}`) : undefined;

  const decimalsRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "decimals",
    query: { enabled: Boolean(token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : 18;

  const minAmount = typeof minStakeRead.data === "bigint" ? minStakeRead.data : undefined;
  const alreadyStaked = hasStakeRead.data === true;

  const balanceRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token && address) },
  });

  const allowanceRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "allowance",
    args: address && pool ? [address, pool] : undefined,
    query: { enabled: Boolean(token && address && pool) },
  });

  const needsApproval =
    minAmount !== undefined &&
    minAmount > BigInt(0) &&
    allowanceRead.data !== undefined &&
    allowanceRead.data < minAmount;

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveErr,
  } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    writeContract: writeStake,
    data: stakeHash,
    isPending: stakePending,
    error: stakeErr,
  } = useWriteContract();
  const { isLoading: stakeConfirming, isSuccess: stakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  const busy = approvePending || approveConfirming || stakePending || stakeConfirming;

  const onApprove = useCallback(() => {
    if (!token || !pool || minAmount === undefined || minAmount === BigInt(0)) return;
    writeApprove({
      address: token,
      abi: erc20TokenAbi,
      functionName: "approve",
      args: [pool, minAmount],
    });
  }, [minAmount, pool, token, writeApprove]);

  const onStake = useCallback(() => {
    if (!pool || minAmount === undefined || minAmount === BigInt(0) || !jurisdictionBytes) return;
    writeStake({
      address: pool,
      abi: regionStewardStakePoolAbi,
      functionName: "stake",
      args: [jurisdictionBytes, minAmount, applicationBytes32],
    });
  }, [applicationBytes32, jurisdictionBytes, minAmount, pool, writeStake]);

  useEffect(() => {
    if (approveSuccess) {
      void allowanceRead.refetch?.();
    }
  }, [approveSuccess, allowanceRead]);

  useEffect(() => {
    if (!stakeSuccess) return;
    void hasStakeRead.refetch?.();
    onStaked?.();
  }, [stakeSuccess, hasStakeRead, onStaked]);

  useEffect(() => {
    if (hasStakeRead.isLoading) return;
    if (hasStakeRead.isError) {
      onStakeStatus?.(jurisdictionId, null, true);
      return;
    }
    if (hasStakeRead.data === true || hasStakeRead.data === false) {
      onStakeStatus?.(jurisdictionId, hasStakeRead.data, false);
    }
  }, [hasStakeRead.data, hasStakeRead.isError, hasStakeRead.isLoading, jurisdictionId, onStakeStatus]);

  const canStake =
    minAmount !== undefined &&
    minAmount > BigInt(0) &&
    (!needsApproval || (allowanceRead.data !== undefined && allowanceRead.data >= minAmount));

  const formattedMin =
    formatTtgAmount(minAmount, decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined) ??
    formatProtocolStewardStakeTtgUnits(jurisdictionId);
  const minLabel =
    formattedMin != null ? `${formattedMin} TTG` : t("stewardStake_minAmount_unavailable");

  let statusLabel = t("steward_register_chain_stake_pending_short");
  if (alreadyStaked) statusLabel = t("steward_register_chain_stake_confirmed_short");
  else if (hasStakeRead.isLoading) statusLabel = t("stewardRegister_chainStakeChecking");

  return (
    <li
      className="rounded-[var(--radius-sm)] border border-ink-100 bg-white/80 p-3"
      data-tt-steward-onboarding-stake-row={jurisdictionId}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-small font-semibold text-ink-900">
          {jurisdictionId}
          {stakeCountryCode && stakeCountryCode !== jurisdictionId.trim().toUpperCase()
            ? ` → ${stakeCountryCode}`
            : ""}
        </span>
        <span className="text-meta text-ink-600">{statusLabel}</span>
      </div>
      <p className="mt-1 text-meta text-ink-600">
        {t("stewardStake_minAmount")}: {minLabel}
      </p>

      {!stakeCountryCode || !jurisdictionBytes ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {t("stewardStake_invalidJurisdiction")}
        </p>
      ) : !pool ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {t("stewardStake_poolMissing")}
        </p>
      ) : !chainOk ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {t("stewardStake_wrongChain")}
        </p>
      ) : !isConnected ? (
        <p className="mt-2 text-meta text-ink-600">{t("stewardStake_connectWallet")}</p>
      ) : !walletMatch ? (
        <p className="mt-2 text-small text-amber-900" role="alert">
          {t("stewardStake_walletMismatch")}
          <span className="mt-1 block font-mono text-meta break-all" title={expectedWallet}>
            {formatStewardWalletDisplay(expectedWallet)}
          </span>
        </p>
      ) : alreadyStaked ? (
        <p className="mt-2 text-meta text-emerald-800">{t("stewardStake_done")}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {needsApproval ? (
            <button
              type="button"
              className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
              disabled={busy}
              aria-busy={approvePending || approveConfirming}
              onClick={onApprove}
              data-testid={`steward-stake-approve-${jurisdictionId}`}
            >
              {approvePending || approveConfirming
                ? t("staking_stake_pending")
                : t("stewardStake_approve")}
            </button>
          ) : null}
          <button
            type="button"
            className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
            disabled={busy || !canStake}
            aria-busy={stakePending || stakeConfirming}
            onClick={onStake}
            data-testid={`steward-stake-submit-${jurisdictionId}`}
          >
            {stakePending || stakeConfirming ? t("staking_stake_pending") : t("stewardStake_submit")}
          </button>
        </div>
      )}

      {approveErr ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {mapWalletWriteError(approveErr, t, STAKE_WRITE_ERROR_OPTS)}
        </p>
      ) : null}
      {stakeErr ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {mapWalletWriteError(stakeErr, t, STAKE_WRITE_ERROR_OPTS)}
        </p>
      ) : null}
      {balanceRead.data !== undefined &&
      minAmount !== undefined &&
      balanceRead.data < minAmount &&
      !alreadyStaked ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {t("stewardStake_insufficientBalance")}
        </p>
      ) : null}
    </li>
  );
}
