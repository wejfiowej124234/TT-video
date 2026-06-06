"use client";

import Link from "next/link";

import type { OnboardingQuoteRole } from "@/lib/apiClient";
import type { OnboardingFlowPhase } from "@/lib/me/meOnboardingViewModel";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";
import { TT_MARKETING_CONSOLE_LINK_FOCUS } from "@/lib/marketingUi";
import { ME_ONBOARDING_LOGIN_CTA_ID } from "@/app/me/onboarding/meOnboardingLoginCtaId";
import { meOnboardingLoginHref, meOnboardingRegisterHref } from "@/app/me/onboarding/meOnboardingLoginReturn";

const PHASE_TITLE_KEYS: Record<OnboardingFlowPhase, string> = {
  login: "me_onboarding_nextStep_login",
  quote: "me_onboarding_nextStep_quote",
  pay: "me_onboarding_nextStep_pay",
  pay_pending: "me_onboarding_nextStep_payPending",
  confirm: "me_onboarding_nextStep_confirm",
  done: "me_onboarding_nextStep_done",
};

const PHASE_BODY_BY_ROLE: Partial<
  Record<OnboardingFlowPhase, Partial<Record<OnboardingQuoteRole, string>>>
> = {
  login: {
    provider: "me_onboarding_nextStep_loginBody",
    region_steward: "me_onboarding_nextStep_loginBody",
  },
  pay: {
    provider: "me_onboarding_nextStep_payBodyProvider",
    region_steward: "me_onboarding_nextStep_payBodySteward",
  },
  pay_pending: {
    provider: "me_onboarding_nextStep_payPendingBody",
    region_steward: "me_onboarding_nextStep_payPendingBody",
  },
  confirm: {
    provider: "me_onboarding_nextStep_confirmBody",
    region_steward: "me_onboarding_nextStep_confirmBody",
  },
  done: {
    provider: "me_onboarding_nextStep_doneBody",
    region_steward: "me_onboarding_nextStep_doneBody",
  },
};

const PHASE_CTA_KEYS: Partial<Record<OnboardingFlowPhase, string>> = {
  pay: "me_onboarding_nextStep_goPayment",
  pay_pending: "me_onboarding_nextStep_goPayment",
  confirm: "me_onboarding_nextStep_goConfirm",
};

/** 已登录且写操作区同页可见：压缩「当前建议」，避免与下方主按钮重复长文案 */
const LOGGED_IN_COMPACT_PHASES: OnboardingFlowPhase[] = ["pay", "pay_pending", "confirm"];

