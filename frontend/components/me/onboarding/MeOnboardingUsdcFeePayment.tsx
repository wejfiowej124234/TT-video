"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { erc20TokenAbi } from "@/lib/stakingAbi";
import {
  getOnboardingFeeReceiverAddress,
  getOnboardingUsdcTokenAddress,
  onboardingFeeMinorToUsdcAtomic,
  onboardingFeeUsdcPaymentConfigured,
} from "@/lib/onboarding/onboardingFeeEnv";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

const TRANSFER_ERROR_OPTS = {
  revertPatterns: [],
  rejectKey: "me_onboarding_usdc_errRejected",
  allowanceKey: "me_onboarding_usdc_errRejected",
  genericKey: "me_onboarding_usdc_errGeneric",
} as const;

export type MeOnboardingUsdcFeePaymentProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  amountMinor: number;
  amountLabel: string;
  onAfterSubmit?: () => void;
};

export function MeOnboardingUsdcFeePayment({
  t,
  amountMinor,
  amountLabel,
  onAfterSubmit,
}: MeOnboardingUsdcFeePaymentProps) {
  const { address, isConnected } = useAccount();
  const receiver = getOnboardingFeeReceiverAddress();
  const token = getOnboardingUsdcTokenAddress();
  const configured = onboardingFeeUsdcPaymentConfigured();
  const [copied, setCopied] = useState(false);

  const decimalsRead = useReadContract({
    address: token ?? undefined,
    abi: erc20TokenAbi,
    functionName: "decimals",
    query: { enabled: Boolean(token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : 6;

  const atomicAmount = useMemo(
    () => onboardingFeeMinorToUsdcAtomic(amountMinor, decimals),
    [amountMinor, decimals],
  );

  const balanceRead = useReadContract({
    address: token ?? undefined,
    abi: erc20TokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token && address && isConnected) },
  });

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeErr,
    reset,
  } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const busy = isPending || confirming;
  const exceedsBalance =
    balanceRead.data !== undefined && atomicAmount > 0n && balanceRead.data < atomicAmount;
  const canPay = configured && isConnected && address && receiver && token && atomicAmount > 0n && !exceedsBalance;

  useEffect(() => {
    if (!configured || !isSuccess) return;
    reset();
    onAfterSubmit?.();
  }, [configured, isSuccess, reset, onAfterSubmit]);

  if (!configured) {
    return (
      <div
        className="mt-3 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 p-3 text-meta text-ink-700"
        role="note"
        data-tt-me-onboarding-usdc-not-configured="1"
      >
        {t("me_onboarding_usdcNotConfigured")}
      </div>
    );
  }

  const onCopyReceiver = async () => {
    if (!receiver) return;
    try {
      await navigator.clipboard.writeText(receiver);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const onTransfer = () => {
    if (!canPay || !token || !receiver) return;
    writeContract({
      address: token,
      abi: erc20TokenAbi,
      functionName: "transfer",
      args: [receiver, atomicAmount],
    });
  };

  const errMsg = mapWalletWriteError(writeErr as Error | undefined, t, TRANSFER_ERROR_OPTS);

  return (
    <div
      className="mt-4 rounded-[var(--radius-sm)] border border-trust-200 bg-trust-50/80 p-4"
      data-tt-me-onboarding-usdc-fee-payment="1"
    >
      <h4 className="text-small font-semibold text-ink-900">{t("me_onboarding_usdcPayTitle")}</h4>
      <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_usdcPayHint")}</p>
      <dl className="mt-3 space-y-2 text-meta text-ink-700">
        <div>
          <dt className="text-ink-500">{t("me_onboarding_usdcAmountLabel")}</dt>
          <dd className="font-semibold text-ink-900">{amountLabel}</dd>
        </div>
        <div>
          <dt className="text-ink-500">{t("me_onboarding_usdcReceiverLabel")}</dt>
          <dd className="break-all font-mono text-small">{receiver}</dd>
        </div>
      </dl>
      <button
        type="button"
        className={`${touchTargetLink44Classes} mt-2 text-small font-semibold text-trust-700 underline underline-offset-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
        onClick={() => void onCopyReceiver()}
      >
        {copied ? t("me_onboarding_usdcCopied") : t("me_onboarding_usdcCopyReceiver")}
      </button>
      {!isConnected ? (
        <p className="mt-3 text-meta text-ink-600">{t("me_onboarding_usdcConnectWallet")}</p>
      ) : (
        <>
          {balanceRead.data !== undefined ? (
            <p className="mt-2 text-meta text-ink-600">
              {t("me_onboarding_usdcWalletBalance")}
              {formatUnits(balanceRead.data, decimals)} USDC
            </p>
          ) : null}
          {exceedsBalance ? (
            <p className="mt-2 text-small text-danger" role="alert">
              {t("me_onboarding_usdcInsufficient")}
            </p>
          ) : null}
          {errMsg ? (
            <p className="mt-2 text-small text-danger" role="alert">
              {errMsg}
            </p>
          ) : null}
          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              onTransfer();
            }}
          >
            <button
              type="submit"
              disabled={!canPay || busy}
              aria-busy={busy ? true : undefined}
              className="btn-console inline-flex min-h-[44px] justify-center rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white disabled:opacity-50"
              data-tt-me-onboarding-usdc-submit="1"
            >
              {busy ? t("me_onboarding_loading") : t("me_onboarding_usdcSubmit")}
            </button>
          </form>
          <p className="mt-2 text-meta text-ink-500">{t("me_onboarding_usdcNonRefundableNote")}</p>
        </>
      )}
    </div>
  );
}
