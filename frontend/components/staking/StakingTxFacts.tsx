"use client";

import { useTranslation } from "@/components/LocaleProvider";

export type StakingTxFactsProps = {
  expectedChainId: number;
  stakingAddress: string;
  tokenAddress: string;
  /** 人类可读数量串（已按代币精度格式化） */
  amountDisplay: string;
  action: "approve" | "stake" | "withdraw";
};

/** 05 §九 9.0.5：链上 approve/stake/withdraw 前展示链、合约、代币与数额 */
export function StakingTxFacts({
  expectedChainId,
  stakingAddress,
  tokenAddress,
  amountDisplay,
  action,
}: StakingTxFactsProps) {
  const { t } = useTranslation();
  const actionLabel =
    action === "approve"
      ? t("staking_stake_factActionApprove")
      : action === "withdraw"
        ? t("staking_stake_factActionWithdraw")
        : t("staking_stake_factActionStake");

  return (
    <div
      className="rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/50 p-3 space-y-2"
      role="region"
      aria-label={t("staking_stake_factsTitle")}
    >
      <p className="text-small font-semibold text-ink-800">{t("staking_stake_factsTitle")}</p>
      <p className="text-meta text-ink-600">{t("staking_stake_factsNote")}</p>
      <dl className="text-meta font-mono text-ink-700 space-y-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className="text-ink-500">{t("staking_stake_factChain")}</dt>
          <dd>{expectedChainId}</dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className="text-ink-500">{t("staking_stake_factStaking")}</dt>
          <dd className="break-all">{stakingAddress}</dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className="text-ink-500">{t("staking_stake_factToken")}</dt>
          <dd className="break-all">{tokenAddress}</dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className="text-ink-500">{t("staking_stake_factAmount")}</dt>
          <dd className="break-all font-sans text-small text-ink-800">{amountDisplay}</dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className="text-ink-500">{t("staking_stake_factAction")}</dt>
          <dd className="font-sans text-small text-ink-800">{actionLabel}</dd>
        </div>
      </dl>
    </div>
  );
}
