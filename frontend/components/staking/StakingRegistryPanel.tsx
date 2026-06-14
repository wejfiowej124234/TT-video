"use client";

import { useId, useMemo } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { registryAbi } from "@/lib/registryAbi";
import { getRegistryAddress } from "@/lib/registryEnv";
import {
  isViemNoContractDataError,
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

import type { StakingPanelVariant } from "./StakingContractPanel";
import { StakingL5Panel } from "./StakingL5Panel";
import { StakingPanelDisconnectedState } from "./StakingPanelDisconnectedState";
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
export function StakingRegistryPanel({ panelVariant = "legacy" }: { panelVariant?: StakingPanelVariant }) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const registryAddress = useMemo(() => getRegistryAddress(), []);
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(registryAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(registryAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);
  const canRead = Boolean(readsEnabled && address && isConnected);
  const titleId = useId();
  const shell = panelVariant === "warm" ? TT_STAKING_PAGE_L5.panelCard : TT_STAKING_PAGE_L5.legacyPanel;
  const warm = panelVariant === "warm";

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

  const loading =
    deploymentStatus === "loading" ||
    (canRead && (isApprovedRead.isLoading || guideApprovalRead.isLoading));
  const errRaw =
    (isApprovedRead.error as Error | undefined)?.message ??
    (guideApprovalRead.error as Error | undefined)?.message ??
    null;
  const err = errRaw && !isViemNoContractDataError(errRaw) ? errRaw : null;

  if (!registryAddress) {
    if (warm) {
      return (
        <p className={TT_STAKING_PAGE_L5.metaProse} role="status" data-tt-staking-registry-not-configured="1">
          {t("staking_registry_notConfigured")}
        </p>
      );
    }
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

  if (deploymentStatus === "missing" && registryAddress) {
    return (
      <p className={TT_STAKING_PAGE_L5.metaProse} role="status" data-tt-staking-registry-unavailable="1">
        {t("staking_registry_unavailableCompact")}
      </p>
    );
  }

  if (!isConnected || !address) {
    if (warm) {
      return (
        <div data-tt-staking-registry-connect-hint="1">
          <StakingPanelDisconnectedState />
        </div>
      );
    }
    return (
      <section className={shell} aria-labelledby={titleId}>
        <h2 id={titleId} className={TT_STAKING_PAGE_L5.panelTitle}>
          {t("staking_registry_title")}
        </h2>
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.metaProse}`}>{t("staking_registry_connectWallet")}</p>
      </section>
    );
  }

  if (!chainOk) {
    const wrongChain = t("escrow_wrongChainDesc")
      .replace("{expectedChainId}", String(expectedChainId))
      .replace("{chainId}", String(chainId));
    if (warm) {
      return (
        <p className={TT_STAKING_PAGE_L5.calloutWarn} role="status" data-tt-staking-registry-wrong-chain="1">
          {wrongChain}
        </p>
      );
    }
    return (
      <section
        className="mt-8 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 p-5"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t("staking_registry_title")}
        </h2>
        <p className="mt-2 text-body text-ink-700 leading-relaxed">{wrongChain}</p>
      </section>
    );
  }

  const effective = isApprovedRead.data;
  const raw = guideApprovalRead.data;

  return (
    <StakingL5Panel
      title={t("staking_registry_title")}
      titleId={titleId}
      address={registryAddress ?? undefined}
      variant={panelVariant}
    >
      {loading ? (
        <p className={TT_STAKING_PAGE_L5.metaProse}>{t("staking_registry_loading")}</p>
      ) : err ? (
        <p className={TT_STAKING_PAGE_L5.calloutDanger} role="alert">
          {t("staking_registry_error")} {t("staking_readErrorRetryHint")}
        </p>
      ) : (
        <dl className={`space-y-3 ${TT_STAKING_PAGE_L5.bodyProse}`}>
          <div>
            <dt className={TT_STAKING_PAGE_L5.statLabel}>{t("staking_registry_effectiveEligible")}</dt>
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
                <dt className={TT_STAKING_PAGE_L5.statLabel}>{t("staking_registry_rawRecord")}</dt>
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
    </StakingL5Panel>
  );
}
