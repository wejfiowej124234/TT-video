import {
  onboardingCircledStep,
  onboardingStepBadgeClass,
  onboardingStepBadgeLabel,
  type OnboardingStepBadgeState,
} from "@/lib/onboarding/onboardingStepIndex";

export type OnboardingStepIndexBadgeProps = {
  step: number;
  state: OnboardingStepBadgeState;
  variant?: "auth" | "console";
  size?: "sm" | "md";
  className?: string;
};

/** L5 步骤徽章：圆形容器 + 阿拉伯数字（完成/当前/待办三色实心区分） */
export function OnboardingStepIndexBadge({
  step,
  state,
  variant = "auth",
  size = "sm",
  className = "",
}: OnboardingStepIndexBadgeProps) {
  return (
    <span
      className={`${onboardingStepBadgeClass(state, variant, size)} ${className}`}
      aria-label={state === "done" ? `已完成 ${onboardingCircledStep(step)}` : `${onboardingCircledStep(step)}`}
      data-tt-onboarding-step-badge={state}
      data-tt-onboarding-step-index={step}
    >
      {onboardingStepBadgeLabel(step, state)}
    </span>
  );
}
