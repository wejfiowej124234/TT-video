"use client";

import { Fragment } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { OnboardingStepIndexBadge } from "@/components/onboarding/OnboardingStepIndexBadge";
import {
  onboardingProgressConnectorHorizontalClass,
  type OnboardingStepBadgeState,
} from "@/lib/onboarding/onboardingStepIndex";

const WIZARD_STEPS = [
  { key: "stewardRegister_wizardNav1", n: 1 },
  { key: "stewardRegister_wizardNav2", n: 2 },
  { key: "stewardRegister_wizardNav3", n: 3 },
] as const;

export type StewardRegisterWizardProgressProps = {
  currentStep: 1 | 2 | 3;
  className?: string;
};

/** 本页 3 步 wizard（与全链路 `StewardOnboardingProgress` 分层，避免「第 1 步 vs 第 2 步」歧义） */
export function StewardRegisterWizardProgress({ currentStep, className = "" }: StewardRegisterWizardProgressProps) {
  const { t } = useTranslation();
  return (
    <nav
      className={`rounded-[var(--radius-sm)] border border-ref-sun/15 bg-[#14100d]/50 px-3 py-3 ${className}`}
      aria-label={t("stewardRegister_wizardAria")}
      data-tt-steward-register-wizard-progress="1"
    >
      <ol className="flex items-center gap-1 sm:gap-1.5">
        {WIZARD_STEPS.map(({ key, n }, index) => {
          const done = n < currentStep;
          const active = n === currentStep;
          const state = (done ? "done" : active ? "active" : "pending") as OnboardingStepBadgeState;
          const isLast = index === WIZARD_STEPS.length - 1;
          return (
            <Fragment key={key}>
              <li
                className={`flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 text-meta ${
                  active
                    ? "border-ref-sun/50 bg-ref-sun/10 font-semibold text-ref-sun"
                    : done
                      ? "border-ref-sun/35 bg-ref-sun/[0.07] text-slate-200"
                      : "border-slate-600/40 text-slate-500"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <OnboardingStepIndexBadge step={n} state={state} variant="auth" />
                <span className="min-w-0 flex-1 leading-tight">{t(key)}</span>
              </li>
              {!isLast ? (
                <span
                  aria-hidden
                  className={onboardingProgressConnectorHorizontalClass(done, "auth")}
                />
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
