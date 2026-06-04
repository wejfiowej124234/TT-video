"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_TIMELINE_DOT_CLASS, ADMIN_TIMELINE_RAIL_CLASS } from "@/lib/adminUi";

import type { ApprovalTimelineStep } from "../adminApprovalWorkflowModel";

type Props = { steps: ApprovalTimelineStep[] };

const STEP_LABEL: Record<ApprovalTimelineStep["kind"], string> = {
  requested: "admin_approval_timeline_requested",
  pending: "admin_approval_timeline_pending",
  approved: "admin_approval_timeline_approved",
  rejected: "admin_approval_timeline_rejected",
  cancelled: "admin_approval_timeline_cancelled",
};

export function AdminApprovalDetailTimeline({ steps }: Props) {
  const { t } = useTranslation();

  if (steps.length === 0) return null;

  return (
    <ol
      className={`mt-4 space-y-0 ${ADMIN_TIMELINE_RAIL_CLASS}`}
      aria-label={t("admin_approval_timeline_aria")}
      data-tt-admin-approval-timeline="1"
    >
      {steps.map((step, idx) => {
        const at =
          step.at && step.at.trim()
            ? new Date(step.at).toLocaleString()
            : t("admin_em_dash");
        return (
          <li key={step.id} className="relative pb-4 last:pb-0">
            <span className={ADMIN_TIMELINE_DOT_CLASS} aria-hidden />
            <p className="text-small font-semibold text-ink-900">{t(STEP_LABEL[step.kind])}</p>
            <p className="text-meta text-ink-500">
              {t("admin_approval_timeline_at")}: {at}
            </p>
            {step.actor ? (
              <p className="text-meta text-ink-600 break-all">
                {t("admin_approval_timeline_actor")}: {step.actor}
              </p>
            ) : null}
            {step.note ? (
              <p className="mt-1 rounded-[var(--radius-md)] bg-ink-50 p-2 text-meta text-ink-700 whitespace-pre-wrap break-words">
                {step.note}
              </p>
            ) : null}
            {idx < steps.length - 1 ? null : null}
          </li>
        );
      })}
    </ol>
  );
}
