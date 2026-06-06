"use client";

import { OnboardingProgressCompactRail } from "@/components/onboarding/OnboardingProgressCompactRail";
import { MeOnboardingSectionSkeleton } from "@/components/me/MeOnboardingSectionSkeleton";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

import { ME_ONBOARDING_SECTION_CARD_CLASS } from "./meOnboardingPageChrome";

type T = (key: string) => string;

/** 会话探测中（与顶栏 `useHeaderSession` 同源）· 不展示登录门闸，避免「头像已登录 + 正文请先登录」 */
export function MeOnboardingWritesProbeShell({ t }: { t: T }) {
  return (
    <section
      className={ME_ONBOARDING_SECTION_CARD_CLASS}
      aria-labelledby="me-onboarding-writes-probe-title"
      aria-busy="true"
      data-tt-me-onboarding-writes-session-probe="1"
    >
      <h2 id="me-onboarding-writes-probe-title" className="text-h4 font-semibold text-ink-900">
        {t("me_onboarding_writesSection")}
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-3" aria-hidden="true">
        <OnboardingProgressCompactRail
          steps={[
            { id: "pay", step: 1, state: "pending" },
            { id: "confirm", step: 2, state: "pending" },
          ]}
          variant="console"
        />
        <span className="text-meta text-ink-500">{t("me_onboarding_writesLoginGateSteps")}</span>
      </div>
      <div className={`${TT_ME_ONBOARDING_L5.entitlementsSyncingShell} mt-4`}>
        <MeOnboardingSectionSkeleton rows={2} />
        <p className="mt-3 text-small font-medium text-ink-800">{t("me_onboarding_sessionCheckingTitle")}</p>
      </div>
    </section>
  );
}
