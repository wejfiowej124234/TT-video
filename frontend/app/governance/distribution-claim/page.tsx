"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits, getAddress, isAddress, zeroAddress } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSimulateContract,
} from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import WalletStatusMini from "@/components/trust/WalletStatusMini";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import claimAbi from "@/dapp/abis/InvestorDistributionClaim.json";
import { useInvestorDistributionClaimWrite } from "@/dapp/hooks/useInvestorDistributionClaimWrite";
import { getExpectedChainId } from "@/lib/chainEnv";
import { parseDistributionIdForClaim } from "@/lib/distributionClaimBytes32";
import { getInvestorDistributionClaimAddress } from "@/lib/investorDistributionClaimEnv";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { erc20TokenAbi } from "@/lib/stakingAbi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const READ_ABI = claimAbi as readonly unknown[];

/** Wagmi read `data` for uint256 is bigint at runtime; narrow for TS without mutating values. */
function asReadonlyBigint(v: unknown): bigint | undefined {
  return typeof v === "bigint" ? v : undefined;
}

const CLAIM_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /NothingToClaim/i, messageKey: "governance_claim_err_nothing" },
    { re: /UnknownDistribution/i, messageKey: "governance_claim_err_unknown" },
    { re: /TransferFailed/i, messageKey: "governance_claim_err_transfer" },
    { re: /TokenMismatch/i, messageKey: "governance_claim_err_token_mismatch" },
    { re: /OnlyOwner/i, messageKey: "governance_claim_err_only_owner" },
  ],
  rejectKey: "wallet_txErrorUserRejected",
  genericKey: "governance_claim_err_generic",
} as const;

function simulateErrToMessage(raw: string, t: (k: string) => string): string {
  const opts = { ...CLAIM_WRITE_ERROR_OPTS, rejectKey: "wallet_txErrorUserRejected" as const };
  return mapWalletWriteError(new Error(raw), t, opts) ?? t("governance_claim_err_generic");
}

