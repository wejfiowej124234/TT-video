"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { buildAuthRegisterRoleHref } from "@/lib/headerLoginHref";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function MeIdentitiesHubFallback() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main px-4 py-8 sm:px-6" aria-busy="true">
      <div className="mx-auto max-w-3xl">
        <p className="text-meta text-ink-500">{t("me_onboarding_loading")}</p>
      </div>
    </main>
  );
}

/** 顶栏「多重身份」汇总：向导 / 商家·provider / 主理人·steward；`returnUrl` 与顶栏原链同源（`buildAuthRegisterRoleHref`）。 */
function MeIdentitiesHubInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const providerHref = useMemo(
    () => buildAuthRegisterRoleHref(pathname, "provider", searchParams),
    [pathname, searchParams],
  );
  const stewardHref = useMemo(
    () => buildAuthRegisterRoleHref(pathname, "steward", searchParams),
    [pathname, searchParams],
  );

  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;
  const cardClass = `group block rounded-[var(--radius-md)] border border-ink-200 bg-white p-5 shadow-soft outline-none transition-colors hover:border-travel-400/45 hover:bg-ink-50/90 focus-visible:ring-2 focus-visible:ring-travel-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main ${travelFocusRingCoreOffset2Classes}`;
  const ctaClass = "mt-4 inline-flex text-small font-semibold text-travel-600 group-hover:text-travel-700";

  return (
    <main
      className="min-h-screen bg-bg-main px-4 py-8 sm:px-6"
      aria-labelledby="me-identities-hub-title"
    >
      <div className="mx-auto max-w-3xl">
        <h1 id="me-identities-hub-title" className="text-h3 font-semibold text-ink-900">
          {t("me_identities_hub_title")}
        </h1>
        <p className="mt-2 max-w-2xl text-kicker leading-relaxed text-ink-600">{t("me_identities_hub_subtitle")}</p>

        <ul className="mt-8 grid list-none gap-4 p-0 m-0 sm:grid-cols-1 md:grid-cols-3">
          <li>
            <Link href="/guide/register" className={cardClass}>
              <span className="block text-h4 font-semibold text-ink-900">{t("header_identity_applyGuide")}</span>
              <span className="mt-2 block text-meta leading-snug text-ink-600">{t("me_identities_card_guide_desc")}</span>
              <span className={ctaClass}>{t("me_identities_card_cta")}</span>
            </Link>
          </li>
          <li>
            <Link href={providerHref} className={cardClass}>
              <span className="block text-h4 font-semibold text-ink-900">{t("header_identity_provider")}</span>
              <span className="mt-2 block text-meta leading-snug text-ink-600">{t("me_identities_card_provider_desc")}</span>
              <span className={ctaClass}>{t("me_identities_card_cta")}</span>
            </Link>
          </li>
          <li>
            <Link href={stewardHref} className={cardClass}>
              <span className="block text-h4 font-semibold text-ink-900">{t("header_identity_steward")}</span>
              <span className="mt-2 block text-meta leading-snug text-ink-600">{t("me_identities_card_steward_desc")}</span>
              <span className={ctaClass}>{t("me_identities_card_cta")}</span>
            </Link>
          </li>
        </ul>

        <p className="mt-10 text-meta text-ink-600">
          <Link href="/me/onboarding" className={`${footerLinkClass} mr-4 inline-block`}>
            {t("me_identities_link_onboarding")}
          </Link>
          <Link href="/community/me" className={footerLinkClass}>
            {t("me_identities_back_community")}
          </Link>
        </p>

        <div className="mt-8 border-t border-ink-200 pt-6">
          <ProductCrossNav ariaLabelKey="me_identities_relatedNav_aria" showGuides />
        </div>
      </div>
    </main>
  );
}

export default function MeIdentitiesHubPage() {
  return (
    <Suspense fallback={<MeIdentitiesHubFallback />}>
      <MeIdentitiesHubInner />
    </Suspense>
  );
}
