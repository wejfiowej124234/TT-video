import type { ReactNode } from "react";
import { Fragment } from "react";
import { OnboardingStepIndexBadge } from "@/components/onboarding/OnboardingStepIndexBadge";
import {
  onboardingProgressConnectorClass,
  type OnboardingStepBadgeState,
} from "@/lib/onboarding/onboardingStepIndex";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

export type MeOnboardingWriteStageBlock = {
  step: 1 | 2;
  state: OnboardingStepBadgeState;
  title: string;
  hint?: string;
  shellClass: string;
  dataStage: "payment" | "confirm";
  children: ReactNode;
};

/** 写入区 ①—② 左轨竖线 + 右栏分阶段内容 */
export function MeOnboardingWritesStageRail({ stages }: { stages: MeOnboardingWriteStageBlock[] }) {
  if (stages.length === 0) return null;

  const showConnector = stages.length > 1;

  return (
    <div
      className={TT_ME_ONBOARDING_L5.writeStagesRail}
      data-tt-me-onboarding-write-stages-rail="1"
    >
      <div className="flex w-9 shrink-0 flex-col items-center self-stretch pt-1">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          return (
            <Fragment key={stage.dataStage}>
              <OnboardingStepIndexBadge step={stage.step} state={stage.state} variant="console" size="md" />
              {!isLast && showConnector ? (
                <span
                  aria-hidden
                  className={`${onboardingProgressConnectorClass(stage.state === "done", "console")} min-h-[1.75rem] flex-1`}
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
      <div className={TT_ME_ONBOARDING_L5.writeStagesContent}>
        {stages.map((stage) => (
          <div
            key={stage.dataStage}
            className={stage.shellClass}
            data-tt-me-onboarding-write-stage={stage.dataStage}
          >
            <div className="min-w-0">
              <h3 className={TT_ME_ONBOARDING_L5.writeStageTitle}>{stage.title}</h3>
              {stage.hint ? <p className={TT_ME_ONBOARDING_L5.writeStageHint}>{stage.hint}</p> : null}
            </div>
            <div className="mt-3 space-y-3">{stage.children}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
