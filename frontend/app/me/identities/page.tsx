"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { MeIdentitiesL5IdentityCard } from "@/components/me/MeIdentitiesL5IdentityCard";
import MeIdentitiesRouteLoading from "@/components/me/MeIdentitiesRouteLoading";
import { MeIdentitiesTravelerCallout } from "@/components/me/MeIdentitiesTravelerCallout";
import { useTranslation } from "@/components/LocaleProvider";
import { meTrustStateLabelKey } from "@/components/me/meTrustSectionLabels";
import { buildHeaderLoginHref, buildHeaderRegisterHref, buildIdentitiesApplyChildHref } from "@/lib/headerLoginHref";
import {
  deriveMeIdentitiesCoreCardView,
  ME_IDENTITIES_ACQUISITION_SETTINGS_HREF,
  ME_IDENTITIES_MERCHANT_SETTINGS_HREF,
  ME_IDENTITIES_STEWARD_SETTINGS_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import { meIdentitiesHubSlotState } from "@/lib/me/meIdentitiesHubSlots";
import { meIdentitiesL5MainDataAttrs, TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";
import { useMeIdentitiesCoreCardSignals } from "@/lib/me/useMeIdentitiesCoreCardSignals";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";

/** 顶栏「多重身份」汇总：旅行者 + Provider/Steward 核心轨 + 扩展申请（L5 暗壳 · 与 `/auth/*` 同族）。 */
function MeIdentitiesHubInner() {
  const { t } = useTranslation();
  const { ready: slotsReady, slotById } = useMeIdentitySlots();
  const { bundle: coreSignals, ready: coreReady } = useMeIdentitiesCoreCardSignals(slotById, slotsReady);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registerHref = useMemo(
    () => buildHeaderRegisterHref(pathname, searchParams),
    [pathname, searchParams],
  );
  const loginHref = useMemo(() => buildHeaderLoginHref(pathname, searchParams), [pathname, searchParams]);
  const providerApplyHref = useMemo(
    () => buildIdentitiesApplyChildHref("/provider/register", pathname, searchParams),
    [pathname, searchParams],
  );
  const stewardApplyHref = useMemo(
    () => buildIdentitiesApplyChildHref("/steward/register", pathname, searchParams),
    [pathname, searchParams],
  );
  const providerOnboardingHref = "/me/onboarding?role=provider&from=identities_hub";
  const stewardOnboardingHref = "/me/onboarding?role=region_steward&from=identities_hub";

  const travelerState = slotsReady ? slotById("traveler")?.state ?? null : null;
  const travelerStatusLabel =
    travelerState && travelerState !== "inactive" ? t(meTrustStateLabelKey(travelerState)) : null;

  const coreCards = [
    {
      surfaceId: "provider" as const,
      titleKey: "header_identity_provider",
      descKey: "me_identities_card_provider_desc",
      applyHref: providerApplyHref,
      onboardingHref: providerOnboardingHref,
    },
    {
      surfaceId: "steward" as const,
      titleKey: "header_identity_steward",
      descKey: "me_identities_card_steward_desc",
      applyHref: stewardApplyHref,
      onboardingHref: stewardOnboardingHref,
    },
  ] as const;

  const guideApplyHref = useMemo(() => {
    const guideState = slotsReady ? slotById("guide")?.state ?? null : null;
    if (guideState && guideState !== "inactive") {
      return "/me/identities/guide/settings";
    }
    return buildIdentitiesApplyChildHref("/guide/register", pathname, searchParams);
  }, [slotsReady, slotById, pathname, searchParams]);

  const acquisitionApplyHref = useMemo(() => {
    const acquisitionState = slotsReady ? slotById("acquisition")?.state ?? null : null;
    if (acquisitionState && acquisitionState !== "inactive") {
      return ME_IDENTITIES_ACQUISITION_SETTINGS_HREF;
    }
    return buildIdentitiesApplyChildHref("/market/acquisition", pathname, searchParams);
  }, [slotsReady, slotById, pathname, searchParams]);

  const extendedCards = useMemo(
    () =>
      [
        {
          href: guideApplyHref,
          surfaceId: "guide" as const,
          titleKey: "header_identity_applyGuide" as const,
          descKey: "me_identities_card_guide_desc" as const,
          ctaKey:
            guideApplyHref.includes("/guide/settings")
              ? ("me_identities_card_guide_settings_cta" as const)
              : ("me_identities_card_cta" as const),
        },
        {
          href: acquisitionApplyHref,
          surfaceId: "acquisition" as const,
          titleKey: "header_identity_acquisition" as const,
          descKey: "me_identities_card_acquisition_desc" as const,
          ctaKey:
            acquisitionApplyHref.includes("/acquisition/settings")
              ? ("me_identities_card_acquisition_settings_cta" as const)
              : ("me_identities_card_cta_market" as const),
        },
      ] as const,
    [guideApplyHref, acquisitionApplyHref],
  );

  return (
    <main
      className={TT_ME_IDENTITIES_L5.pageShell}
      aria-labelledby="me-identities-hub-title"
      data-tt-me-identities-surface="hub"
      {...meIdentitiesL5MainDataAttrs(true)}
    >
      <AuthL5PageBackdrop />
      <div className={TT_ME_IDENTITIES_L5.inner}>
        <header className={TT_ME_IDENTITIES_L5.headerBlock}>
          <p className={TT_ME_IDENTITIES_L5.eyebrow}>{t("me_identities_hub_eyebrow")}</p>
          <h1 id="me-identities-hub-title" className={TT_ME_IDENTITIES_L5.title}>
            {t("me_identities_hub_title")}
          </h1>
          <p className={TT_ME_IDENTITIES_L5.subtitle}>{t("me_identities_hub_subtitle")}</p>
        </header>

        <section className="mt-6" aria-labelledby="me-identities-core-heading">
          <h2 id="me-identities-core-heading" className={TT_ME_IDENTITIES_L5.applySectionTitle}>
            {t("me_identities_core_section_title")}
          </h2>
          <MeIdentitiesTravelerCallout
            registerHref={registerHref}
            loginHref={loginHref}
            statusLabel={travelerStatusLabel}
            statusState={travelerState && travelerState !== "inactive" ? travelerState : null}
          />
          <ul
            className={`${TT_ME_IDENTITIES_L5.grid} mt-4`}
            aria-label={t("me_identities_core_grid_aria")}
            data-tt-me-identities-core-grid="1"
          >
            {coreCards.map(({ surfaceId, titleKey, descKey, applyHref, onboardingHref }) => {
              const signals =
                coreReady && coreSignals
                  ? surfaceId === "provider"
                    ? coreSignals.provider
                    : coreSignals.steward
                  : null;
              const cardView = signals
                ? deriveMeIdentitiesCoreCardView(signals, {
                    applyHref,
                    onboardingHref,
                    activeHref:
                      surfaceId === "provider"
                        ? ME_IDENTITIES_MERCHANT_SETTINGS_HREF
                        : ME_IDENTITIES_STEWARD_SETTINGS_HREF,
                  })
                : null;
              const slotState = slotsReady ? meIdentitiesHubSlotState(surfaceId, slotById) : null;
              const statusLabel = cardView ? t(cardView.statusLabelKey) : null;
              let cta = cardView ? t(cardView.ctaLabelKey) : t("me_identities_card_cta");
              let href = cardView?.href ?? applyHref;
              if (
                surfaceId === "provider" &&
                slotState &&
                slotState !== "inactive"
              ) {
                href = ME_IDENTITIES_MERCHANT_SETTINGS_HREF;
                cta = t("me_identities_card_merchant_settings_cta");
              }
              return (
                <li key={surfaceId} className={TT_ME_IDENTITIES_L5.gridItem}>
                  <MeIdentitiesL5IdentityCard
                    href={href}
                    surfaceId={surfaceId}
                    title={t(titleKey)}
                    description={t(descKey)}
                    ctaLabel={cta}
                    statusLabel={statusLabel}
                    statusState={cardView?.statusPillState ?? slotState}
                    corePhase={cardView?.phase ?? null}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section className={TT_ME_IDENTITIES_L5.gridSection} aria-labelledby="me-identities-apply-heading">
          <h2 id="me-identities-apply-heading" className={TT_ME_IDENTITIES_L5.applySectionTitle}>
            {t("me_identities_apply_section_title")}
          </h2>
          <div className={TT_ME_IDENTITIES_L5.gridHalo} aria-hidden />
          <ul
            className={TT_ME_IDENTITIES_L5.grid}
            aria-label={t("me_identities_apply_grid_aria")}
            data-tt-me-identities-apply-grid="1"
          >
            {extendedCards.map(({ href, surfaceId, titleKey, descKey, ctaKey }) => {
              const slotState = slotsReady ? meIdentitiesHubSlotState(surfaceId, slotById) : null;
              const statusLabel =
                slotState != null ? t(meTrustStateLabelKey(slotState)) : null;
              return (
                <li key={surfaceId} className={TT_ME_IDENTITIES_L5.gridItem}>
                  <MeIdentitiesL5IdentityCard
                    href={href}
                    surfaceId={surfaceId}
                    title={t(titleKey)}
                    description={t(descKey)}
                    ctaLabel={t(ctaKey)}
                    statusLabel={statusLabel}
                    statusState={slotState}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <p className={`${TT_ME_IDENTITIES_L5.footerLinks} text-meta leading-relaxed text-ink-500`} role="note">
          {t("me_identities_onboarding_console_note")}
        </p>
        <nav className={TT_ME_IDENTITIES_L5.footerLinks} aria-label={t("me_identities_footer_nav_aria")}>
          <Link href={providerOnboardingHref} className={TT_ME_IDENTITIES_L5.footerLink}>
            {t("me_identities_link_onboarding_provider")}
          </Link>
          <Link href={stewardOnboardingHref} className={TT_ME_IDENTITIES_L5.footerLink}>
            {t("me_identities_link_onboarding_steward")}
          </Link>
          <Link href="/me/settings/profile" className={TT_ME_IDENTITIES_L5.footerLink}>
            {t("me_identities_back_community")}
          </Link>
        </nav>

        <AuthL5CrossNavFooter hideFeeRouterLinks />
      </div>
    </main>
  );
}

export default function MeIdentitiesHubPage() {
  return (
    <Suspense fallback={<MeIdentitiesRouteLoading />}>
      <MeIdentitiesHubInner />
    </Suspense>
  );
}
