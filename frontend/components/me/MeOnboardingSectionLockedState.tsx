"use client";

import { MeOnboardingStatusPill } from "@/components/me/MeOnboardingSummaryPrimitives";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

type T = (key: string) => string;

/** 次级区块 L5 锁定态：徽章 + 短标题（主登录 CTA 仅在「当前建议操作」） */
export function MeOnboardingSectionLockedState({
  t,
  titleKey,
  className = "",
}: {
  t: T;
  titleKey: string;
  className?: string;
}) {
  return (
    <div
      className={`${TT_ME_ONBOARDING_L5.gateLockedShell} ${className}`.trim()}
      data-tt-me-onboarding-section-locked="1"
      aria-label={t(titleKey)}
    >
      <MeOnboardingStatusPill status={t("me_onboarding_sectionLockedBadge")} variant="neutral" />
      <p className="mt-3 text-small font-semibold text-ink-900">{t(titleKey)}</p>
      <p className="sr-only">{t("me_onboarding_sectionLockedSrHint")}</p>
    </div>
  );
}
