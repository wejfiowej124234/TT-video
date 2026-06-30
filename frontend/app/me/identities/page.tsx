"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { MeIdentitiesL5IdentityCard } from "@/components/me/MeIdentitiesL5IdentityCard";
import { MeIdentitiesProfileLinksNav } from "@/components/me/MeIdentitiesProfileLinksNav";
import MeIdentitiesRouteLoading from "@/components/me/MeIdentitiesRouteLoading";
import { MeIdentitiesTravelerCallout } from "@/components/me/MeIdentitiesTravelerCallout";
import { useTranslation } from "@/components/LocaleProvider";
import { meTrustStateLabelKey } from "@/components/me/meTrustSectionLabels";
import { buildHeaderLoginHref, buildHeaderRegisterHref, buildIdentitiesApplyChildHref } from "@/lib/headerLoginHref";
import { deriveMeIdentitiesAcquisitionCardView } from "@/lib/me/meIdentitiesAcquisitionHubModel";
import {
  deriveMeIdentitiesCoreCardView,
  ME_IDENTITIES_MERCHANT_SETTINGS_HREF,
  ME_IDENTITIES_STEWARD_SETTINGS_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import { meIdentitiesHubSlotState } from "@/lib/me/meIdentitiesHubSlots";
import { meIdentitiesL5MainDataAttrs, TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";
import { meIdentitiesProfileLinks } from "@/lib/me/meIdentitiesProfileLinksModel";
import { meIdentitiesHubOperatorSectionDefaultOpen } from "@/lib/me/meIdentitiesIaClosureSprintModel";
import { useMeIdentitiesProfileLinkThumbs } from "@/lib/me/useMeIdentitiesProfileLinkThumbs";
import { useMeIdentitiesCoreCardSignals } from "@/lib/me/useMeIdentitiesCoreCardSignals";
import { useMeIdentityHubBlockedReasons } from "@/lib/me/useMeIdentityHubBlockedReasons";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import {
  isComplexityConvergenceFreezeActive,
  isExpansionIdentitySurfaceVisible,
} from "@/lib/complexityConvergenceSurface";
import { stewardAdmissionWorkbenchHref } from "@/lib/steward/stewardAdmissionNav";

/** 顶栏「多重身份」Hub：基础能力（旅行者+收购）+ 经营身份申请/工作台（L5 暗壳）。 */
function MeIdentitiesHubInner() {
  const { t } = useTranslation();
  const { ready: slotsReady, slotById, slots } = useMeIdentitySlots();
  const { blockedReasonBySurface } = useMeIdentityHubBlockedReasons(slotsReady, slotById);
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
  const stewardOnboardingHref = stewardAdmissionWorkbenchHref("identities_hub");

  const loggedIn = slotsReady && slots != null;
  const userRole = coreSignals?.provider.userRole ?? coreSignals?.steward.userRole ?? null;

  const travelerState = slotsReady ? slotById("traveler")?.state ?? null : null;
  const travelerStatusLabel =
    travelerState && travelerState !== "inactive" ? t(meTrustStateLabelKey(travelerState)) : null;

  const acquisitionCard = useMemo(() => {
    const rawState = slotsReady ? slotById("acquisition")?.state ?? null : null;
    return deriveMeIdentitiesAcquisitionCardView(rawState);
  }, [slotsReady, slotById]);

  const profileLinks = useMemo(
    () =>
      meIdentitiesProfileLinks({
        loggedIn,
        userRole,
        guideSlotState: slotsReady ? slotById("guide")?.state ?? null : null,
        merchantSlotState: slotsReady ? slotById("merchant")?.state ?? null : null,
        stewardSlotState: slotsReady ? slotById("region_steward")?.state ?? null : null,
      }),
    [loggedIn, userRole, slotsReady, slotById],
  );

  const operatorSectionDefaultOpen = useMemo(() => {
    if (!slotsReady) return true;
    return meIdentitiesHubOperatorSectionDefaultOpen({
      guide: slotById("guide")?.state ?? null,
      merchant: slotById("merchant")?.state ?? null,
      region_steward: slotById("region_steward")?.state ?? null,
    });
  }, [slotsReady, slotById]);

  const profileLinkIds = useMemo(() => profileLinks.map((link) => link.id), [profileLinks]);
  const profileLinkThumbs = useMeIdentitiesProfileLinkThumbs(profileLinkIds, loggedIn);

  const operatorCards = [
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
      return "/guide";
    }
    return buildIdentitiesApplyChildHref("/guide/register", pathname, searchParams);
  }, [slotsReady, slotById, pathname, searchParams]);

  const guideCard = useMemo(
    () =>
      ({
        href: guideApplyHref,
        surfaceId: "guide" as const,
        titleKey: "header_identity_applyGuide" as const,
        descKey: "me_identities_card_guide_desc" as const,
        ctaKey:
          guideApplyHref === "/guide"
            ? ("me_identities_card_guide_workspace_cta" as const)
            : guideApplyHref.includes("/guide/settings")
              ? ("me_identities_card_guide_settings_cta" as const)
              : ("me_identities_card_cta" as const),
      }) as const,
    [guideApplyHref],
  );

  return (
    <main
      className={TT_ME_IDENTITIES_L5.pageShell}
      aria-labelledby="me-identities-hub-title"
      data-tt-me-identities-surface="hub"
      data-tt-complexity-convergence-freeze={isComplexityConvergenceFreezeActive() ? "1" : undefined}
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

        <section className="mt-6" aria-labelledby="me-identities-capabilities-heading">
          <h2 id="me-identities-capabilities-heading" className={TT_ME_IDENTITIES_L5.applySectionTitle}>
            {t("me_identities_capabilities_section_title")}
          </h2>
          <MeIdentitiesTravelerCallout
            registerHref={registerHref}
            loginHref={loginHref}
            statusLabel={travelerStatusLabel}
            statusState={travelerState && travelerState !== "inactive" ? travelerState : null}
          />
          <ul
            className={`${TT_ME_IDENTITIES_L5.grid} mt-4`}
            aria-label={t("me_identities_capabilities_grid_aria")}
            data-tt-me-identities-capabilities-grid="1"
          >
            {isExpansionIdentitySurfaceVisible("acquisition") ? (
            <li className={TT_ME_IDENTITIES_L5.gridItem}>
              <MeIdentitiesL5IdentityCard
                href={acquisitionCard.href}
                surfaceId="acquisition"
                title={t("header_identity_acquisition")}
                description={t("me_identities_card_acquisition_capability_desc")}
                ctaLabel={t(acquisitionCard.ctaLabelKey)}
                statusLabel={acquisitionCard.showStatus ? t(acquisitionCard.statusLabelKey) : null}
                statusState={acquisitionCard.showStatus ? acquisitionCard.statusPillState : null}
                blockedReasonLines={blockedReasonBySurface.acquisition}
              />
            </li>
            ) : null}
          </ul>
        </section>

        <section className={TT_ME_IDENTITIES_L5.gridSection} aria-labelledby="me-identities-operator-heading">
          <h2 id="me-identities-operator-heading" className={TT_ME_IDENTITIES_L5.applySectionTitle}>
            {t("me_identities_operator_section_title")}
          </h2>
          <details open={operatorSectionDefaultOpen} className="group">
            <summary
              className={`mb-4 max-w-2xl cursor-pointer list-none text-meta leading-relaxed text-slate-400/95 marker:content-none [&::-webkit-details-marker]:hidden ${!operatorSectionDefaultOpen ? "text-ref-sun/90 underline-offset-2 hover:underline" : ""}`}
            >
              {operatorSectionDefaultOpen
                ? t("me_identities_operator_section_hint")
                : t("me_identities_operator_section_expand")}
            </summary>
            {!operatorSectionDefaultOpen ? (
              <p className="sr-only">{t("me_identities_operator_section_hint")}</p>
            ) : null}
            <div className={TT_ME_IDENTITIES_L5.gridHalo} aria-hidden />
            <ul
              className={TT_ME_IDENTITIES_L5.grid}
              aria-label={t("me_identities_operator_grid_aria")}
              data-tt-me-identities-operator-grid="1"
            >
            {operatorCards
              .filter(({ surfaceId }) =>
                isExpansionIdentitySurfaceVisible(
                  surfaceId === "provider" ? "merchant" : "region_steward",
                ),
              )
              .map(({ surfaceId, titleKey, descKey, applyHref, onboardingHref }) => {
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
              const cta = cardView ? t(cardView.ctaLabelKey) : t("me_identities_card_cta");
              const href = cardView?.href ?? applyHref;
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
                    blockedReasonLines={blockedReasonBySurface[surfaceId]}
                  />
                </li>
              );
            })}
            {(() => {
              const slotState = slotsReady ? meIdentitiesHubSlotState(guideCard.surfaceId, slotById) : null;
              const statusLabel = slotState != null ? t(meTrustStateLabelKey(slotState)) : null;
              return (
                <li key={guideCard.surfaceId} className={TT_ME_IDENTITIES_L5.gridItem}>
                  <MeIdentitiesL5IdentityCard
                    href={guideCard.href}
                    surfaceId={guideCard.surfaceId}
                    title={t(guideCard.titleKey)}
                    description={t(guideCard.descKey)}
                    ctaLabel={t(guideCard.ctaKey)}
                    statusLabel={statusLabel}
                    statusState={slotState}
                    blockedReasonLines={blockedReasonBySurface.guide}
                  />
                </li>
              );
            })()}
            </ul>
          </details>
        </section>

        <MeIdentitiesProfileLinksNav t={t} links={profileLinks} thumbs={profileLinkThumbs} />

        <p className={`${TT_ME_IDENTITIES_L5.footerLinks} text-meta leading-relaxed text-ink-500`} role="note">
          {t("me_identities_hub_footer_note")}
        </p>
        <nav className={TT_ME_IDENTITIES_L5.footerLinks} aria-label={t("me_identities_footer_nav_aria")}>
          <Link href="/me/publish" className={TT_ME_IDENTITIES_L5.footerLink}>
            {t("me_identities_publish_hub_link")}
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
