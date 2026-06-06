import { OnboardingProgressCompactRail } from "@/components/onboarding/OnboardingProgressCompactRail";
import { MeOnboardingSectionLockedState } from "@/components/me/MeOnboardingSectionLockedState";
import type { OnboardingQuoteRole } from "@/lib/apiClient";

import { ME_ONBOARDING_SECTION_CARD_CLASS } from "./meOnboardingPageChrome";

type T = (key: string) => string;

/** 未登录 · 写入区 L5 门闸（主登录/注册 CTA 仅在「当前建议操作」） */
export function MeOnboardingWritesLoginGate({ t, quoteRole: _quoteRole }: { t: T; quoteRole: OnboardingQuoteRole }) {
  return (
    <section
      className={ME_ONBOARDING_SECTION_CARD_CLASS}
      aria-labelledby="me-onboarding-writes-gate-title"
      data-tt-me-onboarding-writes-login-gate="1"
    >
      <h2 id="me-onboarding-writes-gate-title" className="text-h4 font-semibold text-ink-900">
        {t("me_onboarding_writesSection")}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-3" aria-hidden="true">
        <OnboardingProgressCompactRail
          steps={[
            { id: "pay", step: 1, state: "pending" },
            { id: "confirm", step: 2, state: "pending" },
          ]}
          variant="console"
        />
        <span className="text-meta text-ink-500">{t("me_onboarding_writesLoginGateSteps")}</span>
      </div>
      <MeOnboardingSectionLockedState t={t} titleKey="me_onboarding_writesLoginDeferTitle" />
    </section>
  );
}
