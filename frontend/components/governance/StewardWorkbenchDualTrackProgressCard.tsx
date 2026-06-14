"use client";

import { FOCUS_RING } from "@/components/me/constants";
import type { StewardWorkbenchGateMode } from "@/lib/governance/stewardWorkbenchWorkspaceL5";
import {
  resolveStewardDualTrackSteps,
  type StewardDualTrackStepView,
  type StewardDualTrackStepVisual,
} from "@/lib/governance/stewardWorkbenchDualTrackProgressModel";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";
import {
  STEWARD_A_TRACK_CONFIRM_ANCHOR,
  STEWARD_A_TRACK_PAYMENT_ANCHOR,
} from "@/lib/steward/stewardBTrackModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchDualTrackProgressCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  gateMode: Exclude<StewardWorkbenchGateMode, "none" | "satisfied">;
  bTrackPaid: boolean;
  bTrackComplete: boolean;
  chainStakeSummaryKey: string;
  onOpenStakePanel?: () => void;
};

function scrollToAnchor(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stepCircleClass(visual: StewardDualTrackStepVisual): string {
  if (visual === "complete") {
    return "border-emerald-500/45 bg-emerald-500/15 text-emerald-200";
  }
  if (visual === "current") {
    return "border-ref-sun/50 bg-ref-sun/15 text-ref-sun";
  }
  if (visual === "parallel") {
    return "border-cyan-500/35 bg-cyan-500/10 text-cyan-200/90";
  }
  return "border-slate-600/45 bg-slate-800/35 text-slate-500";
}

function StepNode({
  step,
  t,
  isLast,
  admissionComplete,
}: {
  step: StewardDualTrackStepView;
  t: StewardWorkbenchDualTrackProgressCardProps["t"];
  isLast: boolean;
  admissionComplete: boolean;
}) {
  /** B 轨在 A 轨未完成时不可点击跳转，避免误跳到 TTG 质押 */
  const clickable =
    step.visual !== "complete" && !(step.id === "b_stake" && !admissionComplete);
  const statusKey =
    step.visual === "complete"
      ? "steward_workbench_dual_track_step_status_complete"
      : step.visual === "current"
        ? "steward_workbench_dual_track_step_status_current"
        : step.visual === "parallel"
          ? step.id === "b_stake" && !admissionComplete
            ? "steward_workbench_dual_track_step_status_a_first"
            : "steward_workbench_dual_track_step_status_parallel"
          : "steward_workbench_dual_track_step_status_pending";

  return (
    <li className="flex min-w-0 flex-1 items-stretch gap-1.5 sm:gap-2">
      <button
        type="button"
        className={`flex min-h-[44px] w-full flex-col justify-center rounded-xl border px-3 py-2 text-left motion-sub motion-reduce:transition-none ${stepCircleClass(step.visual)} ${
          clickable ? "cursor-pointer hover:border-ref-sun/55 hover:bg-ref-sun/[0.12]" : "cursor-default"
        } ${FOCUS_RING}`}
        onClick={() => {
          if (clickable) scrollToAnchor(step.anchorId);
        }}
        disabled={!clickable}
        data-tt-steward-dual-track-step={step.id}
        data-tt-steward-dual-track-step-visual={step.visual}
        aria-current={step.visual === "current" ? "step" : undefined}
      >
        <span className="text-meta font-semibold leading-snug">{t(step.labelKey)}</span>
        <span className="mt-0.5 text-meta leading-snug opacity-80">{t(statusKey)}</span>
      </button>
      {!isLast ? (
        <span className="hidden shrink-0 self-center text-slate-600 sm:inline" aria-hidden="true">
          →
        </span>
      ) : null}
    </li>
  );
}

/** 主理人工作台 · 双轨唯一顶栏（替代门闸卡 + 重复状态 pill · ① L5） */
export default function StewardWorkbenchDualTrackProgressCard({
  t,
  gateMode,
  bTrackPaid,
  bTrackComplete,
  chainStakeSummaryKey,
  onOpenStakePanel,
}: StewardWorkbenchDualTrackProgressCardProps) {
  const steps = resolveStewardDualTrackSteps({
    admissionPaid: bTrackPaid,
    admissionComplete: bTrackComplete,
    chainStakeSummaryKey,
  });
  const showStakePrimaryCta = gateMode === "need_stake" && bTrackComplete;
  const aPrimaryAnchor = !bTrackPaid
    ? STEWARD_A_TRACK_PAYMENT_ANCHOR
    : !bTrackComplete
      ? STEWARD_A_TRACK_CONFIRM_ANCHOR
      : null;
  const aPrimaryLabelKey = !bTrackPaid
    ? "steward_workbench_a_track_cta_pay_usdc"
    : !bTrackComplete
      ? "steward_workbench_a_track_cta_confirm_identity"
      : null;

  return (
    <section
      className={`${TT_WORKSPACE_L5.nextOrderCard} mb-1 scroll-mt-24`}
      aria-label={t("steward_workbench_dual_track_progress_aria")}
      data-tt-steward-workbench-dual-track-progress="1"
      data-tt-steward-workbench-staking-gate="1"
      data-tt-steward-workbench-staking-gate-mode={gateMode}
    >
      <p className="text-meta leading-relaxed text-slate-400">
        {t("steward_workbench_dual_track_progress_subtitle")}{" "}
        <span className="text-slate-500">{t("steward_workbench_governance_locked_suffix")}</span>
      </p>
      <ol
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch"
        data-tt-steward-dual-track-stepper="1"
      >
        {steps.map((step, index) => (
          <StepNode
            key={step.id}
            step={step}
            t={t}
            isLast={index === steps.length - 1}
            admissionComplete={bTrackComplete}
          />
        ))}
      </ol>
      {!bTrackComplete && aPrimaryAnchor && aPrimaryLabelKey ? (
        <button
          type="button"
          className={`${TT_WORKSPACE_L5.primaryBtn} mt-4 min-h-[44px] w-full justify-center sm:w-auto ${FOCUS_RING}`}
          data-tt-steward-workbench-a-track-primary-cta="1"
          onClick={() => scrollToAnchor(aPrimaryAnchor)}
        >
          {t(aPrimaryLabelKey)}
        </button>
      ) : null}
      {!bTrackComplete && bTrackPaid ? (
        <p className="mt-3 text-meta leading-relaxed text-slate-400" role="note">
          {t("steward_workbench_a_track_pay_done_where_hint")}
        </p>
      ) : null}
      {showStakePrimaryCta ? (
        <button
          type="button"
          className={`${TT_WORKSPACE_L5.primaryBtn} mt-4 min-h-[44px] w-full justify-center sm:w-auto ${FOCUS_RING}`}
          data-tt-steward-workbench-staking-gate-stake-anchor="1"
          onClick={() => {
            onOpenStakePanel?.();
            scrollToAnchor(STEWARD_WORKBENCH_STAKE_ANCHOR);
          }}
        >
          {t("steward_workbench_staking_gate_cta_stake_section")}
        </button>
      ) : null}
      <p className="sr-only" data-tt-steward-workbench-dual-track-disclosure="1">
        {t("me_onboarding_stewardFeeClarifyTitle")}. {t("steward_workbench_b_track_disclosure_body")}
      </p>
    </section>
  );
}
