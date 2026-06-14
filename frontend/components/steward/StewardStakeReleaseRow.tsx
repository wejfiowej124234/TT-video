"use client";

import { useCallback, useEffect, useMemo } from "react";
import { formatUnits, isAddress } from "viem";
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
import { regionStewardStakePoolAbi } from "@/lib/steward/regionStewardStakeAbi";
import { getRegionStewardStakePoolAddress } from "@/lib/steward/stewardStakeEnv";
import { ME_ONBOARDING_BTN_SECONDARY_CLASS } from "@/app/me/onboarding/meOnboardingPageChrome";

const RELEASE_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /NoActiveStake/i, messageKey: "stewardRelease_errNoStake" },
    { re: /ReleaseDelayPending/i, messageKey: "stewardRelease_errDelayPending" },
    { re: /NothingToRelease/i, messageKey: "stewardRelease_errNothingToRelease" },
    { re: /TransferFailed/i, messageKey: "stewardStake_errTransfer" },
  ],
  rejectKey: "stewardStake_errRejected",
  allowanceKey: "stewardStake_errAllowance",
  genericKey: "stewardStake_errGeneric",
} as const;

export type StewardStakeReleaseRowProps = {
  jurisdictionId: string;
  expectedWallet: string;
  releaseAllowed: boolean;
  onUpdated?: () => void;
  variant?: "light" | "workspaceL5";
};

