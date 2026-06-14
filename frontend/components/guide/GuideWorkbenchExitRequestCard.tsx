"use client";

import { useCallback, useEffect, useState } from "react";

import { FOCUS_RING } from "@/components/me/constants";
import {
  canSubmitGuideExitRequest,
  isGuideExitedStatus,
  isGuideExitingStatus,
  type GuideExitStatusPayload,
} from "@/lib/guide/guideExitRequest";
import {
  getMeGuideExitStatus,
  GuideExitEndpointUnavailableError,
  postMeGuideExitRequest,
} from "@/lib/apiClient/meGuideExit";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export type GuideWorkbenchExitRequestCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  guideRegistrationStatus: string | null | undefined;
};

export default function GuideWorkbenchExitRequestCard({
  t,
  guideRegistrationStatus,
}: GuideWorkbenchExitRequestCardProps) {
  const [exitStatus, setExitStatus] = useState<GuideExitStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      const res = await getMeGuideExitStatus();
      setExitStatus(res.exit ?? null);
    } catch (err) {
      if (err instanceof GuideExitEndpointUnavailableError) {
        setErrorKey("guide_workbench_exit_api_stale");
        setExitStatus({
          guide_status: guideRegistrationStatus ?? undefined,
          exit_request: null,
        });
      } else if (err instanceof Error && err.message === "guide_profile_not_found") {
        setErrorKey("guide_workbench_exit_no_profile");
        setExitStatus(null);
      } else {
        setErrorKey("guide_workbench_exit_load_failed");
      }
    } finally {
      setLoading(false);
    }
  }, [guideRegistrationStatus]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const exiting =
    isGuideExitingStatus(guideRegistrationStatus) ||
    exitStatus?.guide_status === "exiting" ||
    exitStatus?.exit_request?.status === "pending";
  const exited =
    isGuideExitedStatus(guideRegistrationStatus) || exitStatus?.guide_status === "exited";
  const canSubmit = canSubmitGuideExitRequest(guideRegistrationStatus) && !exiting && !exited;

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      const res = await postMeGuideExitRequest(
        reason.trim() ? { reason: reason.trim() } : undefined,
      );
      setExitStatus(res.exit ?? null);
      setReason("");
    } catch (err) {
      if (err instanceof GuideExitEndpointUnavailableError) {
        setErrorKey("guide_workbench_exit_api_stale");
      } else {
        setErrorKey("guide_workbench_exit_submit_failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorBlock = errorKey ? (
    <p className="mt-2 text-meta text-danger/90" role="alert" data-tt-guide-workbench-exit-error="1">
      {t(errorKey)}
    </p>
  ) : null;

  if (loading) {
    return (
      <div
        className="mb-4 rounded-[var(--radius-md)] border border-slate-600/30 bg-slate-900/40 px-4 py-3 text-meta text-slate-400"
        aria-busy="true"
        data-tt-guide-workbench-exit-card="loading"
      >
        {t("guide_workbench_exit_loading")}
      </div>
    );
  }

  if (exited || exiting) {
    return (
      <div
        className="mb-4 rounded-[var(--radius-md)] border border-amber-500/25 bg-amber-950/20 px-4 py-3"
        data-tt-guide-workbench-exit-card="active"
        role="alert"
        aria-label={t("guide_workbench_exit_region_label")}
      >
        <h3 className="text-small font-semibold text-amber-100/95">{t("guide_workbench_exit_title")}</h3>
        {exited ? (
          <p className="mt-2 text-meta text-slate-300" data-tt-guide-workbench-exit-state="exited">
            {t("guide_workbench_exit_exited_note")}
          </p>
        ) : (
          <p className="mt-2 text-meta text-slate-300" data-tt-guide-workbench-exit-state="pending">
            {t("guide_workbench_exit_pending_note")}
          </p>
        )}
        {errorBlock}
      </div>
    );
  }

  return (
    <details
      className={`${TT_STAKING_PAGE_L5.registryDetails} mb-4`}
      data-tt-guide-workbench-exit-card="collapsible"
    >
      <summary className={`${TT_STAKING_PAGE_L5.registrySummary} cursor-pointer`}>
        {t("guide_workbench_exit_collapsed_summary")}
      </summary>
      <div
        className="mt-3 rounded-[var(--radius-md)] border border-amber-500/20 bg-amber-950/15 px-4 py-3"
        role="region"
        aria-label={t("guide_workbench_exit_region_label")}
      >
        <h3 className="text-small font-semibold text-amber-100/95">{t("guide_workbench_exit_title")}</h3>
        <p className="mt-2 text-meta text-slate-400">{t("guide_workbench_exit_intro")}</p>
        <p className="mt-1 text-meta text-slate-500">{t("guide_workbench_exit_phase1_disclaimer")}</p>
        <label className="mt-3 block text-meta text-slate-400" htmlFor="guide-workbench-exit-reason">
          {t("guide_workbench_exit_reason_label")}
        </label>
        <textarea
          id="guide-workbench-exit-reason"
          className={`mt-1 w-full rounded-md border border-slate-600/40 bg-slate-950/50 px-3 py-2 text-body text-slate-200 ${FOCUS_RING}`}
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("guide_workbench_exit_reason_placeholder")}
          data-tt-guide-workbench-exit-reason="1"
        />
        <div className="mt-3">
          <button
            type="button"
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-md border border-amber-500/40 bg-amber-900/30 px-4 text-small font-semibold text-amber-100 hover:bg-amber-900/50 disabled:opacity-50 ${FOCUS_RING}`}
            onClick={() => void onSubmit()}
            disabled={!canSubmit || submitting}
            data-tt-guide-workbench-exit-submit="1"
          >
            {submitting ? t("guide_workbench_exit_submitting") : t("guide_workbench_exit_submit")}
          </button>
        </div>
        {errorBlock}
      </div>
    </details>
  );
}
