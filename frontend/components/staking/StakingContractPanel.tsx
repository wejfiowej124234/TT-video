"use client";

import { useId, useMemo } from "react";
import { formatUnits, isAddress } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20DecimalsAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import {
  isViemNoContractDataError,
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { getGuideStakingAddress, getProviderStakingAddress } from "@/lib/stakingEnv";
import { GUIDE_IDENTITY_STAKE_SECTION_ID } from "@/lib/guide/guideIdentityStakingNav";

import { StakingApiStakeSummary } from "./StakingApiStakeSummary";
import { StakingContractAddressRow } from "./StakingContractAddressRow";
import { StakingL5Panel } from "./StakingL5Panel";
import { StakingNotDeployedCallout } from "./StakingNotDeployedCallout";
import { StakingPanelDisconnectedState } from "./StakingPanelDisconnectedState";
import { useStakingStakePrefill } from "./StakingStakePrefillContext";

function formatAmount(raw: bigint, decimals: number | undefined, t: (k: string) => string): string {
  if (decimals === undefined) return `${raw.toString()} (${t("staking_contract_rawUnits")})`;
  try {
    return formatUnits(raw, decimals);
  } catch {
    return raw.toString();
  }
}

export type StakingPoolKind = "guide" | "provider";

export type StakingPanelVariant = "warm" | "legacy";

/** Phase 3/4：身份质押池链上只读（token、slasher、MIN_STAKE、stakeOf、slashedOf）。 */
export function StakingContractPanel({
  pool,
  panelVariant = "legacy",
}: {
  pool: StakingPoolKind;
  panelVariant?: StakingPanelVariant;
}) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { requestPrefill } = useStakingStakePrefill();
  const stakingAddress = useMemo(
    () => (pool === "guide" ? getGuideStakingAddress() : getProviderStakingAddress()),
    [pool],
  );
  const titleKey = pool === "guide" ? "staking_pool_guide_panel_title" : "staking_pool_provider_panel_title";
  const notConfiguredKey =
    pool === "guide" ? "staking_pool_guide_notConfigured" : "staking_pool_provider_notConfigured";
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(stakingAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);
  const userEnabled = Boolean(readsEnabled && address && isConnected);
  const titleId = useId();
  const shell = panelVariant === "warm" ? TT_STAKING_PAGE_L5.panelCard : TT_STAKING_PAGE_L5.legacyPanel;

  const tokenRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "token",
    query: { enabled: readsEnabled },
  });

  const tokenAddr = tokenRead.data;
  const tokenForDecimals =
    tokenAddr && isAddress(tokenAddr) ? (tokenAddr as `0x${string}`) : undefined;

  const decimalsRead = useReadContract({
    address: tokenForDecimals,
    abi: erc20DecimalsAbi,
    functionName: "decimals",
    query: { enabled: Boolean(readsEnabled && tokenForDecimals) },
  });

  const slasherRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "slasher",
    query: { enabled: readsEnabled },
  });

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

  const slashedRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "slashedOf",
    args: address ? [address] : undefined,
    query: { enabled: userEnabled },
  });

  const decimals =
    decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const minStakeFormatted =
    minStakeRead.data !== undefined && decimals !== undefined
      ? formatAmount(minStakeRead.data, decimals, t)
      : null;

  const globalLoading =
    deploymentStatus === "loading" ||
    (readsEnabled && (tokenRead.isLoading || slasherRead.isLoading || minStakeRead.isLoading));
  const globalErrRaw =
    (tokenRead.error as Error | undefined)?.message ??
    (slasherRead.error as Error | undefined)?.message ??
    (minStakeRead.error as Error | undefined)?.message ??
    null;
  const globalErr =
    globalErrRaw && !isViemNoContractDataError(globalErrRaw) ? globalErrRaw : null;
  const userLoading = userEnabled && (stakeOfRead.isLoading || slashedRead.isLoading);
  const userErrRaw =
    (stakeOfRead.error as Error | undefined)?.message ??
    (slashedRead.error as Error | undefined)?.message ??
    null;
  const userErr = userErrRaw && !isViemNoContractDataError(userErrRaw) ? userErrRaw : null;

  const belowMinOnChain =
    pool === "guide" &&
    userEnabled &&
    minStakeRead.data !== undefined &&
    stakeOfRead.data !== undefined &&
    stakeOfRead.data < minStakeRead.data;

  const shortfallFormatted = useMemo(() => {
    if (!belowMinOnChain || minStakeRead.data === undefined || stakeOfRead.data === undefined) {
      return null;
    }
    const shortfall = minStakeRead.data - stakeOfRead.data;
    if (shortfall <= BigInt(0) || decimals === undefined) return null;
    return formatAmount(shortfall, decimals, t);
  }, [belowMinOnChain, minStakeRead.data, stakeOfRead.data, decimals, t]);

  const onTopUpToMin = () => {
    if (!shortfallFormatted) return;
    requestPrefill(shortfallFormatted);
    const el = document.getElementById(GUIDE_IDENTITY_STAKE_SECTION_ID);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!stakingAddress) {
    return (
      <section className={`${shell} border-dashed border-ink-300 bg-bg-console/80`} aria-labelledby={titleId}>
        <h2 id={titleId} className={TT_STAKING_PAGE_L5.panelTitle}>
          {t(titleKey)}
        </h2>
        <p className="mt-2 text-body text-ink-600 leading-relaxed">{t(notConfiguredKey)}</p>
      </section>
    );
  }

  if (!chainOk) {
    return (
      <section
        className={`${shell} border-warning/25 bg-warning/10`}
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={TT_STAKING_PAGE_L5.panelTitle}>
          {t(titleKey)}
        </h2>
        <p className="mt-2 text-body text-ink-700 leading-relaxed">
          {t("escrow_wrongChainDesc")
            .replace("{expectedChainId}", String(expectedChainId))
            .replace("{chainId}", String(chainId))}
        </p>
      </section>
    );
  }

  if (deploymentStatus === "missing") {
    return (
      <StakingL5Panel
        title={t(titleKey)}
        titleId={titleId}
        address={stakingAddress}
        variant={panelVariant}
      >
        <StakingNotDeployedCallout
          chainId={chainId}
          expectedChainId={expectedChainId}
          contractAddress={stakingAddress}
          variant={panelVariant}
        />
        {pool === "guide" ? <StakingApiStakeSummary enabled minStakeDisplay={null} /> : null}
      </StakingL5Panel>
    );
  }

  const body = (
    <>
      {globalLoading ? (
        <p className={TT_STAKING_PAGE_L5.metaProse}>{t("staking_contract_loading")}</p>
      ) : globalErr ? (
        <p className={TT_STAKING_PAGE_L5.calloutDanger} role="alert">
          {t("staking_contract_error")} {t("staking_readErrorRetryHint")}
        </p>
      ) : (
        <dl className={TT_STAKING_PAGE_L5.statGrid}>
          <StakingContractAddressRow label={t("staking_contract_stakeToken")} address={tokenAddr ?? null} />
          <div className={TT_STAKING_PAGE_L5.statRow}>
            <dt className={TT_STAKING_PAGE_L5.statLabel}>{t("staking_contract_minStake")}</dt>
            <dd className={TT_STAKING_PAGE_L5.statValue}>
              {minStakeRead.data !== undefined
                ? formatAmount(minStakeRead.data, decimals, t)
                : dash}
            </dd>
          </div>
          <StakingContractAddressRow label={t("staking_contract_slasher")} address={slasherRead.data ?? null} />
        </dl>
      )}
      {pool === "guide" && !isConnected ? (
        <StakingApiStakeSummary enabled minStakeDisplay={minStakeFormatted} />
      ) : null}
    </>
  );

  const userFooter = (
    <>
      {!isConnected || !address ? (
        <StakingPanelDisconnectedState />
      ) : userLoading ? (
        <p className={TT_STAKING_PAGE_L5.metaProse}>{t("staking_contract_loading")}</p>
      ) : userErr ? (
        <p className={TT_STAKING_PAGE_L5.calloutDanger} role="alert">
          {t("staking_contract_error")} {t("staking_readErrorRetryHint")}
        </p>
      ) : (
        <>
          <dl className={TT_STAKING_PAGE_L5.statGrid}>
            <div className={TT_STAKING_PAGE_L5.statRow}>
              <dt className={TT_STAKING_PAGE_L5.statLabel}>{t("staking_contract_yourStake")}</dt>
              <dd className={TT_STAKING_PAGE_L5.statValue}>
                {stakeOfRead.data !== undefined
                  ? formatAmount(stakeOfRead.data, decimals, t)
                  : dash}
              </dd>
            </div>
            <div className={TT_STAKING_PAGE_L5.statRow}>
              <dt className={TT_STAKING_PAGE_L5.statLabel}>{t("staking_contract_yourSlashed")}</dt>
              <dd className={TT_STAKING_PAGE_L5.statValue}>
                {slashedRead.data !== undefined
                  ? formatAmount(slashedRead.data, decimals, t)
                  : dash}
              </dd>
            </div>
          </dl>
          {belowMinOnChain && shortfallFormatted ? (
            <div className={`mt-4 ${TT_STAKING_PAGE_L5.calloutWarn}`} role="alert">
              <p className="text-body text-amber-100">
                {t("staking_contract_belowMin_onchain", {
                  current:
                    stakeOfRead.data !== undefined && decimals !== undefined
                      ? formatAmount(stakeOfRead.data, decimals, t)
                      : dash,
                  min: minStakeFormatted ?? dash,
                  shortfall: shortfallFormatted,
                })}
              </p>
              <button
                type="button"
                onClick={onTopUpToMin}
                className={`mt-3 ${TT_STAKING_PAGE_L5.trustSubmitBtn}`}
                data-tt-staking-top-up-to-min="1"
              >
                {t("staking_contract_topUpToMin")}
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <StakingL5Panel
      title={t(titleKey)}
      titleId={titleId}
      address={stakingAddress}
      variant={panelVariant}
      footer={userFooter}
    >
      {body}
    </StakingL5Panel>
  );
}
