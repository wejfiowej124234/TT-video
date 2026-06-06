"use client";

import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

type T = (key: string) => string;

/** 页顶会话条：仅会话探测（钱包≠账号 已并入「当前建议操作」一体卡，避免双横条堆叠） */
export function MeOnboardingSessionContextBanner({
  t,
  sessionChecking,
  loggedIn,
}: {
  t: T;
  sessionChecking: boolean;
  sessionChecked: boolean;
  loggedIn: boolean;
}) {
  if (loggedIn || !sessionChecking) return null;

  return (
    <div
      className={`mt-4 ${TT_ME_ONBOARDING_L5.sessionContextBanner}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-tt-me-onboarding-session-banner="checking"
    >
      <p className="text-small font-semibold text-ink-900">{t("me_onboarding_sessionBannerCheckingTitle")}</p>
      <p className="mt-1 text-meta leading-relaxed text-ink-600">{t("me_onboarding_sessionCheckingBody")}</p>
    </div>
  );
}