export default function GovernanceDistributionClaimPage() {
  const { t } = useTranslation();
  const titleId = useId();
  const distInputId = useId();
  const maxInputId = useId();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;

  const claimAddress = useMemo(() => getInvestorDistributionClaimAddress(), []);

  const [distInput, setDistInput] = useState("");
  const [maxStr, setMaxStr] = useState("");

  const parsedBytes32 = useMemo(() => parseDistributionIdForClaim(distInput), [distInput]);

  const readsEnabled = Boolean(claimAddress && parsedBytes32 && chainOk);

  const tokenRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "distributionToken",
    args: parsedBytes32 ? [parsedBytes32] : undefined,
    query: { enabled: readsEnabled },
  });

  const tz = tokenRead.data as `0x${string}` | undefined;
  const token =
    tz && isAddress(tz) && getAddress(tz) !== getAddress(zeroAddress) ? (getAddress(tz) as `0x${string}`) : undefined;
  const unknownDistribution = Boolean(
    readsEnabled && tokenRead.isSuccess && tz && isAddress(tz) && getAddress(tz) === getAddress(zeroAddress)
  );

  const decimalsRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "decimals",
    query: { enabled: Boolean(token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const claimableRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "claimable",
    args: parsedBytes32 && address ? [parsedBytes32, address] : undefined,
    query: { enabled: Boolean(readsEnabled && address && parsedBytes32) },
  });

  const entitledRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "entitled",
    args: parsedBytes32 && address ? [parsedBytes32, address] : undefined,
    query: { enabled: Boolean(readsEnabled && address && parsedBytes32) },
  });

  const claimedRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "claimed",
    args: parsedBytes32 && address ? [parsedBytes32, address] : undefined,
    query: { enabled: Boolean(readsEnabled && address && parsedBytes32) },
  });

  const claimable = asReadonlyBigint(claimableRead.data);
  const entitled = entitledRead.data;
  const claimed = claimedRead.data;

  const parsedMax = useMemo(() => {
    const s = maxStr.trim();
    if (!s) return undefined;
    try {
      return BigInt(s);
    } catch {
      return undefined;
    }
  }, [maxStr]);

  const effectiveMax = useMemo(() => {
    if (parsedMax !== undefined && parsedMax > 0n) return parsedMax;
    if (claimable !== undefined && claimable > 0n) return claimable;
    return undefined;
  }, [parsedMax, claimable]);

  const simEnabled = Boolean(
    isConnected &&
      chainOk &&
      claimAddress &&
      parsedBytes32 &&
      token &&
      address &&
      effectiveMax !== undefined &&
      effectiveMax > 0n
  );

  const {
    data: simData,
    error: simError,
    isFetching: simFetching,
    refetch: refetchSim,
  } = useSimulateContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "claim",
    args: parsedBytes32 && effectiveMax ? [parsedBytes32, effectiveMax] : undefined,
    query: { enabled: simEnabled },
  });

  const {
    claim,
    withdrawDividend,
    isPending: writePending,
    isSuccess: writeSuccess,
    error: writeErr,
    hash,
    reset: resetWrite,
  } = useInvestorDistributionClaimWrite(claimAddress, parsedBytes32 ?? undefined, effectiveMax);

  useEffect(() => {
    if (writeSuccess) {
      void claimableRead.refetch?.();
      void claimedRead.refetch?.();
      void entitledRead.refetch?.();
      void refetchSim?.();
      setMaxStr("");
    }
  }, [writeSuccess, claimableRead, claimedRead, entitledRead, refetchSim]);

  useEffect(() => {
    resetWrite();
  }, [distInput]);

  const writeMsg = mapWalletWriteError(writeErr ?? undefined, t, CLAIM_WRITE_ERROR_OPTS);
  const simMsg =
    simError && "message" in simError && typeof simError.message === "string"
      ? simulateErrToMessage(simError.message, t)
      : simError
        ? simulateErrToMessage(String(simError), t)
        : null;

  const claimableFormatted =
    claimable !== undefined && decimals !== undefined && decimals <= 36
      ? formatUnits(claimable, decimals)
      : null;

  const yieldGrowPayload = useMemo(
    () => ({ claimable_gt_zero: claimable !== undefined && claimable > 0n }),
    [claimable]
  );

  const distInvalid = distInput.trim() !== "" && !parsedBytes32;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-ink-800">
      <GovernanceTargetNotice className="mb-6" />
      <h1 id={titleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_claim_title")}
      </h1>
      <p className="mt-2 text-body text-ink-700">{t("governance_claim_desc")}</p>
      <p className="mt-2 text-meta text-ink-500">{t("governance_claim_env_hint")}</p>

      <div className="mt-4">
        <TrustGrowthMomentBanner moment="first_yield" surface="ink" analyticsPayload={yieldGrowPayload} />
      </div>

      <div className="mt-4">
        <InlineTransparencyVerification context="yield" surface="ink" />
      </div>

      {!claimAddress ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-body text-amber-900">
          {t("governance_claim_contract_unconfigured")}
        </p>
      ) : null}

      <div className="mt-6 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 px-3 py-3">
        <p className="text-meta font-medium text-ink-700">{t("governance_claim_wallet_section")}</p>
        <div className="mt-2">
          <WalletStatusMini />
        </div>
        {isConnected && !chainOk ? (
          <p className="mt-2 text-body text-red-700">{t("governance_claim_wrong_chain")}</p>
        ) : null}
      </div>

      <div className="mt-6 space-y-2">
        <label htmlFor={distInputId} className="block text-meta font-medium text-ink-700">
          {t("governance_claim_dist_label")}
        </label>
        <input
          id={distInputId}
          type="text"
          value={distInput}
          onChange={(e) => setDistInput(e.target.value)}
          placeholder={t("governance_claim_dist_placeholder")}
          className="w-full rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900"
          autoComplete="off"
        />
        {distInvalid ? <p className="text-small text-red-700">{t("governance_claim_dist_invalid")}</p> : null}
        {parsedBytes32 ? (
          <p className="break-all font-mono text-meta text-ink-600">
            {t("governance_claim_resolved_bytes32")}: {parsedBytes32}
          </p>
        ) : null}
      </div>

      {readsEnabled && parsedBytes32 ? (
        <dl className="mt-6 space-y-2 text-small">
          <div>
            <dt className="text-meta text-ink-500">{t("governance_claim_token")}</dt>
            <dd className="break-all font-mono">
              {tokenRead.isLoading ? t("common_loading") : token ? token : t("governance_claim_token_unknown")}
            </dd>
          </div>
          {address ? (
            <>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_claim_entitled_label")}</dt>
                <dd className="font-mono">
                  {entitledRead.isLoading ? t("common_loading") : entitled?.toString() ?? t("ui_em_dash")}
                </dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_claim_claimed_label")}</dt>
                <dd className="font-mono">
                  {claimedRead.isLoading ? t("common_loading") : claimed?.toString() ?? t("ui_em_dash")}
                </dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("governance_claim_claimable")}</dt>
                <dd className="font-mono">
                  {claimableRead.isLoading ? (
                    t("common_loading")
                  ) : claimable !== undefined ? (
                    <>
                      {claimable.toString()}
                      {claimableFormatted ? (
                        <span className="ml-2 text-meta text-ink-500">
                          ({claimableFormatted} {t("governance_claim_token_units_hint")})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    t("ui_em_dash")
                  )}
                </dd>
              </div>
            </>
          ) : (
            <p className="text-body text-ink-600">{t("governance_claim_connect_for_reads")}</p>
          )}
        </dl>
      ) : null}

      <section className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-3">
        <h2 className="text-h4 font-medium text-ink-900">{t("governance_claim_expected_fail_section")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-ink-700">
          <li>
            {unknownDistribution
              ? t("governance_claim_expected_fail_unknown_active")
              : t("governance_claim_expected_fail_unknown")}
          </li>
          <li>
            {claimable !== undefined && claimable === 0n && token
              ? t("governance_claim_expected_fail_nothing_active")
              : t("governance_claim_expected_fail_nothing")}
          </li>
        </ul>
      </section>

      <div className="mt-6 space-y-2">
        <label htmlFor={maxInputId} className="block text-meta font-medium text-ink-700">
          {t("governance_claim_max_label")}
        </label>
        <input
          id={maxInputId}
          type="text"
          inputMode="numeric"
          value={maxStr}
          onChange={(e) => setMaxStr(e.target.value)}
          placeholder={t("governance_claim_max_placeholder")}
          className="w-full rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small"
        />
        <p className="text-meta text-ink-500">{t("governance_claim_max_hint")}</p>
      </div>

      <section className="mt-6">
        <h2 className="text-h4 font-medium text-ink-900">{t("governance_claim_precheck_section")}</h2>
        {simFetching ? <p className="mt-2 text-meta text-ink-500">{t("common_loading")}</p> : null}
        {!simEnabled && isConnected && chainOk && claimAddress && parsedBytes32 && token && address ? (
          <p className="mt-2 text-body text-ink-600">{t("governance_claim_precheck_need_amount")}</p>
        ) : null}
        {simEnabled && !simFetching && !simError && simData?.request ? (
          <p className="mt-2 text-body text-green-800">{t("governance_claim_precheck_ok")}</p>
        ) : null}
        {simMsg ? <p className="mt-2 text-body text-red-700">{simMsg}</p> : null}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            !isConnected ||
            !chainOk ||
            !claimAddress ||
            !parsedBytes32 ||
            !token ||
            effectiveMax === undefined ||
            writePending
          }
          onClick={() => claim()}
          className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingOffset2Classes}`}
        >
          {writePending ? t("governance_claim_tx_pending") : t("governance_claim_btn_claim")}
        </button>
        <button
          type="button"
          disabled={
            !isConnected ||
            !chainOk ||
            !claimAddress ||
            !parsedBytes32 ||
            !token ||
            effectiveMax === undefined ||
            writePending
          }
          onClick={() => withdrawDividend()}
          className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-travel-500 bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_claim_btn_withdraw")}
        </button>
      </div>

      {writeMsg ? <p className="mt-3 text-body text-red-700">{writeMsg}</p> : null}
      {writeSuccess && hash ? (
        <p className="mt-2 text-body text-green-800">
          {t("governance_claim_tx_success")}
          <span className="mt-1 block break-all font-mono text-meta">
            {t("governance_claim_tx_hash")}: {hash}
          </span>
        </p>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link href="/governance" className={`text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
          {t("governance_title")}
        </Link>
        <GovernanceOpsAdminLinks />
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
