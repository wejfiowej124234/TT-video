"use client";

import { useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { OnboardingProgressCompactRail } from "@/components/onboarding/OnboardingProgressCompactRail";
import { OnboardingProgressHeadingRow } from "@/components/onboarding/OnboardingProgressHeadingRow";
import { OnboardingProgressStepList } from "@/components/onboarding/OnboardingProgressStepList";
import type { OnboardingStepBadgeState } from "@/lib/onboarding/onboardingStepIndex";
import { TT_AUTH_ONBOARDING_PROGRESS } from "@/lib/onboarding/onboardingProgressChrome";

const STEPS = [
  { key: "stewardProgress_step1", n: 1 },
  { key: "stewardProgress_step2", n: 2 },
  { key: "stewardProgress_step3", n: 3 },
] as const;

export type StewardOnboardingProgressProps = {
  currentStep: 1 | 2 | 3;
  className?: string;
  showHeading?: boolean;
  variant?: "full" | "compact";
  wizardStep?: 1 | 2 | 3;
  defaultExpanded?: boolean;
};

function stewardStepTextClass(state: OnboardingStepBadgeState): string {
  if (state === "active") return "font-semibold text-ref-sun";
  if (state === "done") return "font-medium text-slate-300/95";
  return "text-slate-500";
}

export function StewardOnboardingProgress({
  currentStep,
  className = "",
  showHeading = true,
  variant = "full",
  wizardStep,
  defaultExpanded,
}: StewardOnboardingProgressProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded ?? variant !== "compact");
  const panelId = useId();
  const current = STEPS[currentStep - 1];
  const compactSummary = t("stewardProgress_compact")
    .replace("{current}", String(currentStep))
    .replace("{total}", "3")
    .replace("{label}", t(current.key));
  const journeyLabel = t(current.key);
  const dualStepHint =
    wizardStep != null
      ? t("stewardProgress_dualStepHint")
          .replace("{journey}", String(currentStep))
          .replace("{jTotal}", "3")
          .replace("{journeyLabel}", journeyLabel)
          .replace("{step}", String(wizardStep))
          .replace("{sTotal}", "3")
      : null;
  const showLoginDoneNote = wizardStep === 1 && currentStep === 2;

  const stepItems = STEPS.map(({ key, n }) => {
    const done = n < currentStep;
    const active = n === currentStep;
    return {
      id: key,
      step: n,
      label: t(key),
      state: (done ? "done" : active ? "active" : "pending") as OnboardingStepBadgeState,
    };
  });

  return (
    <nav
      className={`${TT_AUTH_ONBOARDING_PROGRESS.shell} ${className}`}
      aria-label={t("stewardProgress_aria")}
      data-tt-steward-onboarding-progress="1"
      data-tt-steward-onboarding-progress-variant={variant}
      data-tt-steward-onboarding-wizard-step={wizardStep != null ? String(wizardStep) : undefined}
    >
      {showHeading ? (
        <OnboardingProgressHeadingRow
          title={t("stewardProgress_journeyHeading")}
          variant="auth"
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          expandLabel={t("stewardProgress_expand")}
          collapseLabel={t("stewardProgress_collapse")}
          showToggle={variant === "compact"}
          controlsId={panelId}
        />
      ) : null}
      {variant === "compact" && !expanded ? (
        <div id={panelId} className="space-y-2">
          <OnboardingProgressCompactRail
            steps={stepItems.map(({ id, step, state }) => ({ id, step, state }))}
            variant="auth"
          />
          <p className="text-meta leading-snug text-slate-300">{dualStepHint ?? compactSummary}</p>
          {showLoginDoneNote ? (
            <p className="text-meta leading-snug text-slate-400" data-tt-steward-journey-login-done-note="1">
              {t("stewardProgress_journeyLoginDoneNote")}
            </p>
          ) : null}
        </div>
      ) : (
        <div id={panelId}>
          <OnboardingProgressStepList
            steps={stepItems}
            variant="auth"
            textClassName={stewardStepTextClass}
          />
        </div>
      )}
    </nav>
  );
}
