"use client";

import Link from "next/link";
import type { RefObject } from "react";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { ProviderOnboardingProgress } from "@/components/provider/ProviderOnboardingProgress";
import { meOnboardingHref } from "@/app/me/onboarding/meOnboardingLoginReturn";
import { TT_AUTH_REGISTER_FLOW_L5 } from "@/lib/auth/authRegisterFlowL5";
import {
  MeSettingsExtensionIngressBlock,
  meSettingsExtensionIngressDataAttrs,
} from "@/components/me/MeSettingsExtensionIngressBlock";
import { useMeSettingsExtensionFromUrl } from "@/lib/me/useMeSettingsExtensionFromUrl";
import { providerRegisterL5MainDataAttrs, TT_PROVIDER_REGISTER_L5 } from "@/lib/provider/providerRegisterL5";
import {
  guideRegFocusRing,
  guideRegPrimaryCta,
  guideRegSecondaryBtn,
} from "@/app/guide/register/guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TouchpointConversionStrip } from "@/components/product-enhancement/TouchpointConversionStrip";

export default function ProviderRegisterPendingPanel({
  successFocusRef,
  t,
}: {
  successFocusRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}) {
  const journeyStep = 3 as const;
  const fromSettings = useMeSettingsExtensionFromUrl();

  return (
    <main
      className={TT_PROVIDER_REGISTER_L5.pageShell}
      aria-label={t("providerRegister_pendingTitle")}
      {...providerRegisterL5MainDataAttrs()}
      {...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-provider-register-from-settings")}
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_PROVIDER_REGISTER_L5.pageColumn} flex flex-1 flex-col items-center justify-center gap-8`}>
        <MeSettingsExtensionIngressBlock
          fromSettings={fromSettings}
          noticeKey="me_settings_provider_register_from_settings_notice"
          t={t}
        />
        <div className={TT_PROVIDER_REGISTER_L5.statusCardWrap}>
          <AuthL5Card>
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <ProviderOnboardingProgress
              currentStep={journeyStep}
              variant="compact"
              defaultExpanded={false}
              className="mb-1"
            />
            <div className={TT_AUTH_REGISTER_FLOW_L5.pendingStatusSection}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-h4 font-semibold text-slate-100" role="status" aria-live="polite">
                  {t("providerRegister_pendingTitle")}
                </p>
                <span className={TT_PROVIDER_REGISTER_L5.pendingStatusBadge}>
                  {t("providerRegister_pendingReviewBadge")}
                </span>
              </div>
              <p className="text-small leading-relaxed text-slate-300/95">{t("providerRegister_pendingDesc")}</p>
            </div>
            <TouchpointConversionStrip
              touchpoint="merchant"
              kicker={t("pes_merchant_conversion_kicker")}
              body={t("pes_merchant_conversion_body")}
              badge={t("pes_merchant_conversion_badge")}
              ctaHref="/help"
              ctaLabel={t("pes_merchant_conversion_cta")}
              className="mb-4"
            />
            <div className={TT_AUTH_REGISTER_FLOW_L5.pendingHintStack}>
              <p>{t("providerRegister_pendingNotify")}</p>
              <p>{t("providerRegister_pendingOnboardingHint")}</p>
            </div>
            <div className={TT_AUTH_REGISTER_FLOW_L5.pendingActions}>
              <Link
                href={meOnboardingHref("provider", { from: "provider_pending" })}
                className={`${touchTargetLink44Classes} inline-flex w-full items-center justify-center sm:w-auto ${guideRegPrimaryCta} px-5 ${guideRegFocusRing}`}
              >
                {t("providerRegister_goOnboarding")}
              </Link>
              <Link
                href="/me/identities"
                className={`${touchTargetLink44Classes} inline-flex w-full items-center justify-center sm:w-auto ${guideRegSecondaryBtn} px-5 ${guideRegFocusRing}`}
              >
                {t("header_multiIdentity")}
              </Link>
            </div>
          </AuthL5Card>
        </div>
        <AuthL5CrossNavFooter
          hideFeeRouterLinks
          className={`${TT_PROVIDER_REGISTER_L5.footerLinks} ${TT_AUTH_REGISTER_FLOW_L5.pendingCrossNav}`}
        />
      </div>
    </main>
  );
}
