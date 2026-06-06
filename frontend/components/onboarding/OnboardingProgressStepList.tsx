import { OnboardingStepIndexBadge } from "@/components/onboarding/OnboardingStepIndexBadge";
import {
  onboardingProgressConnectorClass,
  type OnboardingStepBadgeState,
} from "@/lib/onboarding/onboardingStepIndex";

export type OnboardingProgressStepItem = {
  id: string;
  step: number;
  label: string;
  state: OnboardingStepBadgeState;
};

export type OnboardingProgressStepListProps = {
  steps: OnboardingProgressStepItem[];
  variant: "auth" | "console";
  /** 返回 li 上除 connector/badge 外的文字样式 */
  textClassName: (state: OnboardingStepBadgeState) => string;
  className?: string;
};

/** L5 进度步列表 · 徽章 + 竖向连接线 */
export function OnboardingProgressStepList({
  steps,
  variant,
  textClassName,
  className = "",
}: OnboardingProgressStepListProps) {
  return (
    <ol className={`flex flex-col text-meta ${className}`} data-tt-onboarding-progress-steps="1">
      {steps.map((item, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li
            key={item.id}
            className={`flex items-center gap-2.5 ${textClassName(item.state)}`}
            aria-current={item.state === "active" ? "step" : undefined}
          >
            <div className="flex flex-col items-center self-stretch">
              <OnboardingStepIndexBadge step={item.step} state={item.state} variant={variant} />
              {!isLast ? (
                <span
                  aria-hidden
                  className={onboardingProgressConnectorClass(item.state === "done", variant)}
                />
              ) : null}
            </div>
            <span className={`min-w-0 flex-1 leading-snug ${isLast ? "pt-0.5" : "pb-1 pt-0.5"}`}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
