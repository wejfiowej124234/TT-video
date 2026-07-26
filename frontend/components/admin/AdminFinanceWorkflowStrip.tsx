"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_FINANCE_WORKFLOW_STEPS,
  type AdminFinanceWorkflowSnapshotKey,
} from "@/lib/admin/adminFinanceWorkflowModel";
import {
  adminFinanceWorkflowSnapshotValue,
  useAdminFinanceWorkflowSnapshots,
} from "@/lib/admin/useAdminFinanceWorkflowSnapshots";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_FIN_WORKFLOW_SNAPSHOT_BADGE_CLASS,
  ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_NOTICE_INFO_CLASS,
} from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 财务工作流入口（列表快照徽标 · ≠ 待办计数）。 */
export function AdminFinanceWorkflowStrip() {
  const { t } = useTranslation();
  const snapshots = useAdminFinanceWorkflowSnapshots();
  const stepCount = ADMIN_FINANCE_WORKFLOW_STEPS.length;

  return (
    <AdminWarmL5Surface
      as="section"
      className="mt-6"
      aria-labelledby="admin-fin-workflow-heading"
      data-tt-admin-fin-workflow="1"
      data-tt-admin-fin-suite-primary-nav="workflow"
      data-tt-admin-fin-workflow-step-count={String(stepCount)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="admin-fin-workflow-heading" className="text-body font-semibold text-ink-900">
          {t("admin_fin_workflow_title")}
        </h2>
        {snapshots.error ? (
          <button
            type="button"
            className={`text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            onClick={snapshots.reload}
            data-tt-admin-fin-workflow-retry="1"
          >
            {t("admin_fin_workflow_snapshot_retry")}
          </button>
        ) : null}
      </div>
      <p className={`mt-2 ${ADMIN_NOTICE_INFO_CLASS}`}>{t("admin_fin_workflow_phase_note")}</p>
      <p className="mt-2 text-meta text-ink-500" role="note" data-tt-admin-fin-workflow-snapshot-honesty="1">
        {t("admin_fin_workflow_snapshot_honesty")}
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ADMIN_FINANCE_WORKFLOW_STEPS.map((step, idx) => {
          const snapKey = step.snapshotKey as AdminFinanceWorkflowSnapshotKey | null;
          const snapValue = snapKey ? adminFinanceWorkflowSnapshotValue(snapKey, snapshots) : null;
          const snapLabel =
            snapshots.loading
              ? "…"
              : snapValue === null
                ? t("admin_fin_workflow_snapshot_na")
                : snapValue > 99
                  ? t("admin_fin_workflow_snapshot_capped", { n: 99 })
                  : t("admin_fin_workflow_snapshot_in_list", { n: snapValue });
          return (
            <li
              key={step.id}
              className={ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS}
              data-tt-admin-fin-workflow-step={step.id}
              data-tt-admin-fin-not-refund-center={step.id === "refunds" ? "1" : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-meta font-medium text-slate-400">
                  {t("admin_fin_workflow_step", { n: idx + 1 })}
                </span>
                {snapKey ? (
                  <span
                    className={ADMIN_FIN_WORKFLOW_SNAPSHOT_BADGE_CLASS}
                    data-tt-admin-fin-workflow-snapshot={step.id}
                    data-tt-admin-fin-workflow-snapshot-kind="list-cap"
                    title={t("admin_fin_workflow_snapshot_title")}
                  >
                    {snapLabel}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1 text-small font-semibold text-slate-100">{t(step.titleKey)}</h3>
              <p className="mt-1 text-meta text-slate-400">{t(step.descKey)}</p>
              <Link
                href={step.href}
                className={`mt-2 inline-block text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              >
                {t("admin_fin_workflow_open")}
              </Link>
            </li>
          );
        })}
      </ol>
    </AdminWarmL5Surface>
  );
}
