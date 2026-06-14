"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  GUIDE_IDENTITY_STAKE_TIER_USDC,
  computeGuideStakeDeltaToTierUsdc,
  formatGuideStakeDeltaUsdc,
  guideIdentityStakeTierI18nKey,
  parseGuideStakeUsdcNumber,
  resolveGuideIdentityStakeTierFromAmount,
  tierIdFromUsdc,
  type GuideIdentityStakeTierUsdc,
} from "@/lib/guide/guideIdentityStakeTiers";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export type StakingGuideTierSelectorProps = {
  currentStakeDisplay: string | null;
  selectedTier: GuideIdentityStakeTierUsdc | null;
  onSelectTier: (tier: GuideIdentityStakeTierUsdc, deltaUsdc: string) => void;
  /** 钱包 USDC 可读余额（用于「余额不足」标灰，非链上强制） */
  walletBalanceDisplay?: string | null;
  disabled?: boolean;
};

/** 平台定档选择（1000 / 5000 / 10000 USDC）— 替代自由输入与「填入钱包余额」 */
export function StakingGuideTierSelector({
  currentStakeDisplay,
  selectedTier,
  onSelectTier,
  walletBalanceDisplay = null,
  disabled = false,
}: StakingGuideTierSelectorProps) {
  const { t } = useTranslation();
  const currentTier = resolveGuideIdentityStakeTierFromAmount(currentStakeDisplay);

  return (
    <div data-tt-staking-guide-tier-selector="1">
      <p className={TT_STAKING_PAGE_L5.inputLabel}>{t("staking_guide_tier_select_label")}</p>
      <p className={`mt-1 ${TT_STAKING_PAGE_L5.metaProse}`}>{t("staking_guide_tier_select_hint")}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("staking_guide_tier_select_label")}>
        {GUIDE_IDENTITY_STAKE_TIER_USDC.map((tierUsdc) => {
          const tierId = tierIdFromUsdc(tierUsdc);
          const delta = computeGuideStakeDeltaToTierUsdc(currentStakeDisplay, tierUsdc);
          const isCurrent =
            currentTier === tierId &&
            parseGuideStakeUsdcNumber(currentStakeDisplay) === tierUsdc;
          const isSelected = selectedTier === tierUsdc;
          const satisfied = delta === 0;
          const walletN = parseGuideStakeUsdcNumber(walletBalanceDisplay);
          const walletInsufficient =
            walletN != null && delta > 0 && delta > walletN;

          return (
            <button
              key={tierUsdc}
              type="button"
              disabled={disabled || satisfied || walletInsufficient}
              aria-pressed={isSelected}
              data-tt-staking-guide-tier={tierUsdc}
              data-tt-staking-guide-tier-wallet-blocked={walletInsufficient ? "1" : undefined}
              className={`${TT_STAKING_PAGE_L5.chipBtn} min-w-[7.5rem] flex-col items-start gap-0.5 px-4 py-2.5 text-left ${
                isSelected ? "border-ref-sun/55 bg-ref-sun/20 text-[#fde9a8]" : ""
              } ${satisfied || walletInsufficient ? "opacity-60" : ""}`}
              onClick={() => onSelectTier(tierUsdc, formatGuideStakeDeltaUsdc(delta))}
            >
              <span className="font-semibold">{t(guideIdentityStakeTierI18nKey(tierId))}</span>
              <span className="text-meta font-normal opacity-90">
                {t("staking_guide_tier_usdc_line", { amount: String(tierUsdc) })}
              </span>
              {satisfied ? (
                <span className="text-meta text-ref-sun/70">{t("staking_guide_tier_current")}</span>
              ) : walletInsufficient && walletN != null ? (
                <span className="text-meta text-amber-200/85">
                  {t("staking_guide_tier_wallet_insufficient", {
                    need: formatGuideStakeDeltaUsdc(delta),
                    wallet: formatGuideStakeDeltaUsdc(walletN),
                  })}
                </span>
              ) : (
                <span className="text-meta text-slate-400">
                  {t("staking_guide_tier_delta_line", { delta: formatGuideStakeDeltaUsdc(delta) })}
                </span>
              )}
              {isCurrent && !satisfied ? (
                <span className="text-meta text-amber-200/80">{t("staking_guide_tier_partial")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
