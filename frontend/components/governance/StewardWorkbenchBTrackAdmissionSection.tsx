"use client";

import { useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";
import {
  onboardingWriteRateLimited,
  onboardingWriteRetryable,
} from "@/app/me/onboarding/meOnboardingPageHelpers";
import {
  STEWARD_B_TRACK_ADMISSION_ANCHOR,
  STEWARD_A_TRACK_CONFIRM_ANCHOR,
  STEWARD_A_TRACK_PAYMENT_ANCHOR,
} from "@/lib/steward/stewardBTrackModel";
import type { useStewardOnboardingBTrack } from "@/lib/steward/useStewardOnboardingBTrack";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchBTrackAdmissionSectionProps = {
  bTrack: ReturnType<typeof useStewardOnboardingBTrack>;
  /** 顶栏进度条已展示状态时，去掉重复 badge / 说明 / 步骤摘要 */
  slimCompanion?: boolean;
  primaryJurisdiction?: string | null;
};

/**
 * Steward workbench · Track A admission honesty (V65-PROD-003 · G088).
 *
 * Owner REMOVE: TT ledger USDC admission fee is retired. Private steward wallet
 * transfer is off-platform and ≠ TravelTrust finance income. Role confirm is
 * not gated on TT `hasActivePaid`.
 */
export default function StewardWorkbenchBTrackAdmissionSection({
  bTrack,
  slimCompanion = false,
}: StewardWorkbenchBTrackAdmissionSectionProps) {
  const sectionId = useId();
  const {
    t,
    loading,
    bTrackComplete,
    roleConfirmed,
    roleLoading,
    roleErr,
    roleErrCode,
    onRequestRoleConfirm,
    roleRetrySecsLeft,
  } = bTrack;

  const showConfirm = !bTrackComplete && !roleConfirmed;
  const canConfirmRole = showConfirm;

  return (
    <section
      id={STEWARD_B_TRACK_ADMISSION_ANCHOR}
      className={`${TT_WORKSPACE_L5.sectionCard} scroll-mt-24`}
      aria-labelledby={sectionId}
      data-tt-steward-workbench-b-track="1"
      data-tt-steward-workbench-b-track-complete={bTrackComplete ? "1" : "0"}
      data-tt-steward-workbench-b-track-slim={slimCompanion ? "1" : "0"}
      data-tt-steward-workbench-b-track-fee-removed="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-meta uppercase tracking-wider text-ref-sun/70">
            {t("steward_workbench_b_track_label")}
          </p>
          <h2 id={sectionId} className={TT_WORKSPACE_L5.sectionTitle}>
            {t("steward_workbench_b_track_title")}
          </h2>
          {!slimCompanion ? (
            <p className={`mt-2 ${TT_WORKSPACE_L5.sectionSubtitle}`}>
              {t("steward_workbench_b_track_subtitle")}
            </p>
          ) : null}
        </div>
        {!slimCompanion ? (
          bTrackComplete ? (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-meta font-medium text-emerald-200">
              {t("steward_workbench_b_track_status_complete")}
            </span>
          ) : (
            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-meta font-medium text-amber-100">
              {t("steward_workbench_b_track_status_pending")}
            </span>
          )
        ) : null}
      </div>

      <div
        id={STEWARD_A_TRACK_PAYMENT_ANCHOR}
        className="mt-4 scroll-mt-28 rounded-xl border border-ref-sun/15 bg-ref-sun/[0.04] p-3 text-meta leading-relaxed text-slate-400"
        role="note"
        data-tt-steward-workbench-dual-track-disclosure="1"
        data-tt-steward-workbench-private-transfer-honesty="1"
      >
        <p className="font-semibold text-slate-200">{t("steward_workbench_b_track_honesty_title")}</p>
        <p className="mt-1">{t("steward_workbench_b_track_disclosure_body")}</p>
        <p className="mt-2">{t("steward_workbench_b_track_honesty_body")}</p>
      </div>

      {loading && !bTrackComplete ? (
        <p className={`mt-4 ${TT_WORKSPACE_L5.sectionSubtitle}`} aria-busy="true">
          {t("common_loading")}
        </p>
      ) : null}

      {!bTrackComplete ? (
        <div className="mt-4 space-y-4" data-tt-steward-workbench-b-track-writes="1">
          {showConfirm ? (
            <div
              id={STEWARD_A_TRACK_CONFIRM_ANCHOR}
              className="scroll-mt-28 rounded-xl border border-ref-sun/28 bg-ref-sun/[0.05] p-4 ring-1 ring-ref-sun/15"
              data-tt-steward-workbench-b-track-stage="confirm"
            >
              <h3 className="text-small font-semibold text-ref-sun/90">
                {t("steward_workbench_b_track_step_confirm_title")}
              </h3>
              <p className="mt-2 text-meta text-slate-400">{t("steward_workbench_b_track_confirm_hint")}</p>
              <button
                type="button"
                className={`${canConfirmRole ? TT_WORKSPACE_L5.primaryBtn : TT_WORKSPACE_L5.secondaryBtn} mt-4 min-h-[44px] w-full sm:w-auto ${FOCUS_RING}`}
                aria-busy={roleLoading}
                disabled={roleLoading || !canConfirmRole}
                onClick={() => void onRequestRoleConfirm()}
                data-testid="steward-workbench-b-track-role-confirm"
              >
                {roleLoading ? t("common_loading") : t("me_onboarding_requestRoleConfirm")}
              </button>
              {roleErr ? (
                <p className="mt-3 text-small text-danger" role="alert">
                  {roleErr}
                  {onboardingWriteRetryable(roleErrCode) && roleRetrySecsLeft != null && roleRetrySecsLeft > 0
                    ? ` (${roleRetrySecsLeft}s)`
                    : ""}
                  {onboardingWriteRateLimited(roleErrCode) ? "" : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
