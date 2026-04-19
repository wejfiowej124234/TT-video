"use client";

import { useEffect, useId, useMemo } from "react";
import { formatUnits, isAddress } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20DecimalsAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import { getGuideStakingAddress, getProviderStakingAddress } from "@/lib/stakingEnv";

function formatAmount(raw: bigint, decimals: number | undefined, t: (k: string) => string): string {
  if (decimals === undefined) return `${raw.toString()} (${t("staking_contract_rawUnits")})`;
  try {
    return formatUnits(raw, decimals);
  } catch {
    return raw.toString();
  }
}

export type StakingPoolKind = "guide" | "provider";

/** Phase 3/4：身份质押池链上只读（token、slasher、MIN_STAKE、stakeOf、slashedOf）。 */
export function StakingContractPanel({ pool }: { pool: StakingPoolKind }) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
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
  const userEnabled = Boolean(baseEnabled && address && isConnected);
  const titleId = useId();

  const tokenRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "token",
    query: { enabled: baseEnabled },
  });

  const tokenAddr = tokenRead.data;
  const tokenForDecimals =
    tokenAddr && isAddress(tokenAddr) ? (tokenAddr as `0x${string}`) : undefined;

  const decimalsRead = useReadContract({
    address: tokenForDecimals,
    abi: erc20DecimalsAbi,
    functionName: "decimals",
    query: { enabled: Boolean(baseEnabled && tokenForDecimals) },
  });

  const slasherRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "slasher",
    query: { enabled: baseEnabled },
  });

  const minStakeRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "MIN_STAKE",
    query: { enabled: baseEnabled },
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

  const globalLoading = tokenRead.isLoading || slasherRead.isLoading || minStakeRead.isLoading;
  const globalErr =
    (tokenRead.error as Error | undefined)?.message ??
    (slasherRead.error as Error | undefined)?.message ??
    (minStakeRead.error as Error | undefined)?.message ??
    null;
  const userLoading = userEnabled && (stakeOfRead.isLoading || slashedRead.isLoading);
  const userErr =
    (stakeOfRead.error as Error | undefined)?.message ??
    (slashedRead.error as Error | undefined)?.message ??
    null;

  useEffect(() => {
    if (globalErr && typeof window !== "undefined") {
      console.error("StakingContractPanel global read error:", globalErr);
    }
  }, [globalErr]);
  useEffect(() => {
    if (userErr && typeof window !== "undefined") {
      console.error("StakingContractPanel user read error:", userErr);
    }
  }, [userErr]);

  if (!stakingAddress) {
    return (
      <section
        className="mt-8 rounded-[var(--radius-md)] border border-dashed border-ink-300 bg-bg-console/80 p-5"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t(titleKey)}
        </h2>
        <p className="mt-2 text-body text-ink-600 leading-relaxed">{t(notConfiguredKey)}</p>
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

  return (
    <section
      className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
        {t(titleKey)}
      </h2>
      <p className="mt-1 text-meta text-ink-500 font-mono break-all">{stakingAddress}</p>

      {globalLoading ? (
        <p className="mt-4 text-body text-ink-600">{t("staking_contract_loading")}</p>
      ) : globalErr ? (
        <p className="mt-4 text-body text-danger" role="alert">
          {t("staking_contract_error")} {t("staking_readErrorRetryHint")}
        </p>
      ) : (
        <dl className="mt-4 space-y-3 text-body text-ink-800">
          <div>
            <dt className="text-small font-medium text-ink-600">{t("staking_contract_stakeToken")}</dt>
            <dd className="mt-0.5 font-mono text-small break-all">{tokenAddr ?? dash}</dd>
          </div>
          <div>
            <dt className="text-small font-medium text-ink-600">{t("staking_contract_minStake")}</dt>
            <dd className="mt-0.5">
              {minStakeRead.data !== undefined
                ? formatAmount(minStakeRead.data, decimals, t)
                : dash}
            </dd>
          </div>
          <div>
            <dt className="text-small font-medium text-ink-600">{t("staking_contract_slasher")}</dt>
            <dd className="mt-0.5 font-mono text-small break-all">{slasherRead.data ?? dash}</dd>
          </div>
        </dl>
      )}

      <div className="mt-6 border-t border-ink-200 pt-4">
        {!isConnected || !address ? (
          <p className="text-body text-ink-600">{t("staking_contract_connectForBalance")}</p>
        ) : userLoading ? (
          <p className="text-body text-ink-600">{t("staking_contract_loading")}</p>
        ) : userErr ? (
          <p className="text-body text-danger" role="alert">
            {t("staking_contract_error")} {t("staking_readErrorRetryHint")}
          </p>
        ) : (
          <dl className="space-y-3 text-body text-ink-800">
            <div>
              <dt className="text-small font-medium text-ink-600">{t("staking_contract_yourStake")}</dt>
              <dd className="mt-0.5">
                {stakeOfRead.data !== undefined
                  ? formatAmount(stakeOfRead.data, decimals, t)
                  : dash}
              </dd>
            </div>
            <div>
              <dt className="text-small font-medium text-ink-600">{t("staking_contract_yourSlashed")}</dt>
              <dd className="mt-0.5">
                {slashedRead.data !== undefined
                  ? formatAmount(slashedRead.data, decimals, t)
                  : dash}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}
