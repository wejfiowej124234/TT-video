import { Fragment } from "react";
import { OnboardingStepIndexBadge } from "@/components/onboarding/OnboardingStepIndexBadge";
import {
  onboardingProgressConnectorHorizontalClass,
  type OnboardingStepBadgeState,
} from "@/lib/onboarding/onboardingStepIndex";

export type OnboardingProgressCompactStep = {
  id: string;
  step: number;
  state: OnboardingStepBadgeState;
};

/** 折叠态 · ①②③ 迷你徽章横排（避免只剩文字看不见步骤） */
export function OnboardingProgressCompactRail({
  steps,
  variant,
  className = "",
}: {
  steps: OnboardingProgressCompactStep[];
  variant: "auth" | "console";
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      data-tt-onboarding-progress-compact-rail="1"
      aria-hidden
    >
      {steps.map((item, index) => {
        const isLast = index === steps.length - 1;
        return (
          <Fragment key={item.id}>
            <OnboardingStepIndexBadge step={item.step} state={item.state} variant={variant} size="sm" />
            {!isLast ? (
              <span
                aria-hidden
                className={onboardingProgressConnectorHorizontalClass(item.state === "done", variant)}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