export function MeOnboardingNextStep({
  t,
  phase,
  quoteRole,
  loggedIn = false,
  sessionChecking = false,
  showWalletSessionHint = true,
  integrateWalletSession = false,
  guestQuotePreview = false,
  authReturnPath,
  writesSectionId,
}: {
  t: (key: string) => string;
  phase: OnboardingFlowPhase;
  quoteRole: OnboardingQuoteRole;
  loggedIn?: boolean;
  sessionChecking?: boolean;
  showWalletSessionHint?: boolean;
  /** 钱包已连：会话说明与登录 CTA 合并为单卡（无独立页顶横条） */
  integrateWalletSession?: boolean;
  /** 未登录合法来源 + 报价已就绪：压缩为「预览 · 登录继续」 */
  guestQuotePreview?: boolean;
  /** 登录/注册回跳（须与 SSR `useSearchParams` 同源，避免 hydration mismatch） */
  authReturnPath: string;
  writesSectionId?: string;
}) {
  if (sessionChecking) {
    return null;
  }

  const roleLabel =
    quoteRole === "region_steward" ? t("me_onboarding_roleSteward") : t("me_onboarding_roleProvider");
  const ctaKey = PHASE_CTA_KEYS[phase];
  const showLoginCta = !loggedIn && phase === "login";

  if (loggedIn && writesSectionId && LOGGED_IN_COMPACT_PHASES.includes(phase) && ctaKey) {
    return (
      <section
        className={TT_ME_ONBOARDING_L5.journeyBridge}
        aria-live="polite"
        data-tt-me-onboarding-next-step={`${phase}_compact`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-travel-700">
          {t("me_onboarding_nextStep_eyebrow")}
        </p>
        <p className="mt-1 text-small font-semibold text-ink-900">
          {t(PHASE_TITLE_KEYS[phase]).replace("{role}", roleLabel)}
        </p>
        <a
          href={`#${writesSectionId}`}
          className={`${TT_ME_ONBOARDING_L5.nextStepCta} ${TT_MARKETING_CONSOLE_LINK_FOCUS} mt-2 inline-flex rounded-[var(--radius-sm)] px-0.5 -mx-0.5`}
        >
          {t(ctaKey)}
        </a>
      </section>
    );
  }

  const bodyKey =
    showLoginCta && integrateWalletSession ? undefined : PHASE_BODY_BY_ROLE[phase]?.[quoteRole];
  const showAnchorCta = loggedIn && writesSectionId && ctaKey != null;
  const shellClass =
    showLoginCta && integrateWalletSession
      ? TT_ME_ONBOARDING_L5.nextStepShellIntegrated
      : TT_ME_ONBOARDING_L5.nextStepShell;
  const stepDataAttr =
    showLoginCta && integrateWalletSession ? "login_wallet_integrated" : phase;

  return (
    <section
      id={showLoginCta ? ME_ONBOARDING_LOGIN_CTA_ID : undefined}
      className={shellClass}
      aria-live="polite"
      data-tt-me-onboarding-next-step={stepDataAttr}
    >
      <p className={TT_ME_ONBOARDING_L5.nextStepEyebrow}>{t("me_onboarding_nextStep_eyebrow")}</p>
      {showLoginCta && integrateWalletSession ? (
        <p className="mt-2 text-small font-semibold text-travel-900" role="status">
          {t("me_onboarding_sessionBannerWalletTitle")}
        </p>
      ) : null}
      {showLoginCta && integrateWalletSession ? (
        <p className="mt-1 text-meta leading-relaxed text-ink-600">{t("me_onboarding_walletSessionHint")}</p>
      ) : null}
      <p className={`${TT_ME_ONBOARDING_L5.nextStepTitle} ${integrateWalletSession && showLoginCta ? "mt-2" : ""}`}>
        {guestQuotePreview && showLoginCta
          ? t("me_onboarding_nextStep_guestPreviewTitle")
          : t(PHASE_TITLE_KEYS[phase]).replace("{role}", roleLabel)}
      </p>
      {bodyKey ? <p className="mt-1 text-meta leading-relaxed text-ink-600">{t(bodyKey)}</p> : null}
      {showLoginCta && showWalletSessionHint ? (
        <p className="mt-2 text-meta leading-relaxed text-ink-500" role="note">
          {t("me_onboarding_walletSessionHint")}
        </p>
      ) : null}
      {showLoginCta ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={meOnboardingLoginHref(quoteRole, authReturnPath)}
            className={`${TT_ME_ONBOARDING_L5.gatePrimaryCta} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
          >
            {t("me_onboarding_goLogin")}
          </Link>
          <Link
            href={meOnboardingRegisterHref(quoteRole, authReturnPath)}
            className={`${TT_ME_ONBOARDING_L5.donePanelSecondaryCta} w-full no-underline sm:w-auto ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
          >
            {t("me_onboarding_writesRegisterCta")}
          </Link>
        </div>
      ) : null}
      {showAnchorCta ? (
        <a
          href={`#${writesSectionId}`}
          className={`${TT_ME_ONBOARDING_L5.nextStepCta} ${TT_MARKETING_CONSOLE_LINK_FOCUS} rounded-[var(--radius-sm)] px-0.5 -mx-0.5`}
        >
          {t(ctaKey)}
        </a>
      ) : null}
    </section>
  );
}
