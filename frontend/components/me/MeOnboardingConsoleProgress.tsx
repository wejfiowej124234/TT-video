"use client";

import { useId, useState } from "react";
import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { useTranslation } from "@/components/LocaleProvider";
import { OnboardingProgressCompactRail } from "@/components/onboarding/OnboardingProgressCompactRail";
import { OnboardingProgressHeadingRow } from "@/components/onboarding/OnboardingProgressHeadingRow";
import { OnboardingProgressStepList } from "@/components/onboarding/OnboardingProgressStepList";
import {
  onboardingProgressStepCount,
  onboardingProgressStepKey,
} from "@/lib/me/meOnboardingViewModel";
import type { OnboardingStepBadgeState } from "@/lib/onboarding/onboardingStepIndex";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

export type MeOnboardingConsoleProgressProps = {
  role: OnboardingQuoteRole;
  currentStep: number;
  className?: string;
  defaultExpanded?: boolean;
  allComplete?: boolean;
  sessionChecking?: boolean;
  /** 未登录合法来源：进度文案为「预览报价 · 登录后继续」 */
  guestQuotePreview?: boolean;
};

function consoleStepTextClass(state: OnboardingStepBadgeState): string {
  if (state === "active") return "font-semibold text-travel-900";
  if (state === "done") return "font-medium text-ink-800";
  return "text-ink-400";
}

export function MeOnboardingConsoleProgress({
  role,
  currentStep,
  className = "",
  defaultExpanded = true,
  allComplete = false,
  sessionChecking = false,
  guestQuotePreview = false,
}: MeOnboardingConsoleProgressProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const total = onboardingProgressStepCount(role);
  const clamped = Math.min(Math.max(currentStep, 1), total);
  const currentKey = onboardingProgressStepKey(role, clamped);
  const journeyHeading =
    role === "region_steward" ? t("stewardProgress_journeyHeading") : t("providerProgress_journeyHeading");
  const compact = sessionChecking
    ? t("me_onboarding_progressSessionChecking")
    : guestQuotePreview
      ? t("me_onboarding_progressGuestPreview")
      : allComplete
      ? t("me_onboarding_progressPhaseComplete")
      : t("me_onboarding_progressCompact")
          .replace("{current}", String(clamped))
          .replace("{total}", String(total))
          .replace("{label}", t(currentKey));

  const stepItems = Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const done = allComplete || n < clamped;
    const active = !allComplete && n === clamped;
    const key = onboardingProgressStepKey(role, n);
    return {
      id: key,
      step: n,
      label: t(key),
      state: (done ? "done" : active ? "active" : "pending") as OnboardingStepBadgeState,
    };
  });

  return (
    <nav
      className={`${TT_ME_ONBOARDING_L5.progressShell} ${className}`}
      aria-label={t(role === "region_steward" ? "stewardProgress_aria" : "providerProgress_aria")}
      data-tt-me-onboarding-progress="1"
      data-tt-me-onboarding-progress-role={role}
      data-tt-me-onboarding-progress-step={String(clamped)}
    >
      <OnboardingProgressHeadingRow
        title={journeyHeading}
        variant="console"
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        expandLabel={t("stewardProgress_expand")}
        collapseLabel={t("stewardProgress_collapse")}
        showToggle
        controlsId={panelId}
      />
      {expanded ? (
        <div id={panelId} className="mt-3">
          <OnboardingProgressStepList
            steps={stepItems}
            variant="console"
            textClassName={consoleStepTextClass}
          />
        </div>
      ) : (
        <div id={panelId} className="mt-3 space-y-2">
          <OnboardingProgressCompactRail
            steps={stepItems.map(({ id, step, state }) => ({ id, step, state }))}
            variant="console"
          />
          <p className="text-small font-medium leading-snug text-ink-800">{compact}</p>
        </div>
      )}
    </nav>
  );
}
