"use client";

import Link from "next/link";
import type { MeTrustSummary } from "@/lib/meTrust";
import { formatKycStatusLabelCompact } from "@/lib/meTrust";
import { FOCUS_RING } from "@/components/me/constants";
import type { GuideWorkbenchGateProgressView, GuideWorkbenchGateStep } from "@/lib/guide/guideWorkbenchGateProgressModel";
import {
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchL5ClosureSprintModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchGateProgressCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  view: GuideWorkbenchGateProgressView;
  trust: MeTrustSummary;
  onRefresh?: () => void;
};

function StepIcon({ state }: { state: GuideWorkbenchGateStep["state"] }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/12 text-success text-meta font-bold" aria-hidden>
        ✓
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/10 text-warning/95 text-meta" aria-hidden>
        …
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600/60 bg-slate-800/50 text-slate-500 text-meta" aria-hidden>
        —
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ref-sun/45 bg-ref-sun/12 text-ref-sun text-meta font-semibold" aria-hidden>
      ○
    </span>
  );
}

function ChecklistRow({ step, t }: { step: GuideWorkbenchGateStep; t: GuideWorkbenchGateProgressCardProps["t"] }) {
  const body = (
    <>
      <StepIcon state={step.state} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-slate-100">{t(step.labelKey)}</span>
          <span
            className={
              step.state === "done"
                ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success/90"
                : step.state === "blocked"
                  ? "rounded-full border border-slate-600/50 bg-slate-800/40 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                  : "rounded-full border border-ref-sun/22 bg-ref-sun/8 px-2 py-0.5 text-[10px] font-medium text-slate-400"
            }
          >
            {step.statusText}
          </span>
        </span>
        <span className="mt-0.5 block text-meta text-slate-400/95">{t(step.descKey)}</span>
      </span>
    </>
  );

  if (step.state === "action" && step.href) {
    return (
      <Link href={step.href} className="flex items-start gap-3 rounded-lg px-1 py-2 hover:bg-ref-sun/[0.04] motion-sub">
        {body}
      </Link>
    );
  }

  return <div className="flex items-start gap-3 rounded-lg px-1 py-2">{body}</div>;
}

/** 准入进度：资质 + KYC + 挂牌（合并原横幅 / 新向导条 / 信任快照） */
export default function GuideWorkbenchGateProgressCard({
  t,
  view,
  trust,
  onRefresh,
}: GuideWorkbenchGateProgressCardProps) {
  const kycLabel = formatKycStatusLabelCompact(trust.kyc_status, t);
  const repScore = trust.reputation?.as_guide?.weighted_avg_score;
  const repLabel =
    repScore != null && Number.isFinite(repScore)
      ? repScore.toFixed(2)
      : t("guide_workbench_trust_summary_reputation_empty");

  return (
    <section
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1 border border-ref-sun/25 bg-ref-sun/[0.05]`}
      aria-label={t("guide_workbench_gate_aria")}
      data-tt-guide-workbench-gate-progress="1"
      data-tt-guide-workbench-gate-variant={view.variant}
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t(view.titleKey)}</h2>
      <p className={`${TT_WORKSPACE_L5.sectionSubtitle} mt-1`}>{t(view.subtitleKey)}</p>

      <ul className="mt-4 space-y-1" role="list">
        {view.steps.map((step) => (
          <li key={step.id} className="list-none">
            <ChecklistRow step={step} t={t} />
          </li>
        ))}
      </ul>

      {view.registrationRejected && view.registrationCodes.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2 px-1" role="list">
          {view.registrationCodes.map((c) => (
            <li key={c}>
              <span className="inline-block rounded-[var(--radius-sm)] border border-slate-600/80 bg-slate-900/60 px-2 py-0.5 text-meta font-mono text-slate-200">
                {c}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {view.registrationRejected && view.registrationMessage ? (
        <p className="mt-2 px-1 text-meta text-slate-300">{view.registrationMessage}</p>
      ) : null}

      {view.showRiskStrip ? (
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-3 border-t border-ref-sun/12 pt-4">
          <div className={`${TT_WORKSPACE_L5.statTile} min-w-[5.5rem]`}>
            <p className={TT_WORKSPACE_L5.statValue}>{kycLabel}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("guide_workbench_trust_summary_kyc")}</p>
          </div>
          <div className={`${TT_WORKSPACE_L5.statTile} min-w-[5.5rem]`}>
            <p className={TT_WORKSPACE_L5.statValueAccent}>{repLabel}</p>
            <p className={TT_WORKSPACE_L5.statLabel}>{t("guide_workbench_trust_summary_reputation")}</p>
          </div>
          {trust.risk_level ? (
            <div className={`${TT_WORKSPACE_L5.statTile} min-w-[5.5rem]`}>
              <p className={TT_WORKSPACE_L5.statValue}>{trust.risk_level}</p>
              <p className={TT_WORKSPACE_L5.statLabel}>{t("guide_workbench_trust_summary_risk")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        {view.primaryCta.kind === "refresh" && onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}
          >
            {t(view.primaryCta.labelKey)}
          </button>
        ) : view.primaryCta.kind === "link" ? (
          <Link href={view.primaryCta.href} className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}>
            {t(view.primaryCta.labelKey)}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
