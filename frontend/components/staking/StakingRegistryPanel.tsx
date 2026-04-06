"use client";

import { useEffect, useId, useMemo } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { registryAbi } from "@/lib/registryAbi";
import { getRegistryAddress } from "@/lib/registryEnv";

function formatExpiryUnix(sec: bigint): string {
  if (sec === BigInt(0)) return "";
  const ms = Number(sec) * 1000;
  if (!Number.isFinite(ms)) return sec.toString();
  try {
    return new Date(ms).toISOString();
  } catch {
    return sec.toString();
  }
}

/** Phase 3/4：Registry 链上资格只读（需 NEXT_PUBLIC_REGISTRY_ADDRESS + 正确网络 + 已连接钱包）。 */
export function StakingRegistryPanel() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const registryAddress = useMemo(() => getRegistryAddress(), []);
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const canRead = Boolean(registryAddress && address && isConnected && chainOk);
  const titleId = useId();

  const isApprovedRead = useReadContract({
    address: registryAddress ?? undefined,
    abi: registryAbi,
    functionName: "isApproved",
    args: address ? [address] : undefined,
    query: { enabled: canRead },
  });

  const guideApprovalRead = useReadContract({
    address: registryAddress ?? undefined,
    abi: registryAbi,
    functionName: "guideApproval",
    args: address ? [address] : undefined,
    query: { enabled: canRead },
  });

  const loading = isApprovedRead.isLoading || guideApprovalRead.isLoading;
  const err =
    (isApprovedRead.error as Error | undefined)?.message ??
    (guideApprovalRead.error as Error | undefined)?.message ??
    null;

  useEffect(() => {
    if (err && typeof window !== "undefined") {
      console.error("StakingRegistryPanel read error:", err);
    }
  }, [err]);

  if (!registryAddress) {
    return (
      <section
        className="mt-8 rounded-[var(--radius-md)] border border-dashed border-ink-300 bg-bg-console/80 p-5"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t("staking_registry_title")}
        </h2>
        <p className="mt-2 text-body text-ink-600 leading-relaxed">{t("staking_registry_notConfigured")}</p>
      </section>
    );
  }

  if (!isConnected || !address) {
    return (
      <section
        className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t("staking_registry_title")}
        </h2>
        <p className="mt-2 text-body text-ink-600 leading-relaxed">{t("staking_registry_connectWallet")}</p>
      </section>
    );
  }

  if (!chainOk) {
    return (
      <section
        className="mt-8 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 p-5"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t("staking_registry_title")}
        </h2>
        <p className="mt-2 text-body text-ink-700 leading-relaxed">
          {t("escrow_wrongChainDesc")
            .replace("{expectedChainId}", String(expectedChainId))
            .replace("{chainId}", String(chainId))}
        </p>
      </section>
    );
  }

  const effective = isApprovedRead.data;
  const raw = guideApprovalRead.data;

  return (
    <section
      className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
        {t("staking_registry_title")}
      </h2>
      <p className="mt-1 text-meta text-ink-500 font-mono break-all">{registryAddress}</p>

      {loading ? (
        <p className="mt-4 text-body text-ink-600">{t("staking_registry_loading")}</p>
      ) : err ? (
        <p className="mt-4 text-body text-danger" role="alert">
          {t("staking_registry_error")} {t("staking_readErrorRetryHint")}
        </p>
      ) : (
        <dl className="mt-4 space-y-3 text-body text-ink-800">
          <div>
            <dt className="text-small font-medium text-ink-600">{t("staking_registry_effectiveEligible")}</dt>
            <dd className="mt-0.5">
              {effective === true
                ? t("staking_registry_effectiveYes")
                : effective === false
                  ? t("staking_registry_effectiveNo")
                  : t("ui_em_dash")}
            </dd>
          </div>
          {raw != null ? (
            <>
              <div>
                <dt className="text-small font-medium text-ink-600">{t("staking_registry_rawRecord")}</dt>
                <dd className="mt-2 grid gap-2 sm:grid-cols-2">
                  <span>
                    <span className="text-meta text-ink-500">{t("staking_registry_approved")}: </span>
                    {raw[0] ? t("staking_registry_yes") : t("staking_registry_no")}
                  </span>
                  <span>
                    <span className="text-meta text-ink-500">{t("staking_registry_tier")}: </span>
                    {String(raw[1])}
                  </span>
                  <span className="sm:col-span-2">
                    <span className="text-meta text-ink-500">{t("staking_registry_expiry")}: </span>
                    {raw[2] === BigInt(0)
                      ? t("staking_registry_expiryNone")
                      : `${raw[2].toString()} (${formatExpiryUnix(raw[2])})`}
                  </span>
                </dd>
              </div>
            </>
          ) : null}
        </dl>
      )}
    </section>
  );
}