export function StewardStakeReleaseRow({
  jurisdictionId,
  expectedWallet,
  releaseAllowed,
  onUpdated,
  variant = "light",
}: StewardStakeReleaseRowProps) {
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
  const expected = expectedWallet.trim().toLowerCase();
  const connected = address?.toLowerCase() ?? "";
  const walletMatch = Boolean(connected && connected === expected);
  const userEnabled = Boolean(
    pool && chainOk && jurisdictionBytes && isConnected && walletMatch && isAddress(expectedWallet),
  );

  const stakeRead = useReadContract({
    address: pool ?? undefined,
    abi: regionStewardStakePoolAbi,
    functionName: "stakes",
    args: userEnabled ? [expectedWallet as `0x${string}`, jurisdictionBytes] : undefined,
    query: { enabled: userEnabled },
  });

  const releasableRead = useReadContract({
    address: pool ?? undefined,
    abi: regionStewardStakePoolAbi,
    functionName: "releasableAmount",
    args: userEnabled ? [expectedWallet as `0x${string}`, jurisdictionBytes] : undefined,
    query: { enabled: userEnabled },
  });

  const ttgRead = useReadContract({
    address: pool ?? undefined,
    abi: regionStewardStakePoolAbi,
    functionName: "ttg",
    query: { enabled: Boolean(pool && chainOk) },
  });
  const token = ttgRead.data && isAddress(ttgRead.data) ? ttgRead.data : undefined;

  const decimalsRead = useReadContract({
    address: token,
    abi: [
      {
        type: "function",
        name: "decimals",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }],
      },
    ] as const,
    functionName: "decimals",
    query: { enabled: Boolean(token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : 18;

  const position = stakeRead.data;
  const amount = position?.[0];
  const releaseRequestedAt = position?.[3] ?? BigInt(0);
  const releasedAmount = position?.[4] ?? BigInt(0);
  const active = position?.[5] === true;
  const releasable = releasableRead.data ?? BigInt(0);

  const {
    writeContract: writeRequestRelease,
    data: requestHash,
    isPending: requestPending,
    error: requestErr,
  } = useWriteContract();
  const { isLoading: requestConfirming, isSuccess: requestSuccess } = useWaitForTransactionReceipt({
    hash: requestHash,
  });

  const {
    writeContract: writeClaim,
    data: claimHash,
    isPending: claimPending,
    error: claimErr,
  } = useWriteContract();
  const { isLoading: claimConfirming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const busy = requestPending || requestConfirming || claimPending || claimConfirming;

  const onRequestRelease = useCallback(() => {
    if (!pool || !jurisdictionBytes) return;
    writeRequestRelease({
      address: pool,
      abi: regionStewardStakePoolAbi,
      functionName: "requestRelease",
      args: [jurisdictionBytes],
    });
  }, [jurisdictionBytes, pool, writeRequestRelease]);

  const onClaim = useCallback(() => {
    if (!pool || !jurisdictionBytes) return;
    writeClaim({
      address: pool,
      abi: regionStewardStakePoolAbi,
      functionName: "claimReleased",
      args: [jurisdictionBytes],
    });
  }, [jurisdictionBytes, pool, writeClaim]);

  useEffect(() => {
    if (!requestSuccess && !claimSuccess) return;
    void stakeRead.refetch?.();
    void releasableRead.refetch?.();
    onUpdated?.();
  }, [requestSuccess, claimSuccess, stakeRead, releasableRead, onUpdated]);

  const shellClass =
    variant === "workspaceL5"
      ? "rounded-xl border border-ref-sun/15 bg-ref-sun/[0.04] p-3"
      : "rounded-[var(--radius-sm)] border border-ink-100 bg-white/80 p-3";

  const labelClass =
    variant === "workspaceL5"
      ? "text-small text-slate-200"
      : "font-mono text-small font-semibold text-ink-900";
  const metaClass = variant === "workspaceL5" ? "text-meta text-slate-400" : "text-meta text-ink-600";

  if (!pool) {
    return (
      <li className={shellClass} data-tt-steward-release-row={jurisdictionId}>
        <p className={`${metaClass} text-danger`}>{t("stewardStake_poolMissing")}</p>
      </li>
    );
  }

  if (!stakeCountryCode || !jurisdictionBytes) {
    return (
      <li className={shellClass} data-tt-steward-release-row={jurisdictionId}>
        <span className={labelClass}>{jurisdictionId}</span>
        <p className={`mt-2 text-small text-danger`} role="alert">
          {t("stewardStake_invalidJurisdiction")}
        </p>
      </li>
    );
  }

  const stakedLabel =
    amount !== undefined && amount > BigInt(0)
      ? `${formatUnits(amount, decimals)} TTG`
      : t("ui_em_dash");
  const releasedLabel =
    releasedAmount > BigInt(0) ? `${formatUnits(releasedAmount, decimals)} TTG` : t("ui_em_dash");
  const claimableLabel =
    releasable > BigInt(0) ? `${formatUnits(releasable, decimals)} TTG` : t("ui_em_dash");

  const releaseRequested = releaseRequestedAt > BigInt(0);
  const canRequestOnChain =
    releaseAllowed && active && amount !== undefined && amount > BigInt(0) && !releaseRequested;
  const canClaim = releaseAllowed && active && releaseRequested && releasable > BigInt(0);

  return (
    <li className={shellClass} data-tt-steward-release-row={jurisdictionId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={labelClass}>{jurisdictionId}</span>
        <span className={`${metaClass} text-ref-sun`}>
          {releaseRequested
            ? t("stewardRelease_status_vesting")
            : active
              ? t("stewardRelease_status_locked")
              : t("stewardRelease_status_complete")}
        </span>
      </div>
      <dl className={`mt-2 space-y-1 ${metaClass}`}>
        <div className="flex justify-between gap-2">
          <dt>{t("stewardRelease_staked")}</dt>
          <dd className="font-mono">{stakedLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("stewardRelease_claimed")}</dt>
          <dd className="font-mono">{releasedLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("stewardRelease_claimable_now")}</dt>
          <dd className="font-mono text-emerald-400">{claimableLabel}</dd>
        </div>
      </dl>

      {!chainOk ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {t("stewardStake_wrongChain")}
        </p>
      ) : !isConnected ? (
        <p className={`mt-2 ${metaClass}`}>{t("stewardStake_connectWallet")}</p>
      ) : !walletMatch ? (
        <p className="mt-2 text-small text-amber-300" role="alert">
          {t("stewardStake_walletMismatch")}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {canRequestOnChain ? (
            <button
              type="button"
              className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
              disabled={busy}
              onClick={onRequestRelease}
              data-testid={`steward-release-request-${jurisdictionId}`}
            >
              {requestPending || requestConfirming
                ? t("staking_stake_pending")
                : t("stewardRelease_request_btn")}
            </button>
          ) : null}
          {canClaim ? (
            <button
              type="button"
              className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
              disabled={busy}
              onClick={onClaim}
              data-testid={`steward-release-claim-${jurisdictionId}`}
            >
              {claimPending || claimConfirming
                ? t("staking_stake_pending")
                : t("stewardRelease_claim_btn")}
            </button>
          ) : null}
          {releaseAllowed && releaseRequested && releasable === BigInt(0) ? (
            <p className={`${metaClass} self-center`} role="note">
              {t("stewardRelease_delay_vest_hint")}
            </p>
          ) : null}
          {!releaseAllowed && active ? (
            <p className={`${metaClass} self-center`} role="note">
              {t("stewardRelease_offchain_gate_hint")}
            </p>
          ) : null}
        </div>
      )}

      {requestErr ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {mapWalletWriteError(requestErr, t, RELEASE_WRITE_ERROR_OPTS)}
        </p>
      ) : null}
      {claimErr ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {mapWalletWriteError(claimErr, t, RELEASE_WRITE_ERROR_OPTS)}
        </p>
      ) : null}
    </li>
  );
}
