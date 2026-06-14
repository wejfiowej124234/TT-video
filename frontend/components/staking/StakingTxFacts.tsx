"use client";

import type { ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { getTargetChain } from "@/lib/chainEnv";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export type StakingTxFactsProps = {
  expectedChainId: number;
  stakingAddress: string;
  tokenAddress: string;
  /** 人类可读数量串（已按代币精度格式化） */
  amountDisplay: string;
  action: "approve" | "stake" | "withdraw";
  variant?: "warm" | "legacy";
  /** approve → stake 两步流：当前步序（从 1 起） */
  step?: number;
  stepTotal?: number;
  tokenSymbol?: string;
  children?: ReactNode;
};

function shortHexAddress(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length < 12) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

/** 05 §九 9.0.5 · L5 预签确认卡（approve / stake / withdraw） */
export function StakingTxFacts({
  expectedChainId,
  stakingAddress,
  tokenAddress,
  amountDisplay,
  action,
  variant = "warm",
  step,
  stepTotal,
  tokenSymbol = "USDC",
  children,
}: StakingTxFactsProps) {
  const { t } = useTranslation();
  const chainName = getTargetChain().name;
  const isLocalDev = expectedChainId === 31337 || expectedChainId === 1337;

  const titleKey =
    action === "approve"
      ? "staking_tx_confirm_title_approve"
      : action === "withdraw"
        ? "staking_tx_confirm_title_withdraw"
        : "staking_tx_confirm_title_stake";

  const subtitleKey =
    action === "approve"
      ? "staking_tx_confirm_subtitle_approve"
      : action === "withdraw"
        ? "staking_tx_confirm_subtitle_withdraw"
        : "staking_tx_confirm_subtitle_stake";

  const walletHintKey =
    action === "approve"
      ? "staking_tx_confirm_wallet_hint_approve"
      : action === "withdraw"
        ? "staking_tx_confirm_wallet_hint_withdraw"
        : "staking_tx_confirm_wallet_hint_stake";

  const legacyActionLabel =
    action === "approve"
      ? t("staking_stake_factActionApprove")
      : action === "withdraw"
        ? t("staking_stake_factActionWithdraw")
        : t("staking_stake_factActionStake");

  if (variant === "legacy") {
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
            <dd className="font-sans text-small text-ink-800">{legacyActionLabel}</dd>
          </div>
        </dl>
        {children ? <div className="pt-2">{children}</div> : null}
      </div>
    );
  }

  return (
    <section
      className={TT_STAKING_PAGE_L5.txConfirmCard}
      role="region"
      aria-label={t("staking_tx_confirm_region_aria")}
      data-tt-staking-tx-confirm="1"
      data-tt-staking-tx-action={action}
    >
      <header className={TT_STAKING_PAGE_L5.txConfirmHeader}>
        {step != null && stepTotal != null && stepTotal > 1 ? (
          <span className={TT_STAKING_PAGE_L5.txConfirmStepBadge}>
            {t("staking_tx_confirm_step", { step: String(step), total: String(stepTotal) })}
          </span>
        ) : null}
        <h4 className={TT_STAKING_PAGE_L5.txConfirmTitle}>{t(titleKey)}</h4>
        <p className={TT_STAKING_PAGE_L5.txConfirmSubtitle}>
          {t(subtitleKey, { amount: amountDisplay, symbol: tokenSymbol })}
        </p>
      </header>

      <div className={TT_STAKING_PAGE_L5.txConfirmBody}>
        <div className={TT_STAKING_PAGE_L5.txConfirmAmountBlock}>
          <p className="text-meta font-medium text-ref-sun/70">{t("staking_tx_confirm_amount_label")}</p>
          <p className="mt-2">
            <span className={TT_STAKING_PAGE_L5.txConfirmAmountValue}>{amountDisplay}</span>
            <span className={TT_STAKING_PAGE_L5.txConfirmAmountUnit}>{tokenSymbol}</span>
          </p>
        </div>

        <div className={TT_STAKING_PAGE_L5.txConfirmWalletHint} role="note">
          <p className={TT_STAKING_PAGE_L5.txConfirmWalletHintTitle}>
            {t("staking_tx_confirm_wallet_hint_title")}
          </p>
          <p className="mt-2">
            {t(walletHintKey, {
              amount: amountDisplay,
              symbol: tokenSymbol,
              spender: shortHexAddress(stakingAddress),
            })}
          </p>
          {isLocalDev ? (
            <p className="mt-2 text-slate-400/90">
              {t("staking_tx_confirm_wallet_hint_local_dev", {
                amount: amountDisplay,
                symbol: tokenSymbol,
              })}
            </p>
          ) : null}
        </div>

        <details className={TT_STAKING_PAGE_L5.txConfirmTechDetails}>
          <summary className={TT_STAKING_PAGE_L5.txConfirmTechSummary}>
            {t("staking_tx_confirm_technical_summary")}
          </summary>
          <dl className={TT_STAKING_PAGE_L5.txConfirmTechGrid}>
            <div className={TT_STAKING_PAGE_L5.txConfirmTechRow}>
              <dt className={TT_STAKING_PAGE_L5.txConfirmTechLabel}>{t("staking_stake_factChain")}</dt>
              <dd className={TT_STAKING_PAGE_L5.txConfirmTechValue}>
                {chainName} ({expectedChainId})
              </dd>
            </div>
            <div className={TT_STAKING_PAGE_L5.txConfirmTechRow}>
              <dt className={TT_STAKING_PAGE_L5.txConfirmTechLabel}>{t("staking_stake_factStaking")}</dt>
              <dd className={TT_STAKING_PAGE_L5.txConfirmTechValue}>{stakingAddress}</dd>
            </div>
            <div className={TT_STAKING_PAGE_L5.txConfirmTechRow}>
              <dt className={TT_STAKING_PAGE_L5.txConfirmTechLabel}>{t("staking_stake_factToken")}</dt>
              <dd className={TT_STAKING_PAGE_L5.txConfirmTechValue}>{tokenAddress}</dd>
            </div>
            <div className={TT_STAKING_PAGE_L5.txConfirmTechRow}>
              <dt className={TT_STAKING_PAGE_L5.txConfirmTechLabel}>{t("staking_stake_factAction")}</dt>
              <dd className={`${TT_STAKING_PAGE_L5.txConfirmTechValue} font-sans`}>{legacyActionLabel}</dd>
            </div>
          </dl>
        </details>
      </div>

      {children ? <div className={TT_STAKING_PAGE_L5.txConfirmCtaWrap}>{children}</div> : null}
    </section>
  );
}
