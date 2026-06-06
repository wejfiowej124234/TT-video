"use client";

import Link from "next/link";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import GuideRegisterLoginGate from "@/app/guide/register/GuideRegisterLoginGate";
import { GuideRegisterRouteSuspense } from "@/components/guide/GuideRegisterRouteSuspense";
import { StewardOnboardingProgress } from "@/components/steward/StewardOnboardingProgress";
import StewardRegisterContextBanners from "./StewardRegisterContextBanners";
import { TT_AUTH_REGISTER_FLOW_L5 } from "@/lib/auth/authRegisterFlowL5";
import { stewardRegisterL5MainDataAttrs, TT_STEWARD_REGISTER_L5 } from "@/lib/steward/stewardRegisterL5";
import { guideRegFocusRing } from "@/app/guide/register/guideRegisterUiClasses";
import StewardRegisterPendingPanel from "./StewardRegisterPendingPanel";
import { StewardRegisterAlreadyPanel, StewardRegisterDonePanel, StewardRegisterRejectedGate } from "./StewardRegisterStatusPanels";
import { StewardRegisterMainForm } from "./StewardRegisterMainForm";
import {
  MeSettingsExtensionIngressBlock,
  meSettingsExtensionIngressDataAttrs,
} from "@/components/me/MeSettingsExtensionIngressBlock";
import { useStewardRegisterPage } from "./useStewardRegisterPage";

function StewardRegisterPageInner() {
  const page = useStewardRegisterPage();
  const {
    t,
    backHref,
    fromSettings,
    settingsBackLabelKey,
    loginReturnUrl,
    done,
    isAlreadySteward,
    isPending,
    showRejectedGate,
    rejectionMessage,
    unlockReapply,
    isLoggedIn,
    meCheckReady,
    successFocusRef,
    step,
  } = page;

  if (showRejectedGate && isLoggedIn === true) {
    return (
      <main
        className={TT_STEWARD_REGISTER_L5.pageShell}
        {...stewardRegisterL5MainDataAttrs()}
        {...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-steward-register-from-settings")}
      >
        <AuthL5PageBackdrop />
        <div className={TT_STEWARD_REGISTER_L5.pageColumn}>
          <MeSettingsExtensionIngressBlock
            fromSettings={fromSettings}
            noticeKey="me_settings_steward_register_from_settings_notice"
            t={t}
          />
          <AuthL5Card maxWidth="wide">
            <StewardRegisterRejectedGate t={t} rejectionMessage={rejectionMessage} onReapply={unlockReapply} />
            <AuthL5CrossNavFooter hideFeeRouterLinks className={TT_STEWARD_REGISTER_L5.footerLinks} />
          </AuthL5Card>
        </div>
      </main>
    );
  }

  if (isPending && !done && isLoggedIn === true) {
    return <StewardRegisterPendingPanel successFocusRef={successFocusRef} t={t} />;
  }

  return (
    <main
      className={TT_STEWARD_REGISTER_L5.pageShell}
      {...stewardRegisterL5MainDataAttrs()}
      {...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-steward-register-from-settings")}
    >
      <AuthL5PageBackdrop />
      <div className={TT_STEWARD_REGISTER_L5.pageColumn}>
        <MeSettingsExtensionIngressBlock
          fromSettings={fromSettings}
          noticeKey="me_settings_steward_register_from_settings_notice"
          t={t}
        />
        <AuthL5Card maxWidth="wide">
          <p className={TT_AUTH_REGISTER_FLOW_L5.hubKicker} data-tt-steward-register-hub-kicker="1">
            — {t("stewardRegister_hubKicker")} —
          </p>
          <Link href={backHref} className={TT_AUTH_REGISTER_FLOW_L5.backToHub}>
            {t(settingsBackLabelKey)}
          </Link>
          <header className={TT_STEWARD_REGISTER_L5.headerBlock}>
            <p className={TT_STEWARD_REGISTER_L5.eyebrow}>{t("stewardRegister_eyebrow")}</p>
            <h1 className={TT_STEWARD_REGISTER_L5.title}>{t("steward_register_title")}</h1>
            <p className={TT_STEWARD_REGISTER_L5.intro}>{t("steward_register_intro")}</p>
          </header>

          {!isAlreadySteward && !done && isLoggedIn === true && meCheckReady ? (
            <StewardRegisterContextBanners t={t} />
          ) : null}

          {!isAlreadySteward && !done ? (
            <StewardOnboardingProgress
              currentStep={isLoggedIn === true && meCheckReady ? 2 : 1}
              variant="compact"
              defaultExpanded={false}
              wizardStep={isLoggedIn === true && meCheckReady ? step : undefined}
              className="mb-4"
            />
          ) : null}

          {isLoggedIn === false ? (
            <GuideRegisterLoginGate
              t={t}
              loginHref={`/auth/login?returnUrl=${encodeURIComponent(loginReturnUrl)}`}
              titleKey="stewardRegister_loginGateTitle"
              bodyKey="stewardRegister_loginGateBody"
            />
          ) : isAlreadySteward ? (
            <StewardRegisterAlreadyPanel t={t} />
          ) : done ? (
            <StewardRegisterDonePanel t={t} />
          ) : isLoggedIn === true && meCheckReady ? (
            <StewardRegisterMainForm {...page} />
          ) : (
            <p className="text-meta text-slate-500" aria-busy="true">
              {t("stewardRegister_loading")}
            </p>
          )}

          <AuthL5CrossNavFooter hideFeeRouterLinks className={TT_STEWARD_REGISTER_L5.footerLinks} />
        </AuthL5Card>
      </div>
    </main>
  );
}

export default function StewardRegisterPageMain() {
  return (
    <GuideRegisterRouteSuspense>
      <StewardRegisterPageInner />
    </GuideRegisterRouteSuspense>
  );
}
