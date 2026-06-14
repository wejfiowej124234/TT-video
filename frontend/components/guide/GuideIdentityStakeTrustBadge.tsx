"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  guideIdentityStakeTierI18nKey,
  resolveGuideIdentityStakeTierFromAmount,
  shouldShowGuideIdentityStakeTrust,
} from "@/lib/guide/guideIdentityStakeTiers";

export type GuideIdentityStakeTrustBadgeProps = {
  stakeAmount: string | null | undefined;
  /** 列表卡紧凑 · 详情页标准 */
  size?: "sm" | "md";
  className?: string;
};

/** 游客可见：向导身份押金档位 + 锁定 USDC（提升信任 · ① API/链 best-effort） */
export function GuideIdentityStakeTrustBadge({
  stakeAmount,
  size = "md",
  className = "",
}: GuideIdentityStakeTrustBadgeProps) {
  const { t } = useTranslation();
  if (!shouldShowGuideIdentityStakeTrust(stakeAmount)) return null;

  const tierId = resolveGuideIdentityStakeTierFromAmount(stakeAmount);
  const amount =
    stakeAmount != null && String(stakeAmount).trim() !== "" ? String(stakeAmount).trim() : "0";
  const tierLabel = tierId ? t(guideIdentityStakeTierI18nKey(tierId)) : "";

  const shell =
    size === "sm"
      ? "inline-flex items-center gap-1.5 rounded-md border border-ref-sun/28 bg-ref-sun/[0.08] px-2 py-0.5 text-meta text-ref-sun/90"
      : "inline-flex items-center gap-2 rounded-lg border border-ref-sun/32 bg-ref-sun/[0.1] px-3 py-1.5 text-small text-ref-sun/95";

  return (
    <span
      className={`${shell} ${className}`.trim()}
      title={t("guide_identity_stake_trust_title")}
      data-tt-guide-identity-stake-trust="1"
      data-tt-guide-identity-stake-tier={tierId ?? "unknown"}
    >
      <span aria-hidden className="text-ref-sun/80">
        ◆
      </span>
      <span>
        {t("guide_identity_stake_trust_badge", { tier: tierLabel, amount })}
      </span>
    </span>
  );
}
