"use client";

import Link from "next/link";
import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

export function MeOnboardingDonePanel({
  t,
  quoteRole,
}: {
  t: (key: string) => string;
  quoteRole: OnboardingQuoteRole;
  footerLinkClass?: string;
}) {
  const secondaryHref =
    quoteRole === "region_steward" ? "/steward/register" : "/provider/register";
  const secondaryKey =
    quoteRole === "region_steward"
      ? "me_onboarding_donePanelSecondarySteward"
      : "me_onboarding_donePanelSecondaryProvider";

  const showWorkbenchCta = quoteRole === "provider";

  return (
    <section
      className={TT_ME_ONBOARDING_L5.donePanel}
      aria-labelledby="me-onboarding-done-title"
      data-tt-me-onboarding-done="1"
    >
      <p id="me-onboarding-done-title" className={TT_ME_ONBOARDING_L5.donePanelTitle}>
        {t("me_onboarding_donePanelTitle")}
      </p>
      <p className="mt-1 text-meta leading-relaxed text-ink-700">{t("me_onboarding_donePanelBody")}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {showWorkbenchCta ? (
          <Link href="/provider" className={TT_ME_ONBOARDING_L5.donePanelPrimaryCta}>
            {t("me_onboarding_donePanelWorkbenchCta")}
          </Link>
        ) : (
          <Link href="/me/identities" className={TT_ME_ONBOARDING_L5.donePanelPrimaryCta}>
            {t("me_onboarding_donePanelPrimaryCta")}
          </Link>
        )}
        <Link href="/me/identities" className={`${TT_ME_ONBOARDING_L5.donePanelSecondaryCta} no-underline`}>
          {t("me_onboarding_donePanelPrimaryCta")}
        </Link>
        <Link href={secondaryHref} className={`${TT_ME_ONBOARDING_L5.donePanelSecondaryCta} no-underline`}>
          {t(secondaryKey)}
        </Link>
      </div>
    </section>
  );

}
