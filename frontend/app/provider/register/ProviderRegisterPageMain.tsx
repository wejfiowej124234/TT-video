"use client";

import Link from "next/link";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import GuideRegisterLoginGate from "@/app/guide/register/GuideRegisterLoginGate";
import { ProviderRegisterMainForm } from "./ProviderRegisterMainForm";
import ProviderRegisterAlreadyPanel from "./ProviderRegisterAlreadyPanel";
import ProviderRegisterPendingPanel from "./ProviderRegisterPendingPanel";
import ProviderRegisterRejectedGate from "./ProviderRegisterRejectedGate";
import { useProviderRegisterPage } from "./useProviderRegisterPage";
import { ProviderOnboardingProgress } from "@/components/provider/ProviderOnboardingProgress";
import { meOnboardingHref } from "@/app/me/onboarding/meOnboardingLoginReturn";
import { TT_AUTH_REGISTER_FLOW_L5 } from "@/lib/auth/authRegisterFlowL5";
import {
  MeSettingsExtensionIngressBlock,
  meSettingsExtensionIngressDataAttrs,
} from "@/components/me/MeSettingsExtensionIngressBlock";
import { providerRegisterL5MainDataAttrs, TT_PROVIDER_REGISTER_L5 } from "@/lib/provider/providerRegisterL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  guideRegFocusRing,
  guideRegPrimaryCta,
  guideRegSecondaryBtn,
} from "@/app/guide/register/guideRegisterUiClasses";
import { ConversionFunnelRail } from "@/components/product-enhancement/ConversionFunnelRail";

function ProviderRegisterDonePanel({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4 text-center" data-tt-provider-register-done="1">
      <ProviderOnboardingProgress
        currentStep={3}
        variant="compact"
        defaultExpanded={false}
        className="text-left"
      />
      <h2 className="text-h4 font-semibold text-slate-100">{t("providerRegister_doneTitle")}</h2>
      <p className="text-small text-slate-300">{t("providerRegister_doneBody")}</p>
      <div className="flex flex-col gap-3 sm:items-center">
        <Link
          href={meOnboardingHref("provider", { from: "provider_register" })}
          className={`${touchTargetLink44Classes} inline-flex w-full items-center justify-center sm:w-auto ${guideRegPrimaryCta} px-5 ${guideRegFocusRing}`}
        >
          {t("providerRegister_goOnboarding")}
        </Link>
        <Link
          href="/staking"
          className={`${touchTargetLink44Classes} inline-flex w-full items-center justify-center sm:w-auto ${guideRegSecondaryBtn} px-5 ${guideRegFocusRing}`}
        >
          {t("providerRegister_goStaking")}
        </Link>
      </div>
    </div>
  );
}

export function ProviderRegisterPageMain() {
  const page = useProviderRegisterPage();
  const {
    t,
    backHref,
    fromSettings,
    settingsBackLabelKey,
    loginReturnUrl,
    done,
    isAlreadyProvider,
    isPending,
    isLoggedIn,
    showRejectedGate,
    rejectionCodes,
    rejectionMessage,
    unlockReapply,
    successFocusRef,
    meCheckReady,
  } = page;

  if (showRejectedGate && isLoggedIn === true) {
    return (
      <ProviderRegisterRejectedGate
        successFocusRef={successFocusRef}
        t={t}
        rejectionCodes={rejectionCodes}
        rejectionMessage={rejectionMessage}
        onReapply={unlockReapply}
      />
    );
  }

  if (isPending && !done && isLoggedIn === true) {
    return <ProviderRegisterPendingPanel successFocusRef={successFocusRef} t={t} />;
  }

  return (
    <main
      className={TT_PROVIDER_REGISTER_L5.pageShell}
      {...providerRegisterL5MainDataAttrs()}
      {...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-provider-register-from-settings")}
    >
      <AuthL5PageBackdrop />
      <div className={TT_PROVIDER_REGISTER_L5.pageColumn}>
        <MeSettingsExtensionIngressBlock
          fromSettings={fromSettings}
          noticeKey="me_settings_provider_register_from_settings_notice"
          t={t}
        />
        <AuthL5Card maxWidth="wide">
          <p className={TT_AUTH_REGISTER_FLOW_L5.hubKicker} data-tt-provider-register-hub-kicker="1">
            — {t("providerRegister_hubKicker")} —
          </p>
          <Link href={backHref} className={TT_AUTH_REGISTER_FLOW_L5.backToHub}>
            {t(settingsBackLabelKey)}
          </Link>
          <header className={TT_PROVIDER_REGISTER_L5.headerBlock}>
            <p className={TT_PROVIDER_REGISTER_L5.eyebrow}>{t("providerRegister_eyebrow")}</p>
            <h1 className={TT_PROVIDER_REGISTER_L5.title}>{t("providerRegister_title")}</h1>
            <p className={TT_PROVIDER_REGISTER_L5.intro}>{t("providerRegister_intro")}</p>
          </header>
          <ConversionFunnelRail touchpoint="merchant" t={t} variant="light" className="mb-4" />
          {!isAlreadyProvider && !done ? (
            <ProviderOnboardingProgress
              currentStep={isLoggedIn === true && meCheckReady ? 2 : 1}
              variant="compact"
              defaultExpanded={false}
              className="mb-4"
            />
          ) : null}

          {isLoggedIn === false ? (
            <GuideRegisterLoginGate
              t={t}
              loginHref={`/auth/login?returnUrl=${encodeURIComponent(loginReturnUrl)}`}
              titleKey="providerRegister_loginGateTitle"
              bodyKey="providerRegister_loginGateBody"
            />
          ) : isAlreadyProvider ? (
            <ProviderRegisterAlreadyPanel t={t} />
          ) : done ? (
            <ProviderRegisterDonePanel t={t} />
          ) : isLoggedIn === true && meCheckReady ? (
            <ProviderRegisterMainForm {...page} />
          ) : (
            <p className="text-meta text-slate-500" aria-busy="true">
              {t("providerRegister_loading")}
            </p>
          )}

          <AuthL5CrossNavFooter hideFeeRouterLinks className={TT_PROVIDER_REGISTER_L5.footerLinks} />
        </AuthL5Card>
      </div>
    </main>
  );
}
