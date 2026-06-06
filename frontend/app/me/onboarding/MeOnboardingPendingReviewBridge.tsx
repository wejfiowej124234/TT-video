"use client";

import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

/** 从主理人「申请审核中」跳入时，说明审核与准入费可并行（Console L5 弱提示条） */
export function MeOnboardingPendingReviewBridge({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <div
      className={`${TT_ME_ONBOARDING_L5.journeyBridge} ${className}`.trim()}
      role="note"
      data-tt-me-onboarding-pending-review-bridge="1"
    >
      <p className="font-semibold text-ink-900">{t("me_onboarding_pendingReviewBridgeTitle")}</p>
      <p className="mt-1 text-meta leading-relaxed text-ink-700">{t("me_onboarding_pendingReviewBridgeBody")}</p>
    </div>
  );
}
