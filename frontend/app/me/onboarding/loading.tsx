"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_MARKETING_ACCOUNT_PAGE_SHELL } from "@/lib/accountUi";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";
import { ME_ONBOARDING_SECTION_CARD_CLASS } from "./meOnboardingPageChrome";

type MeOnboardingLoadingProps = {
  "data-tt-me-onboarding-gate-redirect"?: "1";
};

/** Console 壳骨架 · 与 `MeOnboardingPageMain` 布局同族 */
export default function MeOnboardingLoading(props: MeOnboardingLoadingProps = {}) {
  const { t } = useTranslation();
  return (
    <main
      className={TT_MARKETING_ACCOUNT_PAGE_SHELL}
      role="status"
      aria-label={t("me_onboarding_title")}
      aria-busy="true"
      data-tt-me-onboarding-loading="1"
      {...props}
      {...TT_ME_ONBOARDING_L5.pageAttrs}
    >
      <div className="mx-auto max-w-3xl space-y-6" aria-hidden>
        <div className="space-y-3">
          <div className="min-h-[44px] h-11 w-56 rounded-[var(--radius-sm)] bg-ink-200 animate-pulse" />
          <div className="h-4 w-full max-w-2xl rounded-[var(--radius-sm)] bg-ink-100 animate-pulse" />
          <div className={`${TT_ME_ONBOARDING_L5.progressShell} min-h-[72px] animate-pulse opacity-70`} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${ME_ONBOARDING_SECTION_CARD_CLASS} space-y-3`}>
            <div className="min-h-[44px] h-10 w-40 rounded-[var(--radius-sm)] bg-ink-200 animate-pulse" />
            <div className="h-24 w-full rounded-[var(--radius-sm)] bg-ink-100 animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
