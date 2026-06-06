"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { OnboardingProgressCompactRail } from "@/components/onboarding/OnboardingProgressCompactRail";
import { OnboardingProgressHeadingRow } from "@/components/onboarding/OnboardingProgressHeadingRow";
import { OnboardingProgressStepList } from "@/components/onboarding/OnboardingProgressStepList";
import type { OnboardingStepBadgeState } from "@/lib/onboarding/onboardingStepIndex";
import { TT_AUTH_ONBOARDING_PROGRESS } from "@/lib/onboarding/onboardingProgressChrome";

const STEPS = [
  { key: "providerProgress_step1", n: 1 },
  { key: "providerProgress_step2", n: 2 },
  { key: "providerProgress_step3", n: 3 },
  { key: "providerProgress_step4", n: 4 },
  { key: "providerProgress_step5", n: 5 },
] as const;

export type ProviderOnboardingProgressProps = {
  currentStep: 1 | 2 | 3 | 4 | 5;
  className?: string;
  showHeading?: boolean;
  variant?: "full" | "compact";
  defaultExpanded?: boolean;
};

function providerStepTextClass(state: OnboardingStepBadgeState): string {
  if (state === "active") return "font-semibold text-ref-sun";
  if (state === "done") return "font-medium text-slate-300/95";
  return "text-slate-500";
}

export function ProviderOnboardingProgress({
  currentStep,
  className = "",
  showHeading = true,
  variant = "full",
  defaultExpanded,
}: ProviderOnboardingProgressProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded ?? variant !== "compact");
  const panelId = useId();
  const current = STEPS[currentStep - 1];
  const compactSummary = t("providerProgress_compact")
    .replace("{current}", String(currentStep))
    .replace("{total}", "5")
    .replace("{label}", t(current.key));

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
      aria-label={t("providerProgress_aria")}
      data-tt-provider-onboarding-progress="1"
      data-tt-provider-onboarding-progress-variant={variant}
    >
      {showHeading ? (
        <OnboardingProgressHeadingRow
          title={t("providerProgress_journeyHeading")}
          variant="auth"
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          expandLabel={t("providerProgress_expand")}
          collapseLabel={t("providerProgress_collapse")}
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
          <p className="text-meta leading-snug text-slate-300">{compactSummary}</p>
        </div>
      ) : (
        <div id={panelId}>
          <OnboardingProgressStepList steps={stepItems} variant="auth" textClassName={providerStepTextClass} />
        </div>
      )}
    </nav>
  );
}
