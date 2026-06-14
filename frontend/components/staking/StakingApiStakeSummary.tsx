"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import {
  GUIDE_IDENTITY_MIN_STAKE_REFERENCE,
  resolveGuideIdentityStakingTier,
} from "@/lib/guide/guideIdentityStakingNav";
import { useGuideApiStakeAmount } from "@/lib/staking/useGuideApiStakeAmount";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { FOCUS_RING } from "@/components/me/constants";

/** API 记录的向导质押金额（① 本地 · 链不可读或钱包未连时诚实展示；非链上真值） */
export function StakingApiStakeSummary({
  enabled,
  minStakeDisplay,
}: {
  enabled: boolean;
  /** 链上 `MIN_STAKE` 格式化值；缺省用 81 参考锚 */
  minStakeDisplay?: string | null;
}) {
  const { t } = useTranslation();
  const { amount, loading, error } = useGuideApiStakeAmount(enabled);
  const dash = t("ui_em_dash");
  const display = amount != null && amount.trim() !== "" ? amount.trim() : dash;
  const minRef =
    minStakeDisplay != null && minStakeDisplay.trim() !== ""
      ? minStakeDisplay.trim()
      : GUIDE_IDENTITY_MIN_STAKE_REFERENCE;
  const tier = resolveGuideIdentityStakingTier(amount, minRef);
  const shortfall =
    tier === "below_min" && amount != null
      ? Math.max(0, Number.parseFloat(minRef) - Number.parseFloat(amount)).toString()
      : null;

  if (!enabled) return null;

  return (
    <div
      className={TT_STAKING_PAGE_L5.amountHero}
      role="status"
      data-tt-staking-api-stake-summary="1"
    >
      <p className={TT_STAKING_PAGE_L5.amountHeroLabel}>{t("staking_api_stake_label")}</p>
      {loading ? (
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.amountHeroValue}`}>…</p>
      ) : error ? (
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.metaProse}`}>{t("staking_api_stake_error")}</p>
      ) : (
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.amountHeroValue}`}>
          {display}
          <span className="ml-2 text-meta font-normal text-slate-400">USDC</span>
        </p>
      )}
      <p className={TT_STAKING_PAGE_L5.amountHeroHint}>{t("staking_api_stake_hint_connected")}</p>
      {tier === "below_min" && shortfall != null ? (
        <p className={`mt-3 ${TT_STAKING_PAGE_L5.calloutWarn}`} role="alert">
          {t("staking_api_stake_below_min", { amount: display, min: minRef, shortfall })}
        </p>
      ) : null}
      {tier === "satisfied" ? (
        <p className="mt-3">
          <Link
            href="/guide"
            className={`${TT_STAKING_PAGE_L5.navLink} ${FOCUS_RING}`}
            data-tt-staking-back-guide-workbench="1"
          >
            {t("staking_api_stake_backWorkbench")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
