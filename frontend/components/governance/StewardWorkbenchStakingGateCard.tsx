"use client";

import { FOCUS_RING } from "@/components/me/constants";
import type { StewardWorkbenchGateMode } from "@/lib/governance/stewardWorkbenchWorkspaceL5";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";
import { STEWARD_B_TRACK_ADMISSION_ANCHOR } from "@/lib/steward/stewardBTrackModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchStakingGateCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  mode: Exclude<StewardWorkbenchGateMode, "none" | "satisfied">;
  bTrackComplete: boolean;
  bTrackPaid: boolean;
  onOpenStakePanel?: () => void;
};

function scrollToAnchor(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** 主理人工作台顶区 · 双轨门闸（B 轨 USDC + A 轨 TTG · ① L5） */
export default function StewardWorkbenchStakingGateCard({
  t,
  mode,
  bTrackComplete,
  bTrackPaid,
  onOpenStakePanel,
}: StewardWorkbenchStakingGateCardProps) {
  const titleKey =
    mode === "need_onboarding"
      ? "steward_workbench_staking_gate_title_dual_track"
      : "steward_workbench_staking_gate_title_need_stake";
  const bodyKey =
    mode === "need_onboarding"
      ? "steward_workbench_staking_gate_body_dual_track"
      : "steward_workbench_staking_gate_body_need_stake";

  return (
    <div
      className="mb-4 rounded-xl border border-ref-sun/28 bg-gradient-to-br from-ref-sun/[0.08] via-[#0c0a09]/40 to-[#0a0a0a]/80 px-4 py-4 sm:px-5"
      data-tt-steward-workbench-staking-gate="1"
      data-tt-steward-workbench-staking-gate-mode={mode}
      role="region"
      aria-label={t("steward_workbench_stake_aria")}
    >
      <p className="text-small font-semibold text-slate-100">{t(titleKey)}</p>
      <p className="text-meta text-slate-400 mt-1.5 leading-relaxed" data-tt-steward-workbench-governance-collapsed="1">
        {t(bodyKey)} {t("steward_workbench_governance_locked_suffix")}
      </p>

      <div
        className="mt-3 flex flex-wrap gap-2"
        data-tt-steward-workbench-dual-track-status="1"
        aria-label={t("steward_workbench_dual_track_status_aria")}
      >
        <span
          className={`rounded-full border px-2.5 py-1 text-meta ${
            bTrackComplete
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
              : bTrackPaid
                ? "border-ref-sun/30 bg-ref-sun/10 text-ref-sun"
                : "border-amber-500/35 bg-amber-500/10 text-amber-100"
          }`}
        >
          {t("steward_workbench_dual_track_a_label")}:{" "}
          {bTrackComplete
            ? t("steward_workbench_b_track_status_complete")
            : bTrackPaid
              ? t("steward_workbench_b_track_status_paid_pending_confirm")
              : t("steward_workbench_b_track_status_pending")}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-meta ${
            mode === "need_stake"
              ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
              : mode === "need_onboarding"
                ? "border-cyan-500/35 bg-cyan-500/10 text-cyan-200/90"
                : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {t("steward_workbench_dual_track_b_label")}:{" "}
          {mode === "need_stake"
            ? t("steward_workbench_dual_track_b_pending")
            : t("steward_workbench_dual_track_b_optional_parallel")}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {!bTrackComplete ? (
          <button
            type="button"
            className={`${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] w-full justify-center ${FOCUS_RING}`}
            data-tt-steward-workbench-staking-gate-b-track="1"
            onClick={() => scrollToAnchor(STEWARD_B_TRACK_ADMISSION_ANCHOR)}
          >
            {t("steward_workbench_staking_gate_cta_b_track")}
          </button>
        ) : null}
        <button
          type="button"
          className={`${mode === "need_stake" && bTrackComplete ? TT_WORKSPACE_L5.primaryBtn : TT_WORKSPACE_L5.secondaryBtn} min-h-[44px] w-full justify-center ${FOCUS_RING}`}
          data-tt-steward-workbench-staking-gate-stake-anchor="1"
          onClick={() => {
            onOpenStakePanel?.();
            scrollToAnchor(STEWARD_WORKBENCH_STAKE_ANCHOR);
          }}
        >
          {t("steward_workbench_staking_gate_cta_stake_section")}
        </button>
      </div>
    </div>
  );
}
